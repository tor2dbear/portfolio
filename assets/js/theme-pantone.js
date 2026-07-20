/**
 * Pantone / Colour-of-the-Year controller.
 *
 * Everything between the settings UI and the lazily-loaded CotyScale engine
 * (coty-scale.js): the pantone state machine (inactive/paused/playing), the
 * playback loop and shuffle, the year stepping, and the floating transport
 * pill (collapse/expand choreography, player buttons, layout-aware placement).
 *
 * Extracted from theme.js. It drives the theme only through the window.Theme
 * seam (palette commit/apply, blend save/restore, footer label, transitions)
 * and owns all pantone state and DOM nodes. It publishes window.ThemePantone;
 * theme.js keeps thin lazy shims at its call sites and re-exports the pantone
 * members of window.Theme through the same delegation, so consumers (the
 * terminal's `pantone` command, the settings dropdown) are unchanged.
 *
 * Load AFTER theme.js. This module registers no DOMContentLoaded handler of
 * its own: theme.js's init drives the hooks below (initControls,
 * reconcileStartupPalette, initTransportUI) at exactly the positions the
 * inlined code used to run, so boot order is untouched.
 */

(function () {
  "use strict";

  // Theme seam, captured at eval (theme.js publishes window.Theme at its own
  // module eval, before this file runs).
  var Theme = window.Theme || {};
  var setBlendEnabled = Theme.setBlendEnabled;
  var commitPaletteSelection = Theme.commitPaletteSelection;
  var isTerminalLayout = Theme.isTerminalLayout;
  var applyPalette = Theme.applyPalette;
  var updatePaletteUI = Theme.updatePaletteUI;
  var updateFooterPaletteLabel = Theme.updateFooterPaletteLabel;
  var runThemeTransition = Theme.runThemeTransition;
  var animateThemeColorMeta = Theme.animateThemeColorMeta;
  // DOM nodes, initialized by initControls().
  let cotyYearSelects;
  let cotyModeToggles;
  const COTY_YEAR_KEY = "theme-coty-year";
  const COTY_STATE_KEY = "theme-pantone-state";
  // theme.js owns this key (its commitPaletteSelection writes it); the literal
  // is duplicated here for setPantoneState's restore read. Keep in sync.
  const LAST_NON_PANTONE_PALETTE_KEY = "theme-last-non-pantone-palette";
  const PRE_PANTONE_BLEND_KEY = "theme-pre-pantone-blend";
  const COTY_SESSION_YEAR_KEY = "theme-coty-year-session";
  // Duplicated as literals on window.Theme (the terminal copies the value at
  // its own eval); this is the canonical definition.
  const PANTONE_MANUAL_TRANSITION_MS = 4000;
  // Resolved by reconcileStartupPalette() for onPaletteApplied() to consume.
  let initialPantoneState = "inactive";
  let prePantoneBlendEnabled = null;
  // Set when Pantone is activated before the CotyScale engine has lazy-loaded:
  // getLatestCotyYear() can't see the real entries yet, so the true latest year
  // is applied once the engine finishes loading (see applyPalette / setPantoneState).
  let pantoneNeedsLatestYear = false;

  function getCotyActions() {
    return window.CotyScaleActions || null;
  }

  // CotyScale (the Pantone engine, ~52KB) is not in the global bundle. It is
  // loaded on demand the first time Pantone is needed. Callbacks queued before
  // the script finishes loading all run once it is ready. `init()` is invoked
  // on first load so applyForMode()/state is set up before callers use it.
  const cotyLoadCallbacks = [];
  let cotyLoadStarted = false;

  function ensureCotyLoaded(callback) {
    if (window.CotyScaleActions) {
      if (callback) {
        callback(window.CotyScaleActions);
      }
      return;
    }
    if (callback) {
      cotyLoadCallbacks.push(callback);
    }
    if (cotyLoadStarted) {
      return;
    }
    cotyLoadStarted = true;

    const finish = (actions) => {
      if (actions && typeof actions.init === "function") {
        actions.init();
      }
      while (cotyLoadCallbacks.length) {
        cotyLoadCallbacks.shift()(actions);
      }
    };

    let script = document.querySelector("script[data-coty-scale]");
    if (!script) {
      const src = window.__cotyScaleSrc;
      if (!src) {
        finish(null);
        return;
      }
      script = document.createElement("script");
      script.src = src;
      script.setAttribute("data-coty-scale", "");
      document.head.appendChild(script);
    }
    script.addEventListener(
      "load",
      () => finish(window.CotyScaleActions || null),
      { once: true }
    );
    script.addEventListener("error", () => finish(null), { once: true });
  }

  function getCurrentCotyYear() {
    const actions = getCotyActions();
    if (actions && typeof actions.getCurrentYear === "function") {
      return actions.getCurrentYear();
    }
    const attr = Number(
      document.documentElement.getAttribute("data-coty-year")
    );
    if (attr) {
      return attr;
    }
    const stored = Number(localStorage.getItem(COTY_YEAR_KEY));
    return stored || 2026;
  }

  function getCotyEntryByYear(year) {
    const actions = getCotyActions();
    if (actions && typeof actions.getEntry === "function") {
      return actions.getEntry(Number(year) || getCurrentCotyYear());
    }
    return null;
  }

  function formatCotyTrackText(entry) {
    if (!entry || !entry.year) {
      return "";
    }
    return String(entry.year) + " \u2014 " + String(entry.name || "");
  }

  function isPantonePaletteSelected() {
    return (
      (document.documentElement.getAttribute("data-palette") || "standard") ===
      "pantone"
    );
  }

  function normalizePantoneState(state) {
    // Pantone is on/off. Legacy "playing"/"paused" (from older localStorage or
    // shared ?theme= URLs) collapse to "active" so they don't wedge startup.
    if (state && state !== "inactive") {
      return "active";
    }
    return "inactive";
  }

  function getPantoneState() {
    const attr = document.documentElement.getAttribute("data-pantone-state");
    if (attr) {
      return normalizePantoneState(attr);
    }
    return normalizePantoneState(localStorage.getItem(COTY_STATE_KEY));
  }

  function isPantoneModeActive() {
    return getPantoneState() !== "inactive";
  }

  function syncCotyModeButtons() {
    const active = isPantoneModeActive();
    if (!cotyModeToggles) {
      return;
    }
    cotyModeToggles.forEach((button) => {
      const activateLabel =
        button.getAttribute("data-label-activate") || "Activate Pantone";
      const deactivateLabel =
        button.getAttribute("data-label-deactivate") || "Deactivate Pantone";
      button.setAttribute(
        "aria-label",
        active ? deactivateLabel : activateLabel
      );
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.setAttribute("data-active", active ? "true" : "false");
    });
  }

  function getNextCotyYear(step) {
    const actions = getCotyActions();
    if (!actions || typeof actions.getEntries !== "function") {
      return getCurrentCotyYear();
    }
    const entries = actions.getEntries();
    if (!entries || !entries.length) {
      return getCurrentCotyYear();
    }
    const currentYear = getCurrentCotyYear();
    const currentIndex = Math.max(
      0,
      entries.findIndex((entry) => Number(entry.year) === Number(currentYear))
    );

    const nextIndex = (currentIndex + step + entries.length) % entries.length;
    return Number(entries[nextIndex].year);
  }

  function advanceCotyYear(step, options) {
    const opts = options || {};
    const nextYear = getNextCotyYear(step);
    setCotyYear(nextYear, opts);
  }

  function getLatestCotyYear() {
    const actions = getCotyActions();
    if (!actions || typeof actions.getEntries !== "function") {
      return getCurrentCotyYear();
    }
    const entries = actions.getEntries();
    if (!entries || !entries.length) {
      return getCurrentCotyYear();
    }
    return entries.reduce(function (latest, entry) {
      const year = Number(entry.year) || 0;
      return year > latest ? year : latest;
    }, 0);
  }

  function setPantoneState(state, options) {
    const nextState = normalizePantoneState(state);
    const previousState = getPantoneState();
    const opts = options || {};

    // When activating from inactive: remember current blend state and ensure tritone is on
    if (previousState === "inactive" && nextState !== "inactive") {
      prePantoneBlendEnabled =
        document.documentElement.getAttribute("data-effect-blend") === "on";
      try {
        localStorage.setItem(
          PRE_PANTONE_BLEND_KEY,
          prePantoneBlendEnabled ? "1" : "0"
        );
      } catch {
        // Ignore storage failures.
      }
      setBlendEnabled(true, { silent: true });
    }

    document.documentElement.setAttribute("data-pantone-state", nextState);
    localStorage.setItem(COTY_STATE_KEY, nextState);

    if (nextState === "inactive") {
      // Restore the blend state that was active before pantone was turned on.
      // Fall back to localStorage in case the page was reloaded while pantone was active.
      let blendToRestore = prePantoneBlendEnabled;
      if (blendToRestore === null) {
        try {
          const stored = localStorage.getItem(PRE_PANTONE_BLEND_KEY);
          if (stored !== null) {
            blendToRestore = stored === "1";
          }
        } catch {
          // Ignore storage failures.
        }
      }
      try {
        localStorage.removeItem(PRE_PANTONE_BLEND_KEY);
      } catch {
        // Ignore storage failures.
      }
      prePantoneBlendEnabled = null;
      if (blendToRestore !== null) {
        setBlendEnabled(blendToRestore, { silent: true });
      }
      if (opts.syncPalette !== false && isPantonePaletteSelected()) {
        const fallback =
          localStorage.getItem(LAST_NON_PANTONE_PALETTE_KEY) || "standard";
        commitPaletteSelection(fallback === "pantone" ? "standard" : fallback, {
          toast: false,
        });
      }
      syncCotyPlayerUI();
      return;
    }

    if (previousState === "inactive" && opts.resetYear !== false) {
      let sessionYear = null;
      try {
        const stored = sessionStorage.getItem(COTY_SESSION_YEAR_KEY);
        sessionYear = stored ? Number(stored) || null : null;
      } catch {
        // Ignore storage failures.
      }
      // If there's no session-selected year and the engine isn't loaded yet,
      // getLatestCotyYear() falls back to the stored/last year rather than the
      // real latest entry — flag a correction once CotyScale loads.
      if (!sessionYear) {
        const actions = getCotyActions();
        let entriesReady = false;
        if (actions && typeof actions.getEntries === "function") {
          const entries = actions.getEntries();
          entriesReady = !!(entries && entries.length);
        }
        if (!entriesReady) {
          pantoneNeedsLatestYear = true;
        }
      }
      setCotyYear(sessionYear || getLatestCotyYear(), {
        silent: true,
        activatePantone: false,
      });
    }

    if (opts.syncPalette !== false && !isPantonePaletteSelected()) {
      commitPaletteSelection("pantone", { toast: false });
    } else {
      updateFooterPaletteLabel("pantone");
    }

    syncCotyPlayerUI();
  }

  function activatePantone(options) {
    const opts = options || {};
    setPantoneState("active", {
      syncPalette: true,
      resetYear: opts.resetYear !== false,
    });
  }

  function stopPantone() {
    setPantoneState("inactive", { syncPalette: true });
  }

  function togglePantoneMode() {
    if (isPantoneModeActive()) {
      stopPantone();
      return;
    }
    activatePantone({ resetYear: true });
  }

  function syncCotyPlayerUI() {
    syncCotyModeButtons();
  }

  function showCotyYearToast(entry) {
    if (!entry || !window.Toast) {
      return;
    }
    const el = document.querySelector('[data-js="footer-palette"]');
    const category = el ? el.getAttribute("data-category") : "";
    const icon = el ? el.getAttribute("data-toast-icon") : "";
    window.Toast.show(category, formatCotyTrackText(entry), { icon: icon });
  }

  function syncCotyYearUI(year) {
    if (!cotyYearSelects) {
      return;
    }
    cotyYearSelects.forEach((select) => {
      select.value = String(year);
    });
  }

  function setCotyYear(year, options) {
    const opts = options || {};
    const actions = getCotyActions();
    let entry = null;

    if (opts.transitionDuration) {
      runThemeTransition(opts.transitionDuration);
    }

    if (actions && typeof actions.getEntry === "function" && opts.skipApply) {
      const numericYear = Number(year) || actions.getCurrentYear();
      entry = actions.getEntry(numericYear);
      if (entry && entry.year) {
        document.documentElement.setAttribute(
          "data-coty-year",
          String(entry.year)
        );
      }
    } else if (actions && typeof actions.setYear === "function") {
      entry = actions.setYear(year, {
        entryOverride: opts.entryOverride || null,
      });
    } else {
      const numeric = Number(year) || 2026;
      document.documentElement.setAttribute("data-coty-year", String(numeric));
      entry = { year: numeric };
    }

    if (!entry || !entry.year) {
      return;
    }

    try {
      localStorage.setItem(COTY_YEAR_KEY, String(entry.year));
      if (opts.fromUser) {
        sessionStorage.setItem(COTY_SESSION_YEAR_KEY, String(entry.year));
      }
    } catch {
      // Ignore storage failures.
    }

    syncCotyYearUI(entry.year);
    const currentPalette =
      document.documentElement.getAttribute("data-palette") || "standard";
    if (opts.activatePantone !== false && currentPalette !== "pantone") {
      localStorage.setItem("theme-palette", "pantone");
      applyPalette("pantone");
      updatePaletteUI("pantone");
      window.dispatchEvent(
        new window.CustomEvent("theme:palette-changed", {
          detail: { palette: "pantone" },
        })
      );
    } else {
      updateFooterPaletteLabel(currentPalette);
      // No explicit fallback: animateThemeColorMeta defaults a falsy duration
      // to the theme's standard swap transition (700ms) itself.
      animateThemeColorMeta(opts.transitionDuration);
    }

    if (!opts.silent) {
      showCotyYearToast(entry);
      window.dispatchEvent(
        new window.CustomEvent("theme:coty-year-changed", {
          detail: { year: entry.year, name: entry.name || "" },
        })
      );
    }
  }

  function initCotyYearControls() {
    const actions = getCotyActions();
    if (
      !cotyYearSelects ||
      !cotyYearSelects.length ||
      !actions ||
      typeof actions.getEntries !== "function"
    ) {
      return;
    }

    const entries = actions.getEntries();
    if (!entries || !entries.length) {
      return;
    }

    cotyYearSelects.forEach((select) => {
      select.innerHTML = "";
      entries.forEach((entry) => {
        const option = document.createElement("option");
        option.value = String(entry.year);
        option.textContent = String(entry.year) + " \u2014 " + entry.name;
        select.appendChild(option);
      });
      select.addEventListener("change", function () {
        setCotyYear(this.value, {
          transitionDuration: PANTONE_MANUAL_TRANSITION_MS,
          fromUser: true,
        });
      });
    });

    const initialYear =
      Number(localStorage.getItem(COTY_YEAR_KEY)) || actions.getCurrentYear();
    setCotyYear(initialYear, {
      silent: true,
      activatePantone: false,
      skipApply: true,
    });
  }

  function initCotyModeControls() {
    if (cotyModeToggles) {
      cotyModeToggles.forEach((button) => {
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          togglePantoneMode();
        });
      });
    }

    syncCotyPlayerUI();
  }

  // The coty side of theme.js's applyMode: refresh the engine's mode-sensitive
  // preview, and when the pantone palette is active re-apply the scale for the
  // resolved mode. (Lifted verbatim.)
  function onModeApplied(mode) {
    const cotyActions = window.CotyScaleActions || null;
    if (cotyActions && typeof cotyActions.applyPreviewForMode === "function") {
      cotyActions.applyPreviewForMode(
        document.documentElement.getAttribute("data-mode") || mode,
        getCurrentCotyYear()
      );
    }
    if (
      cotyActions &&
      typeof cotyActions.applyForMode === "function" &&
      (document.documentElement.getAttribute("data-palette") || "standard") ===
        "pantone"
    ) {
      cotyActions.applyForMode(
        document.documentElement.getAttribute("data-mode") || mode
      );
    }
  }

  // The pantone side of theme.js's applyPalette: load the engine on demand and
  // apply the scale (correcting to the true latest year if activation raced
  // the lazy load), or clear the engine's runtime tokens for non-pantone
  // palettes. (Lifted verbatim.)
  function onPaletteApplied(palette) {
    if (palette === "pantone") {
      // Pantone needs the lazily-loaded CotyScale engine; load it on demand.
      ensureCotyLoaded(function (cotyActions) {
        if (cotyActions && typeof cotyActions.applyForMode === "function") {
          // A fresh activation before the engine loaded picked a fallback year;
          // now that the real entries exist, correct to the actual latest year
          // before applying so the scale matches "activation starts on latest".
          if (pantoneNeedsLatestYear) {
            pantoneNeedsLatestYear = false;
            setCotyYear(getLatestCotyYear(), {
              silent: true,
              activatePantone: false,
            });
          }
          cotyActions.applyForMode(
            document.documentElement.getAttribute("data-mode") || "light"
          );
          syncCotyPlayerUI();
        }
      });
    } else {
      const cotyActions = getCotyActions();
      if (cotyActions && typeof cotyActions.clearRuntime === "function") {
        cotyActions.clearRuntime();
      }
    }
  }

  // ==========================================================================
  // Init hooks — driven by theme.js's DOMContentLoaded init, in this order and
  // at the positions the inlined code used to run.
  // ==========================================================================

  // Pantone selectors + the CotyScale engine + year/mode controls.
  function initControls() {
    cotyYearSelects = document.querySelectorAll('[data-js="coty-year-theme"]');
    cotyModeToggles = document.querySelectorAll('[data-js="coty-mode-toggle"]');
    if (
      window.CotyScaleActions &&
      typeof window.CotyScaleActions.init === "function"
    ) {
      window.CotyScaleActions.init();
    }
    initCotyYearControls();
    initCotyModeControls();
  }

  // Reconcile the stored palette with the stored pantone state (a pantone
  // palette with an inactive state resumes active; an active state forces the
  // pantone palette back on). Returns the palette theme.js should boot with;
  // the resolved state is kept for initTransportUI().
  function reconcileStartupPalette(candidatePalette) {
    let initialPalette = candidatePalette;
    const storedPalette = localStorage.getItem("theme-palette") || "standard";
    initialPantoneState = normalizePantoneState(
      localStorage.getItem(COTY_STATE_KEY)
    );
    if (initialPalette === "pantone" && initialPantoneState === "inactive") {
      initialPantoneState = "active";
    }
    if (initialPalette !== "pantone" && initialPantoneState !== "inactive") {
      initialPalette = "pantone";
      localStorage.setItem("theme-palette", initialPalette);
    }
    if (initialPalette !== storedPalette) {
      localStorage.setItem("theme-palette", initialPalette);
    }
    document.documentElement.setAttribute(
      "data-pantone-state",
      initialPantoneState
    );
    localStorage.setItem(COTY_STATE_KEY, initialPantoneState);
    return initialPalette;
  }

  // Pantone UI bootstrapping: sync the activate/deactivate button to the
  // resolved startup state. (Kept as a named init hook that theme.js calls.)
  function initTransportUI() {
    syncCotyPlayerUI();
  }

  // ==========================================================================
  // Public seam (window.ThemePantone)
  // ==========================================================================
  window.ThemePantone = {
    // init hooks (theme.js init drives these, in order)
    initControls: initControls,
    reconcileStartupPalette: reconcileStartupPalette,
    initTransportUI: initTransportUI,
    // mode/palette application hooks (theme.js applyMode/applyPalette)
    onModeApplied: onModeApplied,
    onPaletteApplied: onPaletteApplied,
    // state machine + controls
    setPantoneState: setPantoneState,
    activatePantone: activatePantone,
    stopPantone: stopPantone,
    togglePantoneMode: togglePantoneMode,
    isPantoneModeActive: isPantoneModeActive,
    normalizePantoneState: normalizePantoneState,
    getPantoneState: getPantoneState,
    // years
    setCotyYear: setCotyYear,
    advanceCotyYear: advanceCotyYear,
    getCurrentCotyYear: getCurrentCotyYear,
    getCotyEntryByYear: getCotyEntryByYear,
    getLatestCotyYear: getLatestCotyYear,
    formatCotyTrackText: formatCotyTrackText,
    // engine access
    getCotyActions: getCotyActions,
    ensureCotyLoaded: ensureCotyLoaded,
    // ui sync
    syncCotyPlayerUI: syncCotyPlayerUI,
  };
})();
