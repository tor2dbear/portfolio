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
 * reconcileStartupPalette, rememberTransportHome, initTransportUI) at exactly
 * the positions the inlined code used to run, so boot order is untouched.
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
  var getPlayerSpriteUrl = Theme.getPlayerSpriteUrl;

  // Transport/player DOM nodes, initialized by initControls().
  let cotyYearSelects;
  let cotyTransportNodes;
  let cotyTransportTriggers;
  let cotyModeToggles;
  let cotyTransportPlayToggles;
  let cotyPlayIcons;
  let cotyPrevButtons;
  let cotyNextButtons;
  let cotyStopButtons;
  let cotyShuffleButtons;
  const COTY_YEAR_KEY = "theme-coty-year";
  const COTY_STATE_KEY = "theme-pantone-state";
  const COTY_SHUFFLE_KEY = "theme-coty-shuffle";
  // theme.js owns this key (its commitPaletteSelection writes it); the literal
  // is duplicated here for setPantoneState's restore read. Keep in sync.
  const LAST_NON_PANTONE_PALETTE_KEY = "theme-last-non-pantone-palette";
  const PRE_PANTONE_BLEND_KEY = "theme-pre-pantone-blend";
  const COTY_TRANSPORT_UI_KEY = "theme-pantone-transport-ui";
  const COTY_SESSION_YEAR_KEY = "theme-coty-year-session";
  const COTY_LOOP_INTERVAL_MS = 30000;
  const COTY_TRANSPORT_AUTO_COLLAPSE_MS = 4000;
  const COTY_TRANSPORT_HOVER_ENTER_DELAY_MS = 120;
  const COTY_TRANSPORT_HOVER_EXIT_DELAY_MS = COTY_TRANSPORT_AUTO_COLLAPSE_MS;
  const COTY_TRANSPORT_REOPEN_GUARD_MS = 220;
  // Duplicated as literals on window.Theme (the terminal copies the value at
  // its own eval); this is the canonical definition.
  const PANTONE_MANUAL_TRANSITION_MS = 4000;
  const PANTONE_AUTO_TRANSITION_MS = 1400;
  let cotyLoopTimer = null;
  let cotyTransportCollapseTimer = null;
  let cotyTransportHoverEnterTimer = null;
  let cotyShuffleEnabled = false;
  let cotyTransportUiState = "expanded";
  let cotyTransportInteractedWhileHovered = false;
  let cotyTransportHasUserEngaged = false;
  let cotyTransportLastCollapsedAt = 0;
  // Resolved by reconcileStartupPalette() for initTransportUI() to consume.
  let initialPantoneState = "inactive";
  let storedCotyTransportUiState = "expanded";
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
    if (state === "playing" || state === "paused") {
      return state;
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

  function isPantonePlaying() {
    return getPantoneState() === "playing";
  }

  function isAnyBottomSheetOpen() {
    return (
      document.documentElement.getAttribute("data-theme-panel-open") ===
        "true" ||
      document.documentElement.getAttribute("data-settings-panel-open") ===
        "true"
    );
  }

  function stopCotyTransportCollapseTimer() {
    if (cotyTransportCollapseTimer) {
      window.clearTimeout(cotyTransportCollapseTimer);
      cotyTransportCollapseTimer = null;
    }
  }

  function stopCotyTransportHoverEnterTimer() {
    if (cotyTransportHoverEnterTimer) {
      window.clearTimeout(cotyTransportHoverEnterTimer);
      cotyTransportHoverEnterTimer = null;
    }
  }

  function setCotyTransportUiState(state) {
    cotyTransportUiState = state === "collapsed" ? "collapsed" : "expanded";
    localStorage.setItem(COTY_TRANSPORT_UI_KEY, cotyTransportUiState);
    if (!cotyTransportNodes) {
      return;
    }
    cotyTransportNodes.forEach((node) => {
      node.setAttribute("data-ui-state", cotyTransportUiState);
    });
  }

  function collapseCotyTransport() {
    // Inline in the terminal the controls stay open — the collapse/hover
    // choreography is only for the floating pill.
    if (
      !isPantoneModeActive() ||
      isAnyBottomSheetOpen() ||
      isTerminalLayout()
    ) {
      return;
    }
    stopCotyTransportCollapseTimer();
    stopCotyTransportHoverEnterTimer();
    cotyTransportInteractedWhileHovered = false;
    cotyTransportLastCollapsedAt = Date.now();
    setCotyTransportUiState("collapsed");
  }

  function scheduleCotyTransportCollapse() {
    stopCotyTransportCollapseTimer();
    if (
      !isPantoneModeActive() ||
      isAnyBottomSheetOpen() ||
      isTerminalLayout()
    ) {
      return;
    }
    cotyTransportCollapseTimer = window.setTimeout(function () {
      collapseCotyTransport();
    }, COTY_TRANSPORT_AUTO_COLLAPSE_MS);
  }

  function expandCotyTransport(options) {
    stopCotyTransportCollapseTimer();
    stopCotyTransportHoverEnterTimer();
    if (!isPantoneModeActive()) {
      return;
    }
    setCotyTransportUiState("expanded");
    const opts = options || {};
    if (opts.autoCollapse !== false) {
      scheduleCotyTransportCollapse();
    }
  }

  function resetCotyTransportActivity() {
    cotyTransportHasUserEngaged = true;
    cotyTransportInteractedWhileHovered = true;
    expandCotyTransport({ autoCollapse: true });
  }

  function resumeCotyTransportAutoCollapse() {
    if (
      !isPantoneModeActive() ||
      isAnyBottomSheetOpen() ||
      cotyTransportUiState !== "expanded"
    ) {
      return;
    }
    scheduleCotyTransportCollapse();
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

  function syncCotyTransportVisibility() {
    const active = isPantoneModeActive();
    if (cotyTransportNodes) {
      cotyTransportNodes.forEach((node) => {
        if (active) {
          node.removeAttribute("hidden");
        } else {
          node.setAttribute("hidden", "");
        }
      });
    }
    if (!active) {
      stopCotyTransportCollapseTimer();
      stopCotyTransportHoverEnterTimer();
      cotyTransportHasUserEngaged = false;
      setCotyTransportUiState("expanded");
    }
  }

  // The Pantone controls are one node reused at every layout. In the terminal
  // they belong inline inside the settings panel (under the Effects toggles),
  // not floating over the page; everywhere else they float. Rather than
  // duplicate the DOM, move the node and remember its home so it returns to
  // exactly where it started when the user leaves the terminal.
  let cotyTransportHome = null;

  function rememberCotyTransportHome(node) {
    if (cotyTransportHome || !node || !node.parentNode) {
      return;
    }
    cotyTransportHome = { parent: node.parentNode, next: node.nextSibling };
  }

  function syncCotyTransportPlacement() {
    const node = document.querySelector('[data-js="coty-transport"]');
    if (!node) {
      return;
    }
    rememberCotyTransportHome(node);
    if (isTerminalLayout()) {
      const panel = document.querySelector('[data-js="settings-panel"]');
      const modeToggle = document.querySelector('[data-js="coty-mode-toggle"]');
      const anchor = modeToggle ? modeToggle.closest(".theme-section") : null;
      if (panel && anchor && anchor.parentNode === panel) {
        if (anchor.nextSibling !== node) {
          panel.insertBefore(node, anchor.nextSibling);
        }
      } else if (panel && node.parentNode !== panel) {
        panel.appendChild(node);
      }
      // Inline, it is always expanded — but only touch (and persist) the
      // ui-state when Pantone is actually active/visible, so entering the
      // terminal with the effect off doesn't clobber the floating pill's
      // collapsed preference.
      if (isPantoneModeActive()) {
        setCotyTransportUiState("expanded");
      }
    } else if (
      cotyTransportHome &&
      cotyTransportHome.parent &&
      cotyTransportHome.parent.isConnected &&
      node.parentNode !== cotyTransportHome.parent
    ) {
      // Only restore into a home that is still part of the live document, and
      // never anchor to a detached reference node.
      const ref =
        cotyTransportHome.next && cotyTransportHome.next.isConnected
          ? cotyTransportHome.next
          : null;
      cotyTransportHome.parent.insertBefore(node, ref);
      // Back as the floating pill: land in the collapsed three-dot resting
      // state right away rather than leaving the full player expanded (it was
      // forced open while inline in the terminal settings).
      if (isPantoneModeActive()) {
        setCotyTransportUiState("collapsed");
      }
    }
  }

  function syncCotyTransportPlayButtons() {
    const playing = isPantonePlaying();
    if (cotyTransportPlayToggles) {
      cotyTransportPlayToggles.forEach((button) => {
        const playLabel = button.getAttribute("data-label-play") || "Play";
        const pauseLabel = button.getAttribute("data-label-pause") || "Pause";
        button.setAttribute("aria-label", playing ? pauseLabel : playLabel);
        button.setAttribute("aria-pressed", playing ? "true" : "false");
        button.setAttribute("data-playing", playing ? "true" : "false");
      });
    }
    if (cotyPlayIcons) {
      const spriteUrl = getPlayerSpriteUrl();
      cotyPlayIcons.forEach((icon) => {
        icon.innerHTML = `<use href="${spriteUrl}#${
          playing ? "icon-player-pause" : "icon-player-play"
        }"></use>`;
      });
    }
  }

  function stopCotyLoopTimer() {
    if (cotyLoopTimer) {
      window.clearInterval(cotyLoopTimer);
      cotyLoopTimer = null;
    }
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

    if (cotyShuffleEnabled) {
      if (entries.length === 1) {
        return Number(entries[0].year);
      }
      let randomIndex = currentIndex;
      while (randomIndex === currentIndex) {
        randomIndex = Math.floor(Math.random() * entries.length);
      }
      return Number(entries[randomIndex].year);
    }

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

  function startCotyLoopTimer() {
    stopCotyLoopTimer();
    cotyLoopTimer = window.setInterval(function () {
      advanceCotyYear(1, {
        activatePantone: true,
        transitionDuration: PANTONE_AUTO_TRANSITION_MS,
      });
    }, COTY_LOOP_INTERVAL_MS);
  }

  function syncCotyPlaybackTimer() {
    if (isPantonePlaying()) {
      startCotyLoopTimer();
    } else {
      stopCotyLoopTimer();
    }
  }

  function setCotyShuffleEnabled(enabled) {
    cotyShuffleEnabled = Boolean(enabled);
    localStorage.setItem(COTY_SHUFFLE_KEY, cotyShuffleEnabled ? "1" : "0");
    if (cotyShuffleButtons) {
      cotyShuffleButtons.forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          cotyShuffleEnabled ? "true" : "false"
        );
      });
    }
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
      syncCotyPlaybackTimer();
      syncCotyPlayerUI();
      return;
    }

    if (previousState === "inactive") {
      cotyTransportHasUserEngaged = false;
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

    syncCotyPlaybackTimer();
    syncCotyPlayerUI();
    expandCotyTransport({ autoCollapse: true });
  }

  function activatePantone(options) {
    const opts = options || {};
    setPantoneState(opts.playing ? "playing" : "paused", {
      syncPalette: true,
      resetYear: opts.resetYear !== false,
    });
  }

  function playPantone() {
    activatePantone({
      playing: true,
      resetYear: !isPantoneModeActive(),
    });
  }

  function pausePantone() {
    if (!isPantoneModeActive()) {
      activatePantone({ playing: false, resetYear: true });
      return;
    }
    setPantoneState("paused", {
      syncPalette: true,
      resetYear: false,
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
    activatePantone({ playing: false, resetYear: true });
  }

  function togglePantonePlayback() {
    if (!isPantoneModeActive()) {
      playPantone();
      return;
    }
    if (isPantonePlaying()) {
      pausePantone();
      return;
    }
    playPantone();
  }

  function syncCotyPlayerUI() {
    syncCotyModeButtons();
    syncCotyTransportVisibility();
    syncCotyTransportPlayButtons();
    if (cotyShuffleButtons) {
      cotyShuffleButtons.forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          cotyShuffleEnabled ? "true" : "false"
        );
      });
    }
    if (isPantoneModeActive() && cotyTransportUiState === "collapsed") {
      setCotyTransportUiState("collapsed");
    }
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

  function initCotyPlayerControls() {
    cotyShuffleEnabled = localStorage.getItem(COTY_SHUFFLE_KEY) === "1";

    if (cotyPrevButtons) {
      cotyPrevButtons.forEach((button) => {
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          resetCotyTransportActivity();
          advanceCotyYear(-1, {
            activatePantone: false,
            transitionDuration: PANTONE_MANUAL_TRANSITION_MS,
            fromUser: true,
          });
        });
      });
    }

    if (cotyNextButtons) {
      cotyNextButtons.forEach((button) => {
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          resetCotyTransportActivity();
          advanceCotyYear(1, {
            activatePantone: false,
            transitionDuration: PANTONE_MANUAL_TRANSITION_MS,
            fromUser: true,
          });
        });
      });
    }

    if (cotyModeToggles) {
      cotyModeToggles.forEach((button) => {
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          togglePantoneMode();
        });
      });
    }

    if (cotyTransportPlayToggles) {
      cotyTransportPlayToggles.forEach((button) => {
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          resetCotyTransportActivity();
          togglePantonePlayback();
        });
      });
    }

    if (cotyShuffleButtons) {
      cotyShuffleButtons.forEach((button) => {
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          resetCotyTransportActivity();
          setCotyShuffleEnabled(!cotyShuffleEnabled);
        });
      });
    }

    if (cotyStopButtons) {
      cotyStopButtons.forEach((button) => {
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          resetCotyTransportActivity();
          stopPantone();
        });
      });
    }

    if (cotyTransportTriggers) {
      cotyTransportTriggers.forEach((button) => {
        function openTransport(autoCollapse) {
          stopCotyTransportHoverEnterTimer();
          cotyTransportHasUserEngaged = true;
          expandCotyTransport({ autoCollapse: autoCollapse !== false });
        }

        button.addEventListener("mouseenter", function () {
          if (
            cotyTransportUiState !== "collapsed" ||
            !isPantoneModeActive() ||
            Date.now() - cotyTransportLastCollapsedAt <
              COTY_TRANSPORT_REOPEN_GUARD_MS
          ) {
            return;
          }
          stopCotyTransportHoverEnterTimer();
          cotyTransportHoverEnterTimer = window.setTimeout(function () {
            openTransport(false);
          }, COTY_TRANSPORT_HOVER_ENTER_DELAY_MS);
        });
        button.addEventListener("mouseleave", stopCotyTransportHoverEnterTimer);
        button.addEventListener("focus", function () {
          openTransport(false);
        });
        button.addEventListener("pointerup", function (event) {
          if (event.pointerType === "mouse") {
            return;
          }
          event.stopPropagation();
          openTransport(true);
        });
        button.addEventListener("touchend", function (event) {
          event.stopPropagation();
          openTransport(true);
        });
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          openTransport(true);
        });
      });
    }

    if (cotyTransportNodes) {
      cotyTransportNodes.forEach((node) => {
        node.addEventListener("click", function (event) {
          event.stopPropagation();
        });
        node.addEventListener("mouseenter", function () {
          cotyTransportInteractedWhileHovered = false;
          if (cotyTransportHasUserEngaged) {
            expandCotyTransport({ autoCollapse: false });
          }
        });
        node.addEventListener("mouseleave", function () {
          stopCotyTransportHoverEnterTimer();
          if (cotyTransportInteractedWhileHovered) {
            stopCotyTransportCollapseTimer();
            cotyTransportCollapseTimer = window.setTimeout(function () {
              collapseCotyTransport();
            }, COTY_TRANSPORT_HOVER_EXIT_DELAY_MS);
            return;
          }
          collapseCotyTransport();
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

  // Transport/player selectors + the CotyScale engine + year/player controls.
  function initControls() {
    cotyYearSelects = document.querySelectorAll('[data-js="coty-year-theme"]');
    cotyTransportNodes = document.querySelectorAll(
      '[data-js="coty-transport"]'
    );
    cotyTransportTriggers = document.querySelectorAll(
      '[data-js="coty-transport-trigger"]'
    );
    cotyModeToggles = document.querySelectorAll('[data-js="coty-mode-toggle"]');
    cotyTransportPlayToggles = document.querySelectorAll(
      '[data-js="coty-transport-toggle"]'
    );
    cotyPlayIcons = document.querySelectorAll('[data-js="coty-play-icon"]');
    cotyPrevButtons = document.querySelectorAll('[data-js="coty-prev"]');
    cotyNextButtons = document.querySelectorAll('[data-js="coty-next"]');
    cotyStopButtons = document.querySelectorAll('[data-js="coty-stop"]');
    cotyShuffleButtons = document.querySelectorAll('[data-js="coty-shuffle"]');
    if (
      window.CotyScaleActions &&
      typeof window.CotyScaleActions.init === "function"
    ) {
      window.CotyScaleActions.init();
    }
    initCotyYearControls();
    initCotyPlayerControls();
  }

  // Reconcile the stored palette with the stored pantone state (a pantone
  // palette with an inactive state resumes paused; an active state forces the
  // pantone palette back on). Returns the palette theme.js should boot with;
  // the resolved state and transport-UI preference are kept for
  // initTransportUI().
  function reconcileStartupPalette(candidatePalette) {
    let initialPalette = candidatePalette;
    const storedPalette = localStorage.getItem("theme-palette") || "standard";
    storedCotyTransportUiState =
      localStorage.getItem(COTY_TRANSPORT_UI_KEY) === "collapsed"
        ? "collapsed"
        : "expanded";
    initialPantoneState = normalizePantoneState(
      localStorage.getItem(COTY_STATE_KEY)
    );
    if (initialPalette === "pantone" && initialPantoneState === "inactive") {
      initialPantoneState = "paused";
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

  // Record the transport's authored (floating) home before applyLayout can
  // move it, so returning from the terminal restores it correctly.
  function rememberTransportHome() {
    rememberCotyTransportHome(
      document.querySelector('[data-js="coty-transport"]')
    );
  }

  // Transport bootstrapping: playback timer, collapsed/expanded state, player
  // UI, layout-aware placement (kept in sync on theme:layout-changed), and the
  // sheet-closed resume hook.
  function initTransportUI() {
    syncCotyPlaybackTimer();
    setCotyTransportUiState(
      initialPantoneState !== "inactive"
        ? storedCotyTransportUiState
        : "expanded"
    );
    syncCotyPlayerUI();
    if (initialPantoneState !== "inactive") {
      if (storedCotyTransportUiState === "collapsed") {
        collapseCotyTransport();
      } else {
        expandCotyTransport({ autoCollapse: true });
      }
    }

    if (window.__cotyPlacementHandler) {
      window.removeEventListener(
        "theme:layout-changed",
        window.__cotyPlacementHandler
      );
    }
    window.__cotyPlacementHandler = syncCotyTransportPlacement;
    window.addEventListener("theme:layout-changed", syncCotyTransportPlacement);
    syncCotyTransportPlacement();

    window.addEventListener(
      "theme:sheet-closed",
      resumeCotyTransportAutoCollapse
    );
  }

  // ==========================================================================
  // Public seam (window.ThemePantone)
  // ==========================================================================
  window.ThemePantone = {
    // init hooks (theme.js init drives these, in order)
    initControls: initControls,
    reconcileStartupPalette: reconcileStartupPalette,
    rememberTransportHome: rememberTransportHome,
    initTransportUI: initTransportUI,
    // mode/palette application hooks (theme.js applyMode/applyPalette)
    onModeApplied: onModeApplied,
    onPaletteApplied: onPaletteApplied,
    // state machine + controls
    setPantoneState: setPantoneState,
    activatePantone: activatePantone,
    playPantone: playPantone,
    pausePantone: pausePantone,
    stopPantone: stopPantone,
    togglePantoneMode: togglePantoneMode,
    togglePantonePlayback: togglePantonePlayback,
    isPantoneModeActive: isPantoneModeActive,
    isPantonePlaying: isPantonePlaying,
    normalizePantoneState: normalizePantoneState,
    getPantoneState: getPantoneState,
    // years
    setCotyYear: setCotyYear,
    advanceCotyYear: advanceCotyYear,
    getCurrentCotyYear: getCurrentCotyYear,
    getCotyEntryByYear: getCotyEntryByYear,
    getLatestCotyYear: getLatestCotyYear,
    setCotyShuffleEnabled: setCotyShuffleEnabled,
    formatCotyTrackText: formatCotyTrackText,
    // engine access
    getCotyActions: getCotyActions,
    ensureCotyLoaded: ensureCotyLoaded,
    // ui sync
    syncCotyPlayerUI: syncCotyPlayerUI,
  };
})();
