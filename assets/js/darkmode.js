/**
 * Theme Management System (Mode + Palette + Typography)
 * Handles color mode (light/dark/system), color palette, and typography presets
 * with localStorage persistence and dropdown UI
 */

(function () {
  "use strict";

  // Theme dropdown selectors (will be initialized after DOM load)
  let themeIcon;
  let modeOptions;
  let paletteOptions;
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
  let typographyOptions;
  let layoutOptions;
  let effectBlendButtons;
  let effectGrainButtons;
  let effectMotionButtons;
  const CUSTOM_PALETTE_KEY = "theme-custom-palette";
  const COTY_YEAR_KEY = "theme-coty-year";
  const COTY_STATE_KEY = "theme-pantone-state";
  const COTY_SHUFFLE_KEY = "theme-coty-shuffle";
  const EFFECT_BLEND_KEY = "theme-effect-blend";
  const EFFECT_GRAIN_KEY = "theme-effect-grain";
  const EFFECT_MOTION_KEY = "theme-effect-reduced-motion";
  const LAST_NON_PANTONE_PALETTE_KEY = "theme-last-non-pantone-palette";
  const PRE_PANTONE_BLEND_KEY = "theme-pre-pantone-blend";
  const COTY_TRANSPORT_UI_KEY = "theme-pantone-transport-ui";
  const COTY_SESSION_YEAR_KEY = "theme-coty-year-session";
  const COTY_LOOP_INTERVAL_MS = 30000;
  const COTY_TRANSPORT_AUTO_COLLAPSE_MS = 4000;
  const COTY_TRANSPORT_HOVER_ENTER_DELAY_MS = 120;
  const COTY_TRANSPORT_HOVER_EXIT_DELAY_MS = COTY_TRANSPORT_AUTO_COLLAPSE_MS;
  const COTY_TRANSPORT_REOPEN_GUARD_MS = 220;
  const THEME_SWAP_TRANSITION_DEFAULT_MS = 700;
  const PANTONE_MANUAL_TRANSITION_MS = 4000;
  const PANTONE_AUTO_TRANSITION_MS = 1400;
  let appliedCustomTokenNames = [];
  let cotyLoopTimer = null;
  let themeTransitionTimer = null;
  let themeColorAnimFrame = null;
  let cotyTransportCollapseTimer = null;
  let cotyTransportHoverEnterTimer = null;
  let cotyShuffleEnabled = false;
  let cotyTransportUiState = "expanded";
  let cotyTransportInteractedWhileHovered = false;
  let cotyTransportHasUserEngaged = false;
  let cotyTransportLastCollapsedAt = 0;
  let playerSpriteUrl = "";
  let prePantoneBlendEnabled = null;
  // Set when Pantone is activated before the CotyScale engine has lazy-loaded:
  // getLatestCotyYear() can't see the real entries yet, so the true latest year
  // is applied once the engine finishes loading (see applyPalette / setPantoneState).
  let pantoneNeedsLatestYear = false;

  function getUseHref(use) {
    return (
      use.getAttribute("href") ||
      use.getAttribute("xlink:href") ||
      (use.href && use.href.baseVal) ||
      use.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
      ""
    );
  }

  function stopThemeTransitionTimer() {
    if (themeTransitionTimer) {
      window.clearTimeout(themeTransitionTimer);
      themeTransitionTimer = null;
    }
  }

  function runThemeTransition(durationMs) {
    if (!document.body) {
      return;
    }
    var duration = Number(durationMs) || THEME_SWAP_TRANSITION_DEFAULT_MS;
    stopThemeTransitionTimer();
    document.body.classList.remove("darkmodeTransition");
    document.body.style.setProperty(
      "--theme-transition-duration",
      duration + "ms"
    );
    void document.body.offsetWidth;
    document.body.classList.add("darkmodeTransition");
    themeTransitionTimer = window.setTimeout(function () {
      document.body.classList.remove("darkmodeTransition");
      document.body.style.removeProperty("--theme-transition-duration");
      themeTransitionTimer = null;
    }, duration);
  }

  function getPlayerSpriteUrl() {
    if (playerSpriteUrl) {
      return playerSpriteUrl;
    }

    const uses = document.querySelectorAll("svg use");
    for (let i = 0; i < uses.length; i += 1) {
      const href = getUseHref(uses[i]);
      if (href && href.indexOf("sprite.svg") !== -1) {
        playerSpriteUrl = href.split("#")[0];
        break;
      }
    }

    if (!playerSpriteUrl) {
      playerSpriteUrl = "/img/svg/sprite.svg?v=20260417a";
    }

    return playerSpriteUrl;
  }

  // ==========================================================================
  // MODE MANAGEMENT (light/dark/system)
  // ==========================================================================

  function setMode(mode) {
    localStorage.setItem("theme-mode", mode);
    runThemeTransition(THEME_SWAP_TRANSITION_DEFAULT_MS);
    applyMode(mode);
    updateModeUI(mode);

    var el = document.querySelector('[data-js="footer-mode"]');
    var category = el ? el.getAttribute("data-category") : "";
    var label = el ? el.getAttribute("data-label-" + mode) || mode : mode;
    var icon = el ? el.getAttribute("data-toast-icon") : "";
    if (window.Toast) {
      window.Toast.show(category, label, { icon: icon });
    }
  }

  function applyMode(mode) {
    var requestedMode = mode;
    if (mode === "system") {
      const systemMode = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      document.documentElement.setAttribute("data-mode", systemMode);
    } else {
      document.documentElement.setAttribute("data-mode", mode);
    }
    updateThemeIcon(mode);
    animateThemeColorMeta(THEME_SWAP_TRANSITION_DEFAULT_MS);
    updateFooterModeLabel(mode);
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

    // Recompute mode-sensitive runtime tokens for custom palettes
    if (
      (document.documentElement.getAttribute("data-palette") || "standard") ===
      "custom"
    ) {
      applyStoredCustomPalette();
    }

    window.dispatchEvent(
      new window.CustomEvent("theme:mode-changed", {
        detail: {
          requestedMode: requestedMode,
          mode: document.documentElement.getAttribute("data-mode") || "light",
        },
      })
    );
  }

  function updateModeUI(currentMode) {
    modeOptions.forEach((option) => {
      const mode = option.getAttribute("data-mode");
      if (mode === currentMode) {
        option.classList.add("active");
        option.setAttribute("aria-current", "true");
      } else {
        option.classList.remove("active");
        option.removeAttribute("aria-current");
      }
    });
  }

  // ==========================================================================
  // PALETTE MANAGEMENT (standard/pantone)
  // ==========================================================================

  function setPalette(palette) {
    runThemeTransition(THEME_SWAP_TRANSITION_DEFAULT_MS);
    if (!commitPaletteSelection(palette)) {
      return;
    }
    if (palette === "pantone") {
      setPantoneState("paused", { syncPalette: false });
    } else {
      setPantoneState("inactive", { syncPalette: false });
    }
  }

  function applyPalette(palette) {
    if (palette === "custom") {
      if (!applyStoredCustomPalette()) {
        clearAppliedCustomTokens();
        palette = "standard";
        localStorage.setItem("theme-palette", palette);
      }
    } else {
      clearAppliedCustomTokens();
    }
    document.documentElement.setAttribute("data-palette", palette);

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

    updateFooterPaletteLabel(palette);
    syncCotyPlayerUI();
    animateThemeColorMeta(THEME_SWAP_TRANSITION_DEFAULT_MS);
  }

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

  function formatPaletteLabel(baseLabel, palette) {
    if (palette !== "pantone") {
      return baseLabel;
    }
    const year = getCurrentCotyYear();
    return baseLabel + " (" + year + ")";
  }

  function updatePaletteUI(currentPalette) {
    paletteOptions.forEach((option) => {
      const palette = option.getAttribute("data-palette");
      if (palette === currentPalette) {
        option.classList.add("active");
        option.setAttribute("aria-current", "true");
      } else {
        option.classList.remove("active");
        option.removeAttribute("aria-current");
      }
    });
  }

  function loadCustomPalette() {
    try {
      const raw = localStorage.getItem(CUSTOM_PALETTE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      if (parsed.version >= 2) {
        if (!parsed.roles || typeof parsed.roles !== "object") {
          return null;
        }
        return parsed;
      }
      if (!parsed.tokens || typeof parsed.tokens !== "object") {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  function hasCustomPalette() {
    return Boolean(loadCustomPalette());
  }

  function clearAppliedCustomTokens() {
    appliedCustomTokenNames.forEach((name) => {
      document.documentElement.style.removeProperty(name);
    });
    appliedCustomTokenNames = [];
  }

  function setCustomRuntimeToken(name, value) {
    document.documentElement.style.setProperty(name, value);
    if (appliedCustomTokenNames.indexOf(name) === -1) {
      appliedCustomTokenNames.push(name);
    }
  }

  function applyCustomImageTreatment(custom) {
    var deriveImageTokens =
      window.ThemeDerive && window.ThemeDerive.deriveImageTokens;
    if (typeof deriveImageTokens === "function") {
      var mode = document.documentElement.getAttribute("data-mode") || "light";
      var imageTokens = deriveImageTokens({
        roles: custom.roles || {},
        policies: custom.policies || {},
        mode: mode,
      });
      Object.entries(imageTokens).forEach(function (entry) {
        setCustomRuntimeToken(entry[0], entry[1]);
      });
      return;
    }

    // Fallback if derive module is unavailable.
    setCustomRuntimeToken("--image-grayscale", "0%");
    setCustomRuntimeToken("--image-blend-mode", "normal");
    setCustomRuntimeToken("--image-background", "transparent");
  }

  function applyCustomDerivedTokens(custom) {
    var derive = window.ThemeDerive && window.ThemeDerive.deriveRuntimeTokens;
    if (typeof derive !== "function") {
      return;
    }

    var derived = derive({
      roles: custom.roles || {},
      policies: custom.policies || {},
    });

    Object.entries(derived).forEach(function (entry) {
      var name = entry[0];
      var value = entry[1];
      setCustomRuntimeToken(name, value);
    });
  }

  function normalizeOverrideTokenName(key) {
    if (!key) {
      return "";
    }
    if (key.indexOf("--") === 0) {
      return key;
    }
    return "--" + key.replace(/_/g, "-");
  }

  function getCustomDerivedPaletteTokens(custom) {
    var derive = window.ThemeDerive && window.ThemeDerive.derivePaletteTokens;
    if (typeof derive !== "function") {
      return null;
    }
    if (!custom || !custom.roles) {
      return null;
    }
    return derive({
      roles: custom.roles,
      policies: custom.policies || {},
      component_overrides: custom.component_overrides || {},
    });
  }

  function getCustomPreviewValues(custom) {
    var preview = custom.preview || {};
    var derivePreview = window.ThemeDerive && window.ThemeDerive.derivePreview;
    var derivedPreview = null;
    if (typeof derivePreview === "function" && custom && custom.roles) {
      derivedPreview = derivePreview({
        roles: custom.roles,
        policies: custom.policies || {},
        component_overrides: custom.component_overrides || {},
      });
    }
    var derived = getCustomDerivedPaletteTokens(custom) || {};
    var tokens = custom.tokens || {};
    var primary =
      preview.primary ||
      preview.accent ||
      (derivedPreview && derivedPreview.primary) ||
      derived["--primary-strong"] ||
      tokens["--primary-strong"] ||
      derived["--accent-primary-strong"] ||
      tokens["--accent-primary-strong"] ||
      "var(--gray-11)";
    var surface =
      preview.surface ||
      preview.bg ||
      (derivedPreview && derivedPreview.surface) ||
      derived["--surface-page"] ||
      tokens["--surface-page"] ||
      derived["--bg-page"] ||
      tokens["--bg-page"] ||
      "var(--gray-2)";
    var secondary =
      preview.secondary ||
      (derivedPreview && derivedPreview.secondary) ||
      derived["--secondary-strong"] ||
      tokens["--secondary-strong"] ||
      derived["--accent-secondary-strong"] ||
      tokens["--accent-secondary-strong"] ||
      primary;
    var toneMode =
      preview.tone_mode ||
      (derivedPreview && derivedPreview.toneMode) ||
      (custom.policies && custom.policies.tone_mode) ||
      "mono";

    return {
      primary: primary,
      surface: surface,
      secondary: secondary,
      toneMode: toneMode,
    };
  }

  function applyStoredCustomPalette() {
    const custom = loadCustomPalette();
    if (!custom) {
      return false;
    }

    clearAppliedCustomTokens();
    if (custom.version >= 2) {
      var derivedTokens = getCustomDerivedPaletteTokens(custom) || {};
      Object.entries(derivedTokens).forEach(function (entry) {
        var name = entry[0];
        var value = entry[1];
        setCustomRuntimeToken(name, String(value));
      });

      var overrides = custom.overrides || {};
      Object.keys(overrides).forEach(function (key) {
        var tokenName = normalizeOverrideTokenName(key);
        var value = overrides[key];
        if (!tokenName || typeof value === "undefined" || value === null) {
          return;
        }
        setCustomRuntimeToken(tokenName, String(value));
      });
    } else {
      Object.entries(custom.tokens).forEach(([name, value]) => {
        if (!name || typeof value === "undefined" || value === null) {
          return;
        }
        document.documentElement.style.setProperty(name, String(value));
        appliedCustomTokenNames.push(name);
      });
    }

    // Only apply derived/runtime policy tokens for v2 payloads.
    // v1 payloads are token snapshots and must be preserved as-is.
    if (custom.version >= 2) {
      applyCustomDerivedTokens(custom);
      applyCustomImageTreatment(custom);
    }
    const previewValues = getCustomPreviewValues(custom);
    document.documentElement.style.setProperty(
      "--palette-custom-accent",
      previewValues.primary
    );
    document.documentElement.style.setProperty(
      "--palette-custom-bg",
      previewValues.surface
    );
    return true;
  }

  function syncCustomPaletteOptionVisibility() {
    const custom = loadCustomPalette();
    const customAvailable = Boolean(custom);
    if (customAvailable) {
      const previewValues = getCustomPreviewValues(custom);
      const primary = previewValues.primary;
      const surface = previewValues.surface;
      const secondary = previewValues.secondary;
      const toneMode = previewValues.toneMode;

      document.documentElement.style.setProperty(
        "--palette-custom-accent",
        primary
      );
      document.documentElement.style.setProperty(
        "--palette-custom-bg",
        surface
      );
      document.documentElement.style.setProperty(
        "--palette-custom-primary",
        primary
      );
      document.documentElement.style.setProperty(
        "--palette-custom-surface",
        surface
      );
      document.documentElement.style.setProperty(
        "--palette-custom-secondary",
        secondary
      );

      document.documentElement.style.setProperty("--palette-custom-seg1", "1");
      document.documentElement.style.setProperty("--palette-custom-seg2", "1");
      document.documentElement.style.setProperty(
        "--palette-custom-seg3",
        toneMode === "duo" ? "1" : "0"
      );
    }
    const customOptions = document.querySelectorAll(
      '[data-role="palette-custom-option"]'
    );
    customOptions.forEach((option) => {
      if (customAvailable) {
        option.removeAttribute("hidden");
      } else {
        option.setAttribute("hidden", "");
      }
    });
  }

  function refreshCustomPaletteState() {
    syncCustomPaletteOptionVisibility();
    const current =
      document.documentElement.getAttribute("data-palette") || "standard";
    if (current === "custom") {
      if (!applyStoredCustomPalette()) {
        setPalette("standard");
        return;
      }
    }
    updatePaletteUI(current);
  }

  // ==========================================================================
  // TYPOGRAPHY MANAGEMENT (editorial/refined/expressive/technical/system)
  // ==========================================================================

  // Web fonts that must be loaded before applying each typography preset.
  // This lets us keep font-display:optional in TypeKit (zero CLS) while
  // guaranteeing fonts render when the user actively switches presets.
  var TYPOGRAPHY_FONTS = {
    refined: ['400 1em "Playfair Display"'],
    expressive: ['500 1em "Bricolage Grotesque"'],
    technical: ['400 1em "JetBrains Mono"'],
  };

  function setTypography(typography) {
    localStorage.setItem("theme-typography", typography);
    // Highlight the selected option immediately for instant feedback
    updateTypographyUI(typography);

    // Get the readable label from the clicked option's aria-label
    var clickedOpt = document.querySelector(
      '[data-js="typography-option"][data-typography="' + typography + '"]'
    );
    var typoLabel = clickedOpt
      ? clickedOpt.getAttribute("aria-label")
      : typography;
    var typoCategory = document.querySelector(
      '[data-toast-category="typography"]'
    );
    var typoCategoryLabel = typoCategory
      ? typoCategory.getAttribute("data-toast-label")
      : "";

    var fontsNeeded = TYPOGRAPHY_FONTS[typography];
    if (fontsNeeded && fontsNeeded.length > 0) {
      // Preload web fonts before applying the preset so the font is
      // already in the FontFaceSet when CSS references it — avoids
      // the font-display:optional block-period miss.
      Promise.all(
        fontsNeeded.map(function (spec) {
          return document.fonts.load(spec);
        })
      )
        .then(function () {
          applyTypography(typography);
          if (window.Toast) {
            window.Toast.show(typoCategoryLabel, typoLabel);
          }
        })
        .catch(function () {
          // Font loading failed; apply anyway (CSS fallback stack kicks in)
          applyTypography(typography);
          if (window.Toast) {
            window.Toast.show(typoCategoryLabel, typoLabel);
          }
        });
    } else {
      applyTypography(typography);
      if (window.Toast) {
        window.Toast.show(typoCategoryLabel, typoLabel);
      }
    }
  }

  function applyTypography(typography) {
    document.documentElement.setAttribute("data-typography", typography);
    updateFooterTypographyLabel(typography);
  }

  function updateTypographyUI(currentTypography) {
    typographyOptions.forEach((option) => {
      const typography = option.getAttribute("data-typography");
      if (typography === currentTypography) {
        option.classList.add("active");
        option.setAttribute("aria-current", "true");
      } else {
        option.classList.remove("active");
        option.removeAttribute("aria-current");
      }
    });
  }

  // Layout dimension (column/editorial/index/terminal). Simpler than
  // typography — it only sets a data attribute, with no web fonts to preload.

  // A layout can declare companion dimensions that switch along with it when
  // the user picks the layout (never on page load). The user can still change
  // any dimension afterwards — this is a starting point, not a lock. Add
  // entries here to pair other layouts with a default typography/palette.
  var LAYOUT_PAIRINGS = {
    terminal: { typography: "technical" },
  };

  // Boot theater: a short staged print of the terminal chrome. Plays when
  // the user enters the layout and once per browser session on load —
  // never for reduced-motion users (system preference or the site toggle).
  var terminalBootTimer = null;

  function playTerminalBoot() {
    var root = document.documentElement;
    // A boot means the banner is shown fresh: un-hide it (an earlier page this
    // session may have set data-terminal-booted to hide it) and record that the
    // session has now booted, so later pages skip the banner. Done regardless
    // of reduced motion — only the staged animation below is motion-gated.
    root.removeAttribute("data-terminal-booted");
    try {
      sessionStorage.setItem("terminal-boot-played", "1");
    } catch (e) {
      /* storage unavailable — the boot simply replays next load */
    }
    if (
      (typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) ||
      root.getAttribute("data-effect-reduced-motion") === "on"
    ) {
      return; // banner shown, but skip the staged print
    }
    root.classList.remove("terminal-booting");
    void root.offsetWidth;
    root.classList.add("terminal-booting");
    if (terminalBootTimer) {
      window.clearTimeout(terminalBootTimer);
    }
    terminalBootTimer = window.setTimeout(function () {
      root.classList.remove("terminal-booting");
    }, 2400);
  }

  // Set by the command engine's init to its endTerminalFlow(), so exitTerminal
  // (which lives out here, unable to reach the init closure) can abort any
  // half-finished contact/subscribe flow on the way out.
  var terminalFlowReset = null;

  // Leave the terminal: back to the snapshotted layout, and restore the
  // snapshotted typography if the pairing's choice (technical) is still
  // active — a manual typography change inside the terminal is respected.
  function exitTerminal() {
    if (!isTerminalLayout()) {
      return;
    }
    // Wipe the command scrollback so it neither lingers on the way out nor
    // greets the next terminal session (it is hidden in other layouts anyway).
    var sessionLog = document.querySelector('[data-js="terminal-session"]');
    if (sessionLog) {
      sessionLog.textContent = "";
    }
    // Reset any in-progress interactive flow so re-entering starts clean.
    if (terminalFlowReset) {
      terminalFlowReset();
    }
    var previousLayout =
      localStorage.getItem("theme-layout-previous") || "column";
    if (previousLayout === "terminal") {
      previousLayout = "column";
    }
    var previousTypography = localStorage.getItem("theme-typography-previous");
    setLayout(previousLayout);
    if (localStorage.getItem("theme-typography") === "technical") {
      if (previousTypography && previousTypography !== "technical") {
        setTypography(previousTypography);
      } else if (!previousTypography) {
        // No snapshot (terminal was entered before snapshots existed, or
        // storage was cleared): fall back to the site default rather than
        // leaving the pairing's mono behind.
        setTypography("editorial");
      }
    }
  }

  function applyLayoutPairings(layout) {
    var pairing = LAYOUT_PAIRINGS[layout];
    if (!pairing) {
      return;
    }
    if (
      pairing.typography &&
      localStorage.getItem("theme-typography") !== pairing.typography
    ) {
      setTypography(pairing.typography);
    }
    if (
      pairing.palette &&
      localStorage.getItem("theme-palette") !== pairing.palette
    ) {
      setPalette(pairing.palette);
    }
  }

  function setLayout(layout) {
    // Entering terminal snapshots where the user came from, so exit (ESC,
    // typing "exit", the boot [exit] button) can return there — including
    // the typography the pairing is about to replace.
    var currentLayout = localStorage.getItem("theme-layout") || "column";
    if (layout === "terminal" && currentLayout !== "terminal") {
      localStorage.setItem("theme-layout-previous", currentLayout);
      localStorage.setItem(
        "theme-typography-previous",
        localStorage.getItem("theme-typography") || "editorial"
      );
      // Snap to the top so the boot banner/animation plays in view — otherwise a
      // visitor part-way down the page enters the terminal mid-stream and misses
      // it. Instant (not smooth) so it lands before the layout reflows.
      window.scrollTo(0, 0);
      playTerminalBoot();
    }
    localStorage.setItem("theme-layout", layout);
    updateLayoutUI(layout);
    applyLayout(layout);
    applyLayoutPairings(layout);

    var clickedOpt = document.querySelector(
      '[data-js="layout-option"][data-layout="' + layout + '"]'
    );
    var layoutLabel = clickedOpt
      ? clickedOpt.getAttribute("aria-label")
      : layout;
    var layoutCategory = document.querySelector(
      '[data-toast-category="layout"]'
    );
    var layoutCategoryLabel = layoutCategory
      ? layoutCategory.getAttribute("data-toast-label")
      : "";

    if (window.Toast) {
      window.Toast.show(layoutCategoryLabel, layoutLabel);
    }
  }

  function applyLayout(layout) {
    var root = document.documentElement;
    // Visual tool pages opt out of terminal: render column here, keep the
    // stored preference (terminal resumes on the next regular page).
    if (layout === "terminal" && root.hasAttribute("data-terminal-exempt")) {
      layout = "column";
    }
    root.setAttribute("data-layout", layout);
    // The measure (max-width, a direct var()) repaints immediately, but some
    // engines defer recomputing calc(var()) on the inherited font-size until a
    // reflow is forced — so the type size would otherwise only update on the
    // next scroll. Reading a layout property flushes that synchronously.
    void root.offsetWidth;
    // Let layout-sensitive scripts (e.g. the brand progress mark) re-sync.
    window.dispatchEvent(
      new window.CustomEvent("theme:layout-changed", {
        detail: { layout: layout },
      })
    );
  }

  function updateLayoutUI(currentLayout) {
    layoutOptions.forEach((option) => {
      const layout = option.getAttribute("data-layout");
      if (layout === currentLayout) {
        option.classList.add("active");
        option.setAttribute("aria-current", "true");
      } else {
        option.classList.remove("active");
        option.removeAttribute("aria-current");
      }
    });
  }

  // ==========================================================================
  // ICON MANAGEMENT
  // ==========================================================================

  function updateThemeIcon() {
    if (!themeIcon) {
      return;
    }

    // Theme toggle icon is static and no longer reflects active mode.
    themeIcon.innerHTML = `<svg width="24" height="24" aria-hidden="true">
      <use href="${getPlayerSpriteUrl()}#icon-theme-palette"></use>
    </svg>`;
  }

  // ==========================================================================
  // META TAG MANAGEMENT
  // ==========================================================================

  function resolvePageColor() {
    var activeMode =
      document.documentElement.getAttribute("data-mode") || "light";
    var fallback = activeMode === "dark" ? "#18181b" : "#FFFFFF";
    if (!document.body) {
      return fallback;
    }
    var color = getComputedStyle(document.body).backgroundColor;
    return color && color !== "rgba(0, 0, 0, 0)" ? color : fallback;
  }

  function animateThemeColorMeta(durationMs) {
    if (themeColorAnimFrame) {
      cancelAnimationFrame(themeColorAnimFrame);
      themeColorAnimFrame = null;
    }
    var duration = Number(durationMs) || THEME_SWAP_TRANSITION_DEFAULT_MS;
    var startTime = performance.now();

    function tick(now) {
      var color = resolvePageColor();
      document
        .querySelectorAll('meta[name="theme-color"]')
        .forEach(function (meta) {
          meta.setAttribute("content", color);
        });
      if (now - startTime < duration) {
        themeColorAnimFrame = requestAnimationFrame(tick);
      } else {
        themeColorAnimFrame = null;
      }
    }
    themeColorAnimFrame = requestAnimationFrame(tick);
  }

  function updateFooterModeLabel(mode) {
    const modeLabel = document.querySelector('[data-js="footer-mode"]');
    if (!modeLabel) {
      return;
    }
    const label = modeLabel.getAttribute(`data-label-${mode}`) || mode;
    modeLabel.textContent = label;
  }

  function updateFooterPaletteLabel(palette) {
    const paletteLabel = document.querySelector('[data-js="footer-palette"]');
    if (!paletteLabel) {
      return;
    }
    const baseLabel =
      paletteLabel.getAttribute(`data-label-${palette}`) || palette;
    paletteLabel.textContent = formatPaletteLabel(baseLabel, palette);
  }

  function updateFooterTypographyLabel(typography) {
    const typographyLabel = document.querySelector(
      '[data-js="footer-typography"]'
    );
    if (!typographyLabel) {
      return;
    }
    const label =
      typographyLabel.getAttribute(`data-label-${typography}`) || typography;
    typographyLabel.textContent = label;
  }

  function readBooleanPreference(key, defaultValue) {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return defaultValue;
    }
    return raw === "1";
  }

  function syncEffectButtons(nodes, enabled) {
    if (!nodes) {
      return;
    }
    nodes.forEach((button) => {
      button.setAttribute("aria-pressed", enabled ? "true" : "false");
    });
  }

  function showEffectToast(buttons, enabled, fallbackTitle) {
    if (!window.Toast) {
      return;
    }
    const button = buttons && buttons.length ? buttons[0] : null;
    const title =
      (button && button.getAttribute("data-toast-title")) || fallbackTitle;
    const onLabel = (button && button.getAttribute("data-toast-on")) || "On";
    const offLabel = (button && button.getAttribute("data-toast-off")) || "Off";
    const icon = (button && button.getAttribute("data-toast-icon")) || "";
    window.Toast.show(title, enabled ? onLabel : offLabel, { icon: icon });
  }

  function setBlendEnabled(enabled, options) {
    const opts = options || {};
    const value = Boolean(enabled);
    document.documentElement.setAttribute(
      "data-effect-blend",
      value ? "on" : "off"
    );
    localStorage.setItem(EFFECT_BLEND_KEY, value ? "1" : "0");
    syncEffectButtons(effectBlendButtons, value);
    if (!opts.silent) {
      showEffectToast(effectBlendButtons, value, "Blend");
    }
  }

  function setGrainEnabled(enabled, options) {
    const opts = options || {};
    const value = Boolean(enabled);
    document.documentElement.setAttribute(
      "data-effect-grain",
      value ? "on" : "off"
    );
    localStorage.setItem(EFFECT_GRAIN_KEY, value ? "1" : "0");
    syncEffectButtons(effectGrainButtons, value);
    if (!opts.silent) {
      showEffectToast(effectGrainButtons, value, "Grain");
    }
  }

  function setReducedMotionEnabled(enabled, options) {
    const opts = options || {};
    const value = Boolean(enabled);
    document.documentElement.setAttribute(
      "data-effect-reduced-motion",
      value ? "on" : "off"
    );
    localStorage.setItem(EFFECT_MOTION_KEY, value ? "1" : "0");
    syncEffectButtons(effectMotionButtons, value);
    if (!opts.silent) {
      showEffectToast(effectMotionButtons, value, "Reduce motion");
    }
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

  function isTerminalLayout() {
    return document.documentElement.getAttribute("data-layout") === "terminal";
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

  function dispatchPaletteChanged(palette) {
    window.dispatchEvent(
      new window.CustomEvent("theme:palette-changed", {
        detail: { palette: palette },
      })
    );
  }

  function showPaletteToast(palette) {
    var el = document.querySelector('[data-js="footer-palette"]');
    var category = el ? el.getAttribute("data-category") : "";
    var label = el
      ? el.getAttribute("data-label-" + palette) || palette
      : palette;
    if (palette === "pantone") {
      label = formatCotyTrackText(getCotyEntryByYear(getCurrentCotyYear()));
    } else {
      label = formatPaletteLabel(label, palette);
    }
    var icon = el ? el.getAttribute("data-toast-icon") : "";
    if (window.Toast) {
      window.Toast.show(category, label, { icon: icon });
    }
  }

  function commitPaletteSelection(palette, options) {
    const opts = options || {};
    if (palette === "custom" && !hasCustomPalette()) {
      return false;
    }
    if (palette !== "pantone") {
      localStorage.setItem(LAST_NON_PANTONE_PALETTE_KEY, palette);
    }
    localStorage.setItem("theme-palette", palette);
    applyPalette(palette);
    updatePaletteUI(palette);
    if (opts.dispatch !== false) {
      dispatchPaletteChanged(palette);
    }
    if (opts.toast !== false) {
      showPaletteToast(palette);
    }
    return true;
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

  // ==========================================================================
  // SYSTEM PREFERENCE LISTENER
  // ==========================================================================

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      const storedMode = localStorage.getItem("theme-mode") || "system";
      if (storedMode === "system") {
        applyMode("system");
      }
    });

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
      animateThemeColorMeta(
        opts.transitionDuration || THEME_SWAP_TRANSITION_DEFAULT_MS
      );
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

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  document.addEventListener("DOMContentLoaded", function () {
    // Initialize selectors
    themeIcon = document.querySelector('[data-js="theme-icon"]');
    modeOptions = document.querySelectorAll('[data-js="mode-option"]');
    paletteOptions = document.querySelectorAll('[data-js="palette-option"]');
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
    typographyOptions = document.querySelectorAll(
      '[data-js="typography-option"]'
    );
    layoutOptions = document.querySelectorAll('[data-js="layout-option"]');
    effectBlendButtons = document.querySelectorAll(
      '[data-js="effect-blend-toggle"]'
    );
    effectGrainButtons = document.querySelectorAll(
      '[data-js="effect-grain-toggle"]'
    );
    effectMotionButtons = document.querySelectorAll(
      '[data-js="effect-motion-toggle"]'
    );

    // Load stored preferences or use defaults
    const storedMode = localStorage.getItem("theme-mode") || "system";
    const storedPalette = localStorage.getItem("theme-palette") || "standard";
    const storedTypography =
      localStorage.getItem("theme-typography") || "editorial";
    const storedLayout = localStorage.getItem("theme-layout") || "column";
    const normalizedStoredPalette =
      storedPalette === "coty" ? "pantone" : storedPalette;
    const storedCotyTransportUiState =
      localStorage.getItem(COTY_TRANSPORT_UI_KEY) === "collapsed"
        ? "collapsed"
        : "expanded";
    let initialPalette =
      normalizedStoredPalette === "custom" && !hasCustomPalette()
        ? "standard"
        : normalizedStoredPalette;
    let initialPantoneState = normalizePantoneState(
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

    // Apply stored preferences
    applyMode(storedMode);
    if (
      window.CotyScaleActions &&
      typeof window.CotyScaleActions.init === "function"
    ) {
      window.CotyScaleActions.init();
    }
    initCotyYearControls();
    initCotyPlayerControls();
    syncCustomPaletteOptionVisibility();
    applyPalette(initialPalette);
    applyTypography(storedTypography);
    // Record the Pantone controls' authored (floating) home before applyLayout
    // can move them, so returning from the terminal restores them correctly.
    rememberCotyTransportHome(
      document.querySelector('[data-js="coty-transport"]')
    );
    applyLayout(storedLayout);
    setBlendEnabled(readBooleanPreference(EFFECT_BLEND_KEY, true), {
      silent: true,
    });
    setGrainEnabled(readBooleanPreference(EFFECT_GRAIN_KEY, false), {
      silent: true,
    });
    setReducedMotionEnabled(readBooleanPreference(EFFECT_MOTION_KEY, false), {
      silent: true,
    });

    // Update UI to reflect current settings
    updateModeUI(storedMode);
    updatePaletteUI(initialPalette);
    updateTypographyUI(storedTypography);
    updateLayoutUI(storedLayout);
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

    // Park the Pantone controls where the current layout wants them (inline in
    // the terminal settings, floating otherwise), and keep them in sync as the
    // user switches layouts. Deregister any handler from a previous init so the
    // listener never accumulates if this ever runs more than once.
    if (window.__cotyPlacementHandler) {
      window.removeEventListener(
        "theme:layout-changed",
        window.__cotyPlacementHandler
      );
    }
    window.__cotyPlacementHandler = syncCotyTransportPlacement;
    window.addEventListener("theme:layout-changed", syncCotyTransportPlacement);
    syncCotyTransportPlacement();

    window.ThemeActions = {
      setMode: setMode,
      setPalette: setPalette,
      setTypography: setTypography,
      setLayout: setLayout,
      togglePantone: togglePantoneMode,
      toggleBlend: function () {
        setBlendEnabled(
          document.documentElement.getAttribute("data-effect-blend") !== "on"
        );
      },
      toggleGrain: function () {
        setGrainEnabled(
          document.documentElement.getAttribute("data-effect-grain") !== "on"
        );
      },
      toggleReducedMotion: function () {
        setReducedMotionEnabled(
          document.documentElement.getAttribute(
            "data-effect-reduced-motion"
          ) !== "on"
        );
      },
      playPantone: playPantone,
      pausePantone: pausePantone,
      stopPantone: stopPantone,
      getPaletteOrder: function () {
        const seen = new Set();
        const values = [];
        paletteOptions.forEach((option) => {
          if (option.hasAttribute("hidden")) {
            return;
          }
          const value = option.getAttribute("data-palette");
          if (value && !seen.has(value)) {
            seen.add(value);
            values.push(value);
          }
        });
        return values;
      },
      getTypographyOrder: function () {
        const seen = new Set();
        const values = [];
        typographyOptions.forEach((option) => {
          const value = option.getAttribute("data-typography");
          if (value && !seen.has(value)) {
            seen.add(value);
            values.push(value);
          }
        });
        return values;
      },
      setCotyYear: setCotyYear,
      getCotyYear: getCurrentCotyYear,
      setCotyShuffleEnabled: setCotyShuffleEnabled,
      refreshCustomPalette: refreshCustomPaletteState,
    };

    window.addEventListener(
      "theme:custom-palette-updated",
      refreshCustomPaletteState
    );
    window.addEventListener(
      "theme:sheet-closed",
      resumeCotyTransportAutoCollapse
    );

    // Setup event listeners

    // Mode option listeners
    modeOptions.forEach((option) => {
      option.addEventListener("click", function () {
        const mode = this.getAttribute("data-mode");
        setMode(mode);
      });
    });

    // Palette option listeners
    paletteOptions.forEach((option) => {
      option.addEventListener("click", function () {
        const palette = this.getAttribute("data-palette");
        setPalette(palette);
      });
    });

    // Typography option listeners
    typographyOptions.forEach((option) => {
      option.addEventListener("click", function () {
        const typography = this.getAttribute("data-typography");
        setTypography(typography);
      });
    });

    // Layout option listeners
    layoutOptions.forEach((option) => {
      option.addEventListener("click", function () {
        const layout = this.getAttribute("data-layout");
        setLayout(layout);
      });
    });

    // First terminal page load of the session boots; navigations after
    // that print instantly, like a real terminal.
    if (storedLayout === "terminal") {
      try {
        if (!sessionStorage.getItem("terminal-boot-played")) {
          playTerminalBoot();
        }
      } catch (e) {
        /* storage unavailable — skip the theater */
      }
    }

    // Terminal exit routes: the boot [exit] button, the ESC key (when no
    // panel/lightbox/input claims it), and literally typing "exit" + Enter.
    document
      .querySelectorAll('[data-js="terminal-exit"]')
      .forEach(function (button) {
        button.addEventListener("click", exitTerminal);
      });

    let terminalTypedBuffer = "";
    document.addEventListener("keydown", function (e) {
      if (document.documentElement.getAttribute("data-layout") !== "terminal") {
        return;
      }
      var target = e.target;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "Escape") {
        // defaultPrevented: the lightbox/settings panel already consumed this
        // very keypress to close itself — the state checks alone can't catch
        // that, since a handler registered before this one has by now removed
        // the open-marker the checks look for.
        if (
          e.defaultPrevented ||
          document.documentElement.classList.contains("lightbox-open") ||
          document.documentElement.hasAttribute("data-settings-panel-open")
        ) {
          return; // their own Escape handlers close them first
        }
        exitTerminal();
        return;
      }
      if (e.key === "Enter") {
        if (terminalTypedBuffer.endsWith("exit")) {
          exitTerminal();
        }
        terminalTypedBuffer = "";
        return;
      }
      if (
        e.key.length === 1 &&
        /[a-z]/i.test(e.key) &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        terminalTypedBuffer = (terminalTypedBuffer + e.key.toLowerCase()).slice(
          -8
        );
      }
    });

    // ======================================================================
    // Terminal command line
    // The tail's <input> is a real prompt. Tapping it focuses the field and
    // opens the on-screen keyboard (the fix that makes the terminal usable on
    // touch devices), and Enter runs a small set of commands + easter eggs.
    // Parsing is separated from side effects: runTerminalCommand() returns the
    // text to print plus an optional action, and applyTerminalAction() carries
    // it out by reusing the theme/layout functions already defined above.
    // ======================================================================
    const terminalInput = document.querySelector('[data-js="terminal-input"]');
    const terminalTail = terminalInput
      ? terminalInput.closest(".terminal-tail")
      : null;
    const terminalSession = document.querySelector(
      '[data-js="terminal-session"]'
    );

    // Append-only history: the header's login prompts (`ls ~`, `ls settings/`)
    // are the session's opening lines. Freeze them at the load-time cwd — pin
    // each an inline --terminal-cwd — so a later append-only `cd` moves only the
    // live prompt below, never this history above. The live input prompt keeps
    // reading the global var, so it alone tracks the working directory.
    if (isTerminalLayout()) {
      var terminalLoadCwd = currentTerminalCwd();
      document
        .querySelectorAll("#topmenu .terminal-prompt:not(.terminal-prompt--cd)")
        .forEach(function (headerPrompt) {
          headerPrompt.style.setProperty(
            "--terminal-cwd",
            '"' + terminalLoadCwd + '"'
          );
        });
    }

    // Clicking a cat'd [image N] token is a shortcut for a command you could
    // have typed: it echoes `open <file>` into the scrollback (frozen at the
    // current cwd, like any command) and opens the picture in the lightbox.
    // Delegated, so it covers every image printed into the append-only buffer.
    if (terminalSession) {
      terminalSession.addEventListener("click", function (e) {
        var btn = e.target.closest(".terminal-session__image");
        if (!btn) {
          return;
        }
        var file = btn.getAttribute("data-image-file") || "image";
        var src = btn.getAttribute("data-image-src");
        var alt = btn.getAttribute("data-image-alt");
        printTerminalLine(
          "open " + file,
          "terminal-session__cmd",
          currentTerminalCwd()
        );
        // Opening a fullscreen image should dismiss the mobile keyboard, so
        // blur the prompt and DON'T call scrollTerminalToEnd (it would refocus
        // the input and pop the keyboard straight back up). Scroll without
        // refocusing; the lightbox itself moves focus to its close button.
        if (terminalInput) {
          terminalInput.blur();
        }
        if (
          src &&
          window.TerminalLightbox &&
          typeof window.TerminalLightbox.openSrc === "function"
        ) {
          window.TerminalLightbox.openSrc(src, alt);
        }
        window.requestAnimationFrame(function () {
          window.scrollTo(0, document.body.scrollHeight);
        });
      });
    }

    // Session start, for `uptime` — captured when the command engine boots.
    var terminalSessionStart = Date.now();

    // Command scrollback for `history`, oldest first. Capped so a long-lived
    // tab can't grow it without bound.
    var terminalHistory = [];
    var TERMINAL_HISTORY_MAX = 100;

    // The Konami code (typed while the prompt is focused) toggles party mode.
    // Keys are compared lowercased, so ArrowUp → "arrowup", B → "b".
    var KONAMI_SEQUENCE = [
      "arrowup",
      "arrowup",
      "arrowdown",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "arrowleft",
      "arrowright",
      "b",
      "a",
    ];
    var konamiProgress = 0;

    // Where ↑/↓ history recall currently sits (null = the live line). Reset
    // whenever the user types or runs a command.
    var terminalHistoryCursor = null;

    // The last printed output line, for `copy` with no argument.
    var lastTerminalOutput = "";

    // The four selectable layouts, for the `layout`/`theme` command.
    var TERMINAL_LAYOUTS = ["column", "editorial", "index", "terminal"];

    // Kept narrow (a ~12-char command column + short descriptions) so every
    // line fits a phone's ~36-char terminal width without wrapping mid-column.
    const TERMINAL_HELP = [
      "commands:",
      "  help      this list",
      "  whoami    who's asking",
      "  date      date & time",
      "  pwd       working dir",
      "  ls        list dir",
      "  cd <page> change page",
      "  tree      site map",
      "  lang [sv|en]  language",
      "  echo      print text",
      "  neofetch  session info",
      "  dark|light|system  mode",
      "  pantone   [on|off|YYYY]",
      "  grain|blend|motion on/off",
      "  grid      layout grid",
      "  layout <name>  switch layout",
      "  hire      let's work together",
      "  social    my links",
      "  copy <x>  to clipboard",
      "  contact   message me",
      "  subscribe newsletter",
      "  clear     wipe the screen",
      "  exit      leave the terminal",
      "keys: ↑↓ history · Tab complete · ^L/^C/^U",
    ];

    // Command words offered by Tab completion (primary spellings only).
    const TERMINAL_COMMAND_NAMES = [
      "help",
      "whoami",
      "date",
      "pwd",
      "ls",
      "cd",
      "tree",
      "lang",
      "echo",
      "neofetch",
      "dark",
      "light",
      "system",
      "pantone",
      "grain",
      "blend",
      "motion",
      "grid",
      "layout",
      "theme",
      "hire",
      "social",
      "links",
      "email",
      "resume",
      "cv",
      "copy",
      "cat",
      "open",
      "man",
      "uname",
      "colour",
      "fortune",
      "history",
      "uptime",
      "top",
      "debug",
      "env",
      "reset",
      "contact",
      "subscribe",
      "clear",
      "exit",
      "sl",
      "cowsay",
      "logo",
      "ascii",
      "weather",
      "matrix",
      "ping",
      "moo",
      "xyzzy",
      "easteregg",
    ];

    // Toggleable image effects, keyed by command word. `invert` flags that the
    // command's sense is the opposite of its data-attribute: "motion on" means
    // animation on, i.e. data-effect-reduced-motion OFF. Built once, not per
    // command.
    const TERMINAL_EFFECTS = {
      grain: { attr: "data-effect-grain", set: setGrainEnabled, invert: false },
      blend: { attr: "data-effect-blend", set: setBlendEnabled, invert: false },
      motion: {
        attr: "data-effect-reduced-motion",
        set: setReducedMotionEnabled,
        invert: true,
      },
    };

    // `cat`-able pseudo-files. A leading dot and a trailing .txt/.md are
    // stripped before lookup, so `cat colophon`, `cat colophon.txt` and
    // `cat .secret` all resolve.
    const TERMINAL_FILES = {
      welcome: [
        "Hi, Torbjörn here — a designer.",
        "For over a decade I've worked across editorial design,",
        "brand and digital product. Based in Gothenburg.",
        "",
        "you're in the terminal — try 'ls', 'cd works', 'help'.",
      ],
      readme: [
        "it's a portfolio. poke around.",
        "type 'help' for the command list.",
      ],
      about: ["designer & developer.", "type 'cd about' for the long version."],
      colophon: [
        "Hugo · vanilla JS · no frameworks.",
        "hand-rolled design tokens.",
        "no trackers, no cookies.",
      ],
      secret: [
        "there are no secrets here.",
        "(the source is right there — view-source:)",
      ],
      config: [
        "# ~/.config — terminal preferences",
        "shell   tor-sh 1.0",
        "prompt  ~$ (edit via the settings panel)",
      ],
    };

    // `fortune` cookies — design & typography aphorisms, printed at random.
    const TERMINAL_FORTUNES = [
      "Less, but better. — Dieter Rams",
      "Good design is as little design as possible. — Dieter Rams",
      "Design is not just what it looks like — design is how it works. — Steve Jobs",
      "The details are not the details. They make the design. — Charles Eames",
      "White space is to be regarded as an active element. — Jan Tschichold",
      "Simplicity is the ultimate sophistication. — Leonardo da Vinci",
      "Perfection is reached when there is nothing left to take away. — Antoine de Saint-Exupéry",
      "Type is a beautiful group of letters, not a group of beautiful letters. — Matthew Carter",
    ];

    // A private index of the hidden commands, surfaced only by `easteregg` —
    // deliberately kept out of `help` so it stays a discovery, not a menu.
    const TERMINAL_EASTER_EGGS = [
      "easter eggs:",
      "  sudo      permission denied",
      "  coffee    HTTP 418",
      "  cat <f>   readme/about/colophon…",
      "  man <cmd> one-line manual",
      "  uname     shell / -a session",
      "  colour    palette swatches",
      "  fortune   design aphorism",
      "  history   command scrollback",
      "  uptime    session age",
      "  top       process list",
      "  vim/nano/emacs  editor jokes",
      "  :q :wq    quit like vim",
      "  rm -rf /  it's all in git",
      "  git <sub> blame/commit/push…",
      "  npm i     fake resolve",
      "  hello     greeting",
      "  konami    party (↑↑↓↓←→←→ba)",
      "  sl        choo choo",
      "  cowsay <x> talking cow",
      "  moo       super cow powers",
      "  xyzzy     nothing happens",
      "  42        the answer",
      "  ping      pong",
      "  weather   fake forecast",
      "  logo      brand curl",
      "  matrix    digital rain",
      "  debug/env theme state",
      "  reset     restore defaults",
    ];

    function terminalHost() {
      return (window.location && window.location.hostname) || "tor-bjorn.com";
    }

    function resolvedModeLabel() {
      return document.documentElement.getAttribute("data-mode") === "dark"
        ? "dark"
        : "light";
    }

    function paletteLabel() {
      var palette =
        document.documentElement.getAttribute("data-palette") || "standard";
      if (palette === "pantone") {
        return "pantone (" + getCurrentCotyYear() + ")";
      }
      return palette;
    }

    function neofetchLines() {
      var host = terminalHost();
      return [
        "visitor@" + host,
        "-----------------",
        "host      " + host,
        "layout    terminal",
        "mode      " + resolvedModeLabel(),
        "palette   " + paletteLabel(),
        "lang      " + (document.documentElement.getAttribute("lang") || "en"),
        "shell     tor-sh 1.0",
      ];
    }

    // "on"/"off" from an argument, otherwise "toggle".
    function onOffState(arg) {
      var value = (arg || "").toLowerCase();
      if (value === "on" || value === "enable" || value === "1") {
        return "on";
      }
      if (value === "off" || value === "disable" || value === "0") {
        return "off";
      }
      return "toggle";
    }

    // "1h 2m 3s", dropping leading zero units, for `uptime`.
    function formatUptime(totalSeconds) {
      var s = Math.max(0, Math.floor(totalSeconds));
      var h = Math.floor(s / 3600);
      var m = Math.floor((s % 3600) / 60);
      s = s % 60;
      var parts = [];
      if (h) {
        parts.push(h + "h");
      }
      if (h || m) {
        parts.push(m + "m");
      }
      parts.push(s + "s");
      return parts.join(" ");
    }

    function uptimeLine() {
      var secs = (Date.now() - terminalSessionStart) / 1000;
      return "up " + formatUptime(secs) + " · load 0.00 (it's a static site)";
    }

    function historyLines() {
      if (!terminalHistory.length) {
        return ["(no history yet)"];
      }
      return terminalHistory.map(function (entry, i) {
        var n = String(i + 1);
        while (n.length < 3) {
          n = " " + n;
        }
        return n + "  " + entry;
      });
    }

    // Full path segments for an internal href, lang prefix stripped (like
    // hrefToCwd but keeping every segment). Only root-relative "/..." links
    // count — that cleanly drops mailto:, tel:, external, and hash links.
    function terminalHrefSegments(href) {
      var raw = String(href || "");
      if (raw.charAt(0) !== "/") {
        return null;
      }
      var path = raw.replace(/[?#].*$/, "").replace(/^\/+|\/+$/g, "");
      var lang = (
        document.documentElement.getAttribute("lang") || ""
      ).toLowerCase();
      var parts = path.split("/").filter(Boolean);
      if (parts.length && parts[0].toLowerCase() === lang) {
        parts.shift();
      }
      return parts.map(function (p) {
        return p.toLowerCase();
      });
    }

    // A small nested directory tree built from every nav + footer link path,
    // so `ls`, `tree`, `cd` and Tab completion share one data-driven model of
    // the "filesystem". Cached like terminalNavTargets — the links are static.
    var terminalDirTreeCache = null;
    function terminalDirTree() {
      if (terminalDirTreeCache) {
        return terminalDirTreeCache;
      }
      var root = { name: "~", href: terminalHomeUrl(), children: {} };
      var links = document.querySelectorAll(
        ".top-menu__nav a[href]:not(.terminal-quick), .top-menu__link[href], footer a[href]"
      );
      links.forEach(function (link) {
        var segs = terminalHrefSegments(link.getAttribute("href"));
        if (!segs || !segs.length) {
          return;
        }
        var node = root;
        segs.forEach(function (seg) {
          if (!node.children[seg]) {
            node.children[seg] = { name: seg, href: null, children: {} };
          }
          node = node.children[seg];
        });
        if (!node.href) {
          node.href = link.getAttribute("href");
        }
      });
      terminalDirTreeCache = root;
      return root;
    }

    // The current working directory as lowercased path segments ("~" → []).
    function terminalCwdSegments() {
      var rest = currentTerminalCwd().replace(/^~\/?/, "");
      return rest
        ? rest
            .split("/")
            .filter(Boolean)
            .map(function (s) {
              return s.toLowerCase();
            })
        : [];
    }

    // Resolve a path argument to absolute segments, relative to the cwd unless
    // it starts with "~" or "/". Supports "." and "..".
    function terminalResolveSegments(pathArg) {
      var arg = String(pathArg || "").trim();
      var segs;
      if (arg.charAt(0) === "~" || arg.charAt(0) === "/") {
        segs = [];
        arg = arg.replace(/^~/, "").replace(/^\/+/, "");
      } else {
        segs = terminalCwdSegments();
      }
      arg
        .split("/")
        .filter(Boolean)
        .forEach(function (part) {
          var p = part.toLowerCase();
          if (p === ".") {
            return;
          }
          if (p === "..") {
            segs.pop();
            return;
          }
          segs.push(p);
        });
      return segs;
    }

    function terminalNodeAt(segments) {
      var node = terminalDirTree();
      for (var i = 0; i < segments.length; i++) {
        node = node.children[segments[i]];
        if (!node) {
          return null;
        }
      }
      return node;
    }

    // Slugs of the current page's own content links (article / summary cards)
    // that live under the given section — so `ls` inside e.g. ~/writing lists
    // the actual posts, which the nav tree can't know about.
    function terminalPageContentSlugs(sectionSegments) {
      if (!sectionSegments.length) {
        return [];
      }
      var section = sectionSegments[0];
      var out = [];
      var seen = {};
      document
        .querySelectorAll(".article-card a[href], .summary-card a[href]")
        .forEach(function (link) {
          var segs = terminalHrefSegments(link.getAttribute("href"));
          if (!segs || segs.length < 2 || segs[0] !== section) {
            return;
          }
          var slug = segs[segs.length - 1];
          if (seen[slug]) {
            return;
          }
          seen[slug] = true;
          out.push(slug);
        });
      return out;
    }

    // List a single directory. Structural children come from the nav/footer
    // tree; for the current directory, the page's own content links are merged
    // in. Unknown path → an ls-style error; a real page whose contents can't
    // be listed from here (a different section) → a `cd` hint rather than a
    // bare empty result.
    // The statusbar renders the loaded page as history: `~$ ls nav/` and
    // `~$ ls settings/`. Make those real so typing them reproduces the header —
    // the navigation and the settings toggles, listed. Both are menus, not
    // places, so you `ls` them but don't `cd` into them (see the cd handler).
    var TERMINAL_SECTION_DIRS = {
      works: 1,
      arbeten: 1,
      writing: 1,
      texter: 1,
    };

    function terminalNavEntries() {
      var seen = {};
      var out = [];
      document
        .querySelectorAll(
          ".top-menu__nav a[href]:not(.terminal-quick), .terminal-prompt__host[href]"
        )
        .forEach(function (a) {
          var href = a.getAttribute("href");
          if (!href || href.charAt(0) === "#") {
            return;
          }
          var segs = terminalHrefSegments(href);
          var name = segs && segs.length ? segs[0] : "home";
          if (seen[name]) {
            return;
          }
          seen[name] = true;
          out.push(TERMINAL_SECTION_DIRS[name] ? name + "/" : name);
        });
      return out;
    }

    function terminalSettingsEntries() {
      return [
        "theme",
        "palette",
        "typography",
        "layout",
        "effects",
        "language",
      ];
    }

    // Filtered `ls` views — the same tool, different lens. `--featured` lists
    // the curated cards on the current page (home's featured works); `--related`
    // lists a post's sibling projects; `--info` prints a post's role/details.
    // All harvested from the current page's DOM — a page's own sequence.
    function terminalHarvestFiles(selector, emptyMsg) {
      var out = [];
      document.querySelectorAll(selector).forEach(function (a) {
        var segs = terminalHrefSegments(a.getAttribute("href"));
        if (!segs || segs.length < 2) {
          return;
        }
        var file = segs[segs.length - 1] + ".md";
        if (out.indexOf(file) === -1) {
          out.push(file);
        }
      });
      return out.length ? [out.join("  ")] : [emptyMsg];
    }

    // The project meta (role / details / client) as "label: value" lines,
    // read from any root (the live page for `ls --info`, or a fetched post for
    // `cat`). Details is a <dl> of pairs → one line each ("year: 2016"); role
    // and client are text paragraphs → joined onto their section's line.
    function terminalInfoLinesFrom(root) {
      var out = [];
      (root || document)
        .querySelectorAll(".project-info__section")
        .forEach(function (sec) {
          var title = sec.querySelector(".project-info__title");
          if (!title) {
            return;
          }
          var label = title.textContent.trim().toLowerCase();
          var items = sec.querySelectorAll(".project-info__item");
          if (items.length) {
            items.forEach(function (item) {
              var dt = item.querySelector(".project-info__label");
              var dd = item.querySelector(".project-info__value");
              if (dt && dd) {
                out.push(
                  dt.textContent.trim().toLowerCase() +
                    ": " +
                    dd.textContent.trim().replace(/\s+/g, " ")
                );
              }
            });
            return;
          }
          var texts = sec.querySelectorAll(".project-info__text");
          if (texts.length) {
            var joined = Array.prototype.map
              .call(texts, function (t) {
                return t.textContent.trim().replace(/\s+/g, " ");
              })
              .filter(Boolean)
              .join(" — ");
            if (joined) {
              out.push(label + ": " + joined);
            }
          }
        });
      return out;
    }

    function terminalInfoLines() {
      var out = terminalInfoLinesFrom(document);
      return out.length ? out : ["(no info here)"];
    }

    // Extract a cat'able rendering of a fetched post/page as an ordered list of
    // TOKENS — {text} for a prose line, {image, n, file, src, alt} for a figure
    // (a terminal can't paint an image, so it prints a clickable [image N] token
    // that opens the real picture). Walks the readable content root in document
    // order, skipping the chrome a `cat` shouldn't dump (breadcrumbs, tags,
    // related), then appends the project meta (role/details/client) so `cat`
    // shows the whole file — the info you can't otherwise reach once a post is a
    // file you never `cd` into. `base` resolves relative image URLs (the fetch
    // URL). Returns [] if there's no content root.
    function terminalExtractPostLines(doc, base) {
      var root =
        doc.querySelector("#main .content.post") ||
        doc.querySelector("#main .content.page") ||
        doc.querySelector("#main .content");
      if (!root) {
        return [];
      }
      var baseUrl;
      try {
        baseUrl = new URL(base || "/", window.location.href);
      } catch (e) {
        baseUrl = window.location.href;
      }
      // Related items and post tags have no wrapping container — they're
      // BEM-classed siblings inside .content.post — so match by class prefix.
      var SKIP =
        ".application-breadcrumb, .project-info, [class*='related-'], " +
        ".works-section, .works-post__tags, .post-tags-wrap, .lang-notice, nav";
      var tokens = [];
      var imageN = 0;
      var nodes = root.querySelectorAll(
        "h1, h2, h3, h4, p, blockquote, li, figure, img"
      );
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (el.closest(SKIP)) {
          continue;
        }
        var tag = el.tagName.toLowerCase();
        if (tag === "figure" || tag === "img") {
          // A bare img inside a figure is already counted by the figure.
          if (tag === "img" && el.closest("figure")) {
            continue;
          }
          imageN += 1;
          var img = tag === "img" ? el : el.querySelector("img");
          var cap = el.querySelector && el.querySelector("figcaption");
          var label =
            (img && img.getAttribute("alt")) ||
            (cap ? cap.textContent.trim() : "");
          // Prefer the figure's data-lightbox (the full-res URL the on-page
          // lightbox uses); fall back to the <img> src. The filename (for the
          // `open <file>` echo) comes from the img src.
          var fileSrc = img ? img.getAttribute("src") || "" : "";
          var lbSrc =
            (tag === "figure" && el.getAttribute("data-lightbox")) || fileSrc;
          var file =
            (fileSrc || lbSrc || "")
              .split("?")[0]
              .split("/")
              .filter(Boolean)
              .pop() || "image-" + imageN;
          // Strip Hugo's image-processing suffix (foo_hu_<hash>.jpg → foo.jpg)
          // so the echoed `open <file>` reads like the source filename.
          file = file.replace(/_hu[_a-f0-9]*(\.[a-z0-9]+)$/i, "$1");
          var src = "";
          if (lbSrc) {
            try {
              src = new URL(lbSrc, baseUrl).href;
            } catch (e) {
              src = lbSrc;
            }
          }
          tokens.push({
            image: true,
            n: imageN,
            file: file,
            src: src,
            alt: label,
          });
          continue;
        }
        // A caption's text is carried by its figure token above; a paragraph
        // nested in a blockquote/li is carried by that container's text.
        if (
          el.closest("figure") ||
          (tag === "p" && el.closest("blockquote, li"))
        ) {
          continue;
        }
        var text = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (text) {
          tokens.push({ text: text });
        }
      }
      // Append the project meta as its own trailing block — cat shows the whole
      // file, so the role/details/client you set in front matter come along.
      terminalInfoLinesFrom(root).forEach(function (line) {
        tokens.push({ text: line });
      });
      return tokens;
    }

    function terminalLsOne(pathArg, showHidden) {
      // nav/ and settings/ are global menus, reachable from any cwd — match the
      // raw argument (~/nav, nav/, nav) before resolving relative to the cwd.
      var rawArg = String(pathArg || "")
        .replace(/^~\/?/, "")
        .replace(/^\/+|\/+$/g, "")
        .toLowerCase();
      if (rawArg === "nav") {
        return [terminalNavEntries().join("  ")];
      }
      if (rawArg === "settings") {
        return [terminalSettingsEntries().join("  ")];
      }
      // `ls featured` — the curated selection the home page prints — is a view,
      // harvested from the page's cards (so the header's `ls 'featured'` line is
      // reproducible by typing it).
      if (rawArg === "featured") {
        return terminalHarvestFiles(
          ".summary-card a[href], .article-card a[href]",
          "(nothing featured here)"
        );
      }
      var targetSegs = terminalResolveSegments(pathArg);
      var node = terminalNodeAt(targetSegs);
      if (!node) {
        return [
          "ls: cannot access '" + pathArg + "': No such file or directory",
        ];
      }
      var isCwd = targetSegs.join("/") === terminalCwdSegments().join("/");
      // Structural children (sections, tags) are directories — trailing slash.
      var entries = Object.keys(node.children)
        .sort()
        .map(function (k) {
          return node.children[k].name + "/";
        });
      if (isCwd) {
        // The page's own content (posts) are FILES: a post is a .md you `cat`,
        // not a directory you `cd` into — so it reads like real `ls` and the
        // prompt stays in the section when you open one.
        terminalPageContentSlugs(targetSegs).forEach(function (slug) {
          var entry = slug + ".md";
          if (
            entries.indexOf(entry) === -1 &&
            entries.indexOf(slug + "/") === -1
          ) {
            entries.push(entry);
          }
        });
      }
      if (showHidden) {
        entries = [".secret", ".config"].concat(entries);
      }
      if (!entries.length) {
        // A real page (has an href) that we're not currently on: its contents
        // live on that page, so point there instead of printing nothing.
        if (node.href && !isCwd && node.name !== "~") {
          return ["(cd " + node.name + " to list it)"];
        }
        return []; // genuinely empty — real `ls` prints nothing
      }
      var MAX = 40;
      var lines = [entries.slice(0, MAX).join("  ")];
      if (entries.length > MAX) {
        lines.push("… (" + (entries.length - MAX) + " more)");
      }
      return lines;
    }

    // `ls [path...]`: with 0 or 1 paths, list that directory. With several,
    // print a `path:`-headed block per directory, blank-line separated, like
    // real `ls`. Flags (e.g. -a) apply to every path.
    function terminalLsLines(paths, showHidden) {
      if (paths.length <= 1) {
        return terminalLsOne(paths[0] || "", showHidden);
      }
      var out = [];
      paths.forEach(function (path, i) {
        if (i > 0) {
          out.push("");
        }
        out.push(path + ":");
        terminalLsOne(path, showHidden).forEach(function (line) {
          out.push(line);
        });
      });
      return out;
    }

    // Whole-tree view for `tree`, drawn with ├──/└── connectors.
    function terminalTreeLines() {
      var root = terminalDirTree();
      var lines = ["~"];
      function walk(node, prefix) {
        var keys = Object.keys(node.children).sort();
        keys.forEach(function (key, i) {
          var last = i === keys.length - 1;
          lines.push(
            prefix + (last ? "└── " : "├── ") + node.children[key].name + "/"
          );
          walk(node.children[key], prefix + (last ? "    " : "│   "));
        });
      }
      walk(root, "");
      return lines;
    }

    // Contact links harvested from the footer (mailto + LinkedIn), so the
    // `social`/`email`/`copy email` commands always match the real footer and
    // the current language.
    function terminalContactLinks() {
      var out = [];
      document
        .querySelectorAll(".footer-contact a[href]")
        .forEach(function (link) {
          var href = link.getAttribute("href");
          if (!href) {
            return;
          }
          var kind =
            href.indexOf("mailto:") === 0
              ? "email"
              : /linkedin/i.test(href)
              ? "linkedin"
              : "link";
          out.push({ kind: kind, href: href });
        });
      return out;
    }

    // A speech bubble + cow for `cowsay`, text clamped to the phone width.
    function terminalCowsay(text) {
      var msg = String(text || "").trim() || "moo";
      if (msg.length > 30) {
        msg = msg.slice(0, 29) + "…";
      }
      var bar = new Array(msg.length + 3).join("-");
      return [
        " " + bar,
        "< " + msg + " >",
        " " + bar,
        "        \\   ^__^",
        "         \\  (oo)\\_______",
        "            (__)\\       )\\/\\",
        "                ||----w |",
        "                ||     ||",
      ];
    }

    // Resolve a `cat` target to its pseudo-file lines, or null if there's no
    // such "file".
    // The footer-meta row (©, status, legal links) is the site's colophon — it
    // prints on the home tour under a `cat colophon` prompt, so typing it must
    // reproduce it. Harvest the live footer (status items → KEY=value like the
    // footer's own CSS; everything else → its visible text, sans the sr-only
    // labels). Falls back to the static colophon when no footer is in the DOM.
    function terminalColophonLines() {
      var list = document.querySelector(".footer-meta__list");
      if (!list) {
        return TERMINAL_FILES.colophon.slice();
      }
      var out = [];
      list.querySelectorAll(".footer-meta__item").forEach(function (item) {
        var cat = item.querySelector("[data-category]");
        if (cat) {
          out.push(
            cat.getAttribute("data-category").toUpperCase() +
              "=" +
              cat.textContent.replace(/\s+/g, " ").trim()
          );
          return;
        }
        var clone = item.cloneNode(true);
        clone
          .querySelectorAll(".sr-only, .footer-meta__label")
          .forEach(function (n) {
            n.parentNode.removeChild(n);
          });
        var text = clone.textContent.replace(/\s+/g, " ").trim();
        if (text) {
          out.push(text);
        }
      });
      return out.length ? out : TERMINAL_FILES.colophon.slice();
    }

    function terminalFile(name) {
      var key = String(name || "")
        .toLowerCase()
        .replace(/^\.+/, "")
        .replace(/\.(txt|md)$/, "");
      if (key === "secrets") {
        key = "secret";
      }
      // colophon is the live footer, reproduced (see terminalColophonLines).
      if (key === "colophon") {
        return terminalColophonLines();
      }
      return TERMINAL_FILES[key] || null;
    }

    // One-line man description, pulled from the help table so the two never
    // drift apart. Matches the first word of each "  cmd   desc" help row.
    function terminalManPage(topic) {
      var want = String(topic || "").toLowerCase();
      var found = null;
      TERMINAL_HELP.forEach(function (row) {
        if (found) {
          return;
        }
        var trimmed = row.trim();
        var word = trimmed.split(/\s+/)[0];
        if (word === want) {
          found = trimmed.slice(word.length).trim() || null;
        }
      });
      return found;
    }

    // Resolved hex/colour values for a few key palette tokens, for `colour`.
    function terminalColourLines() {
      var styles = window.getComputedStyle(document.documentElement);
      var swatches = [
        ["paper", "--surface-page"],
        ["ink", "--surface-ink-strong"],
        ["accent", "--surface-accent"],
      ];
      var lines = ["palette: " + paletteLabel()];
      swatches.forEach(function (pair) {
        var value = (styles.getPropertyValue(pair[1]) || "").trim();
        lines.push("  " + pair[0] + "  " + (value || "—"));
      });
      return lines;
    }

    // The home link the terminal prompt already points at (falls back to root).
    function terminalHomeUrl() {
      var host = document.querySelector(".terminal-prompt__host[href]");
      return (host && host.getAttribute("href")) || "/";
    }

    // Map the nav's pages to `cd` targets, keyed by both URL slug and link text
    // (so `cd writing` and `cd essays` both resolve if that's the label). Built
    // once — the nav is static for the page's lifetime.
    var terminalNavTargetsCache = null;
    function terminalNavTargets() {
      if (terminalNavTargetsCache) {
        return terminalNavTargetsCache;
      }
      var map = {};
      // Exclude the statusbar quick-toggles (:not(.terminal-quick)): the
      // language toggle is an <a> to the *other* language's URL, whose slug
      // collides with the current page's and would overwrite the real target.
      var links = document.querySelectorAll(
        ".top-menu__nav a[href]:not(.terminal-quick), .top-menu__link[href]"
      );
      links.forEach(function (link) {
        var href = link.getAttribute("href");
        if (!href || href.charAt(0) === "#") {
          return;
        }
        var path = href.replace(/[?#].*$/, "").replace(/\/+$/, "");
        var slug = path.split("/").filter(Boolean).pop();
        if (slug) {
          map[slug.toLowerCase()] = href;
        }
        var text = (link.textContent || "").trim().toLowerCase();
        if (text) {
          map[text] = href;
        }
      });
      terminalNavTargetsCache = map;
      return map;
    }

    // A typed `cd <post>` should reach the same pages `ls` lists — the content
    // cards (works/writing posts) the nav tree can't know about. Resolve the
    // path to absolute segments (relative to cwd), then match a content-card
    // link by its full segments, so cd and ls agree on what exists.
    function terminalContentTargetHref(dest) {
      var wanted = terminalResolveSegments(dest);
      if (wanted.length < 2) {
        return null;
      }
      var wantedKey = wanted.join("/");
      var match = null;
      document
        .querySelectorAll(".article-card a[href], .summary-card a[href]")
        .forEach(function (link) {
          if (match) {
            return;
          }
          var segs = terminalHrefSegments(link.getAttribute("href"));
          if (segs && segs.join("/") === wantedKey) {
            match = link.getAttribute("href");
          }
        });
      return match;
    }

    function resolveCdTarget(dest) {
      var key = String(dest || "")
        .replace(/^\/+|\/+$/g, "")
        .toLowerCase();
      if (!key) {
        return terminalHomeUrl();
      }
      if (key === "home" || key === "~") {
        return terminalHomeUrl();
      }
      var targets = terminalNavTargets();
      // Nav/footer directories first; then the current page's own content
      // cards, so `cd` reaches any post `ls` just listed.
      return targets[key] || terminalContentTargetHref(dest) || null;
    }

    // Languages from the settings language selector, keyed by code. The current
    // language's radio has no data-language-href; every other one carries the
    // translated page's URL (or a homepage fallback).
    function terminalLanguages() {
      var map = {};
      document
        .querySelectorAll(".language-option input[data-language-code]")
        .forEach(function (input) {
          var code = (
            input.getAttribute("data-language-code") || ""
          ).toLowerCase();
          if (!code) {
            return;
          }
          map[code] = {
            href: input.getAttribute("data-language-href"),
            name: (
              input.getAttribute("data-language-name") || ""
            ).toLowerCase(),
          };
        });
      return map;
    }

    function currentLang() {
      return (document.documentElement.getAttribute("lang") || "en")
        .slice(0, 2)
        .toLowerCase();
    }

    var LANG_ALIASES = {
      en: "en",
      english: "en",
      sv: "sv",
      svenska: "sv",
      swedish: "sv",
    };

    // Returns { echo, lines, action }. `echo` is the command as typed (printed
    // with the prompt), `lines` are output rows, `action` (or null) is applied
    // separately. Kept free of DOM mutation so it is straightforward to test.
    function runTerminalCommand(raw) {
      var input = String(raw === null || raw === undefined ? "" : raw).trim();
      if (!input) {
        return { echo: "", lines: [], action: null };
      }
      var parts = input.split(/\s+/);
      var cmd = parts[0].toLowerCase();
      var args = parts.slice(1);
      var rest = input.slice(parts[0].length).trim();

      switch (cmd) {
        case "help":
        case "?":
          return { echo: input, lines: TERMINAL_HELP.slice(), action: null };
        case "exit":
        case "quit":
        case "logout":
          return { echo: input, lines: [], action: { type: "exit" } };
        case "clear":
          return { echo: "", lines: [], action: { type: "clear" } };
        case "dark":
        case "light":
        case "system":
          return {
            echo: input,
            lines: ["mode → " + cmd],
            action: { type: "mode", mode: cmd },
          };
        case "pantone": {
          var sub = (args[0] || "").toLowerCase();
          if (sub === "off" || sub === "stop") {
            return {
              echo: input,
              lines: ["pantone: colour-of-the-year off"],
              action: { type: "pantone", state: "off" },
            };
          }
          if (sub === "on" || sub === "start") {
            return {
              echo: input,
              lines: [
                "pantone: colour-of-the-year on (" + getCurrentCotyYear() + ")",
              ],
              action: { type: "pantone", state: "on" },
            };
          }
          if (sub === "next" || sub === "prev" || sub === "previous") {
            var step = sub === "next" ? 1 : -1;
            return {
              echo: input,
              lines: ["pantone: " + (step > 0 ? "next" : "previous") + " year"],
              action: { type: "pantone", state: "step", step: step },
            };
          }
          if (/^\d{4}$/.test(sub)) {
            var wanted = parseInt(sub, 10);
            var actions = getCotyActions();
            var entries =
              actions && typeof actions.getEntries === "function"
                ? actions.getEntries()
                : null;
            if (
              entries &&
              entries.length &&
              !entries.some(function (entry) {
                return Number(entry.year) === wanted;
              })
            ) {
              var years = entries
                .map(function (entry) {
                  return entry.year;
                })
                .join(", ");
              return {
                echo: input,
                lines: ["pantone: no year " + wanted + " — try: " + years],
                action: null,
              };
            }
            return {
              echo: input,
              lines: ["pantone: year → " + wanted],
              action: { type: "pantone", state: "year", year: wanted },
            };
          }
          if (sub) {
            return {
              echo: input,
              lines: [
                "pantone: unknown option '" +
                  sub +
                  "' — try on, off, next, prev, or a year",
              ],
              action: null,
            };
          }
          return {
            echo: input,
            lines: ["pantone: colour-of-the-year toggled"],
            action: { type: "pantone", state: "toggle" },
          };
        }
        case "grid": {
          var gridState = onOffState(args[0]);
          return {
            echo: input,
            lines: ["grid: " + gridState],
            action: { type: "grid", state: gridState },
          };
        }
        case "grain":
        case "blend":
        case "motion": {
          var effectState = onOffState(args[0]);
          return {
            echo: input,
            lines: [cmd + ": " + effectState],
            action: { type: "effect", effect: cmd, state: effectState },
          };
        }
        case "cd": {
          var dest = args[0] || "~";
          var destKey = dest.replace(/\/+$/, "").toLowerCase();
          if (
            dest === "~" ||
            dest === "/" ||
            dest === ".." ||
            destKey === "home"
          ) {
            // Append-only: cd just moves you (changes the prompt). It doesn't
            // load a page or print anything — like a real shell. You `ls`/`cat`
            // to see things, and nothing above the prompt ever changes.
            return {
              echo: input,
              lines: [],
              action: { type: "chdir", cwd: "~" },
            };
          }
          // nav/ and settings/ are menus, not places — list them, don't enter.
          if (destKey === "nav" || destKey === "settings") {
            return {
              echo: input,
              lines: [
                "cd: " +
                  destKey +
                  " is a menu, not a directory — try: ls " +
                  destKey +
                  "/",
              ],
              action: null,
            };
          }
          // Sections are directories — cd moves you into them (prompt only).
          var sectionTarget = terminalNavTargets()[destKey];
          if (sectionTarget) {
            return {
              echo: input,
              lines: [],
              action: { type: "chdir", cwd: hrefToCwd(sectionTarget) },
            };
          }
          // A post is a file — you cat it, you don't cd into it.
          var postKey = destKey.replace(/\.(md|txt)$/i, "");
          if (terminalContentTargetHref(postKey)) {
            return {
              echo: input,
              lines: [
                "cd: not a directory: " +
                  dest +
                  " — try: cat " +
                  postKey +
                  ".md",
              ],
              action: null,
            };
          }
          return {
            echo: input,
            lines: ["cd: no such file or directory: " + dest],
            action: null,
          };
        }
        case "lang":
        case "language": {
          var languages = terminalLanguages();
          var available = Object.keys(languages);
          var here = currentLang();
          var wanted = (args[0] || "").toLowerCase();
          if (!wanted) {
            return {
              echo: input,
              lines: [
                "language: " + here,
                "available: " + (available.join(", ") || here),
              ],
              action: null,
            };
          }
          var langTarget = LANG_ALIASES[wanted] || wanted;
          if (!languages[langTarget]) {
            return {
              echo: input,
              lines: [
                "lang: unknown language '" +
                  wanted +
                  "' — try: " +
                  (available.join(", ") || here),
              ],
              action: null,
            };
          }
          if (langTarget === here) {
            return {
              echo: input,
              lines: ["language: already " + here],
              action: null,
            };
          }
          if (!languages[langTarget].href) {
            return {
              echo: input,
              lines: ["lang: " + langTarget + " unavailable for this page"],
              action: null,
            };
          }
          // Switch language by loading the translated page. cd:false so the
          // navigation doesn't print a spurious `cd` echo (same directory,
          // different language).
          return {
            echo: input,
            lines: [],
            action: {
              type: "navigate",
              url: languages[langTarget].href,
              cd: false,
            },
          };
        }
        case "contact":
          return {
            echo: input,
            lines: [],
            action: { type: "flow", flow: "contact" },
          };
        case "subscribe":
          return {
            echo: input,
            lines: [],
            action: { type: "flow", flow: "subscribe" },
          };
        case "echo":
          return { echo: input, lines: [rest], action: null };
        case "whoami":
          return {
            echo: input,
            lines: ["visitor", "(not logged in — but welcome anyway)"],
            action: null,
          };
        case "date":
          return {
            echo: input,
            lines: [new Date().toString()],
            action: null,
          };
        case "pwd":
          return {
            echo: input,
            lines: [(window.location && window.location.pathname) || "/"],
            action: null,
          };
        case "neofetch":
        case "screenfetch":
          return {
            echo: input,
            lines: neofetchLines(),
            action: { type: "art" },
          };
        case "sudo":
          if (args.join(" ").toLowerCase() === "make me a sandwich") {
            return { echo: input, lines: ["okay. 🥪"], action: null };
          }
          return {
            echo: input,
            lines: [
              "permission denied: nice try 😏",
              "(this incident has been reported)",
            ],
            action: null,
          };
        case "coffee":
        case "brew":
          return {
            echo: input,
            lines: ["HTTP 418 — I'm a teapot ☕"],
            action: null,
          };
        case "make":
          if ((args[0] || "").toLowerCase() === "coffee") {
            return {
              echo: input,
              lines: ["HTTP 418 — I'm a teapot ☕"],
              action: null,
            };
          }
          if (args.join(" ").toLowerCase() === "me a sandwich") {
            return {
              echo: input,
              lines: ["what? make it yourself."],
              action: null,
            };
          }
          return {
            echo: input,
            lines: [
              "make: *** no rule to make target '" + (args[0] || "") + "'.",
            ],
            action: null,
          };
        case "ls":
        case "dir": {
          // Long filter flags (--featured/--related/--info) are separate lenses;
          // short flags (-a) reveal hidden entries. Keep them apart so "--featured"
          // (which contains an "a") isn't misread as -a.
          var lsLong = args.filter(function (a) {
            return a.indexOf("--") === 0;
          });
          var lsShowHidden = args.some(function (a) {
            return a.charAt(0) === "-" && a.charAt(1) !== "-" && /a/.test(a);
          });
          var lsPaths = args.filter(function (a) {
            return a.charAt(0) !== "-";
          });
          if (lsLong.indexOf("--featured") !== -1) {
            return {
              echo: input,
              lines: terminalHarvestFiles(
                ".summary-card a[href], .article-card a[href]",
                "(nothing featured here)"
              ),
              action: null,
            };
          }
          if (lsLong.indexOf("--related") !== -1) {
            return {
              echo: input,
              lines: terminalHarvestFiles(
                ".related-items__item .type-headline-4 a[href]",
                "(no related files)"
              ),
              action: null,
            };
          }
          if (lsLong.indexOf("--info") !== -1) {
            // `--info` is a lens on the page you're viewing. For a post you
            // haven't opened, its meta now lives in the file — point at cat
            // rather than the misleading "(no info here)".
            if (lsPaths.length) {
              return {
                echo: input,
                lines: [
                  "ls: --info reads the current page — for " +
                    lsPaths[0] +
                    " try: cat " +
                    lsPaths[0],
                ],
                action: null,
              };
            }
            return { echo: input, lines: terminalInfoLines(), action: null };
          }
          if (lsLong.indexOf("--images") !== -1) {
            var figs = document.querySelectorAll(
              ".content figure[data-lightbox]"
            ).length;
            return {
              echo: input,
              lines: [figs ? figs + " images" : "(no images here)"],
              action: null,
            };
          }
          // Append-only: listing the section you've cd'd into but haven't
          // loaded (cd only moved the prompt) — fetch it and print the files
          // below, without touching anything above.
          if (!lsPaths.length && !lsLong.length) {
            var lsSegs = terminalCwdSegments();
            // The current page's DOM has no cards for this cwd (you cd'd here
            // but haven't loaded it) → fetch the section and print it below.
            if (lsSegs.length && !terminalPageContentSlugs(lsSegs).length) {
              var lsUrl = resolveCdTarget(lsSegs[0]);
              if (lsUrl) {
                return {
                  echo: input,
                  lines: [],
                  action: {
                    type: "remote-ls",
                    url: lsUrl,
                    cwd: "~/" + lsSegs[0],
                  },
                };
              }
            }
          }
          return {
            echo: input,
            lines: terminalLsLines(lsPaths, lsShowHidden),
            action: null,
          };
        }
        case "tree":
          return { echo: input, lines: terminalTreeLines(), action: null };
        case "cat": {
          if (!args.length) {
            return {
              echo: input,
              lines: ["usage: cat <file> — try 'cat readme'"],
              action: null,
            };
          }
          var catName = args[0].replace(/\.(md|txt)$/i, "").toLowerCase();
          // A section is a directory — you ls it, you don't cat it.
          if (TERMINAL_SECTION_DIRS[catName]) {
            return {
              echo: input,
              lines: [
                "cat: " +
                  catName +
                  ": Is a directory — try: ls " +
                  catName +
                  "/",
              ],
              action: null,
            };
          }
          // Real page first: a content post, or a readable page (about.md,
          // newsletter.md). Append-only: cat PRINTS the file into the buffer
          // (fetch + extract text) — nothing above changes. (`open` still loads
          // the real page, as the escape hatch.)
          var catHref =
            terminalContentTargetHref(catName) || resolveCdTarget(catName);
          if (catHref) {
            return {
              echo: input,
              lines: [],
              action: { type: "remote-cat", url: catHref, name: args[0] },
            };
          }
          // Otherwise a pseudo-file (readme, colophon, secret, config, …).
          var fileLines = terminalFile(args[0]);
          if (fileLines) {
            return { echo: input, lines: fileLines.slice(), action: null };
          }
          // cwd-relative fallback: a file in a section you've cd'd into but not
          // loaded — its card lives on the remote section page, not this DOM, so
          // the DOM lookups above miss it (the same file `ls` prints by fetching
          // the section). Build the URL from the section base + slug, the way
          // remote-ls does, and let remote-cat fetch it (a 404 → No such file).
          var catSegs = terminalResolveSegments(catName);
          if (catSegs.length >= 2) {
            var catBase = resolveCdTarget(catSegs[0]);
            if (catBase) {
              return {
                echo: input,
                lines: [],
                action: {
                  type: "remote-cat",
                  url:
                    catBase.replace(/\/+$/, "") +
                    "/" +
                    catSegs.slice(1).join("/") +
                    "/",
                  name: args[0],
                },
              };
            }
          }
          return {
            echo: input,
            lines: ["cat: " + args[0] + ": No such file or directory"],
            action: null,
          };
        }
        case "open": {
          if (!args.length) {
            return {
              echo: input,
              lines: ["usage: open <name> — a section or a post"],
              action: null,
            };
          }
          // A general "go there": resolves a section OR a post (resolveCdTarget
          // already falls through to content files) and navigates.
          var openName = args[0].replace(/\/$/, "").replace(/\.(md|txt)$/i, "");
          var openHref = resolveCdTarget(openName);
          if (!openHref) {
            return {
              echo: input,
              lines: ["open: no such file or directory: " + args[0]],
              action: null,
            };
          }
          return {
            echo: input,
            lines: [],
            action: { type: "navigate", url: openHref },
          };
        }
        case "man": {
          var topic = (args[0] || "").toLowerCase();
          if (!topic) {
            return {
              echo: input,
              lines: ["what manual page do you want?", "try: man help"],
              action: null,
            };
          }
          var page = terminalManPage(topic);
          if (!page) {
            return {
              echo: input,
              lines: ["No manual entry for " + topic],
              action: null,
            };
          }
          return { echo: input, lines: [topic + " — " + page], action: null };
        }
        case "uname":
          if (args.indexOf("-a") !== -1) {
            return {
              echo: input,
              lines: [
                "tor-sh 1.0 " +
                  terminalHost() +
                  " terminal " +
                  resolvedModeLabel() +
                  " " +
                  currentLang(),
              ],
              action: null,
            };
          }
          return { echo: input, lines: ["tor-sh"], action: null };
        case "colour":
        case "color":
          return { echo: input, lines: terminalColourLines(), action: null };
        case "fortune": {
          var pick = Math.floor(Math.random() * TERMINAL_FORTUNES.length);
          return {
            echo: input,
            lines: [TERMINAL_FORTUNES[pick]],
            action: null,
          };
        }
        case "history":
          return { echo: input, lines: historyLines(), action: null };
        case "uptime":
          return { echo: input, lines: [uptimeLine()], action: null };
        case "top":
        case "htop":
          return {
            echo: input,
            lines: [
              "  PID  CPU  MEM  CMD",
              "    1   0%   ok  tor-sh",
              "   42   0%   ok  curiosity",
              "  418   0%    —  coffee (defunct)",
            ],
            action: null,
          };
        case "vim":
        case "vi":
          return {
            echo: input,
            lines: [
              "entering vim… only kidding.",
              "to leave, type 'exit' — you're safe here.",
            ],
            action: null,
          };
        case "nano":
          return {
            echo: input,
            lines: ["nano: nothing to edit here.", "type 'exit' to leave."],
            action: null,
          };
        case "emacs":
          return {
            echo: input,
            lines: [
              "emacs: a fine OS, missing an editor.",
              "type 'exit' to leave.",
            ],
            action: null,
          };
        case ":q":
        case ":q!":
        case ":wq":
        case ":wq!":
        case ":x":
          return {
            echo: input,
            lines: ["(you can just type 'exit')"],
            action: { type: "exit" },
          };
        case "rm": {
          var rmArgs = args.join(" ");
          if (
            /-[a-z]*r/i.test(rmArgs) &&
            /(^|\s)(\/|~|\*|\/\*|\.)(\s|$)/.test(rmArgs)
          ) {
            return {
              echo: input,
              lines: ["nice try — it's all in git 😏"],
              action: null,
            };
          }
          if (!args.length) {
            return {
              echo: input,
              lines: ["rm: missing operand"],
              action: null,
            };
          }
          return {
            echo: input,
            lines: [
              "rm: cannot remove '" +
                args[args.length - 1] +
                "': read-only site",
            ],
            action: null,
          };
        }
        case "git": {
          var gitSub = (args[0] || "").toLowerCase();
          var gitReplies = {
            blame: ["git blame: you — last touched just now 😄"],
            commit: ["nothing to commit, working tree clean ✨"],
            push: ["Everything up-to-date."],
            pull: ["Already up to date."],
            status: [
              "On branch main.",
              "nothing to commit, working tree clean",
            ],
            log: ["read the real log: type 'cd writing'"],
          };
          if (!gitSub) {
            return {
              echo: input,
              lines: ["usage: git <command> — try 'git status'"],
              action: null,
            };
          }
          if (gitReplies[gitSub]) {
            return {
              echo: input,
              lines: gitReplies[gitSub].slice(),
              action: null,
            };
          }
          return {
            echo: input,
            lines: ["git: '" + gitSub + "' is not a git command."],
            action: null,
          };
        }
        case "npm":
        case "yarn":
        case "pnpm": {
          var pkgSub = (args[0] || "").toLowerCase();
          if (pkgSub === "install" || pkgSub === "i" || pkgSub === "add") {
            // Print the "working" line now, then reveal the punchline a beat
            // later so it reads like a job that ran before it fell over.
            return {
              echo: input,
              lines: ["resolving 4271 dependencies…"],
              action: {
                type: "defer",
                delay: 900,
                lines: ["done. (kidding — it's vanilla JS)"],
              },
            };
          }
          return {
            echo: input,
            lines: [cmd + ": this site ships no node_modules."],
            action: null,
          };
        }
        case "hello":
        case "hi":
        case "hey":
          return {
            echo: input,
            lines: ["hey 👋", "type 'help' to see what I can do."],
            action: null,
          };
        case "konami":
          return {
            echo: input,
            lines: ["konami: party mode 🌈"],
            action: { type: "konami" },
          };
        // ---- Group A: visitor utilities ----------------------------------
        case "hire":
          return {
            echo: input,
            lines: ["let's build something. starting a message…"],
            action: { type: "flow", flow: "contact" },
          };
        case "social":
        case "links": {
          var contacts = terminalContactLinks();
          if (!contacts.length) {
            return {
              echo: input,
              lines: ["no links here — try 'contact'"],
              action: null,
            };
          }
          return {
            echo: input,
            lines: contacts.map(function (c) {
              return c.kind + ": " + c.href.replace(/^mailto:/, "");
            }),
            action: null,
          };
        }
        case "email": {
          var mail = terminalContactLinks().filter(function (c) {
            return c.kind === "email";
          })[0];
          return {
            echo: input,
            lines: [
              mail
                ? mail.href.replace(/^mailto:/, "")
                : "no email on file — try 'contact'",
            ],
            action: null,
          };
        }
        case "resume":
        case "cv": {
          var aboutUrl = resolveCdTarget("about");
          if (!aboutUrl) {
            return {
              echo: input,
              lines: ["resume: about page not found"],
              action: null,
            };
          }
          return {
            echo: input,
            lines: ["opening about → CV…"],
            action: { type: "navigate", url: aboutUrl },
          };
        }
        // ---- Group B: builder tools --------------------------------------
        case "layout":
        case "theme": {
          var wantedLayout = (args[0] || "").toLowerCase();
          var nowLayout =
            document.documentElement.getAttribute("data-layout") || "column";
          if (!wantedLayout) {
            return {
              echo: input,
              lines: [
                "layout: " + nowLayout,
                "available: " + TERMINAL_LAYOUTS.join(", "),
              ],
              action: null,
            };
          }
          if (TERMINAL_LAYOUTS.indexOf(wantedLayout) === -1) {
            return {
              echo: input,
              lines: [
                "layout: unknown '" +
                  wantedLayout +
                  "' — try: " +
                  TERMINAL_LAYOUTS.join(", "),
              ],
              action: null,
            };
          }
          if (wantedLayout === nowLayout) {
            return {
              echo: input,
              lines: ["layout: already " + wantedLayout],
              action: null,
            };
          }
          return {
            echo: input,
            lines: ["layout → " + wantedLayout],
            action: { type: "layout", layout: wantedLayout },
          };
        }
        case "debug":
        case "env": {
          var root = document.documentElement;
          var effectState = function (attr) {
            return root.getAttribute(attr) === "on" ? "on" : "off";
          };
          return {
            echo: input,
            lines: [
              "mode       " +
                (localStorage.getItem("theme-mode") || "system") +
                " (" +
                resolvedModeLabel() +
                ")",
              "palette    " + paletteLabel(),
              "layout     " + (root.getAttribute("data-layout") || "column"),
              "typography " +
                (localStorage.getItem("theme-typography") || "editorial"),
              "grain      " + effectState("data-effect-grain"),
              "blend      " + effectState("data-effect-blend"),
              "motion     " +
                (effectState("data-effect-reduced-motion") === "on"
                  ? "reduced"
                  : "full"),
              "lang       " + currentLang(),
              "pantone    " + getCurrentCotyYear(),
            ],
            action: null,
          };
        }
        case "reset":
          return {
            echo: input,
            lines: ["reset: theme restored to defaults"],
            action: { type: "reset" },
          };
        case "copy": {
          var copyWhat = (args[0] || "").toLowerCase();
          var copyText = "";
          if (copyWhat === "email") {
            var copyMail = terminalContactLinks().filter(function (c) {
              return c.kind === "email";
            })[0];
            copyText = copyMail ? copyMail.href.replace(/^mailto:/, "") : "";
          } else if (copyWhat === "url" || copyWhat === "link") {
            copyText = (window.location && window.location.href) || "";
          } else if (copyWhat) {
            copyText = rest;
          } else {
            copyText = lastTerminalOutput || "";
          }
          if (!copyText) {
            return {
              echo: input,
              lines: ["copy: nothing to copy — try 'copy email' or 'copy url'"],
              action: null,
            };
          }
          return {
            echo: input,
            lines: [
              "copied: " +
                (copyText.length > 30 ? copyText.slice(0, 29) + "…" : copyText),
            ],
            action: { type: "copy", text: copyText },
          };
        }
        // ---- Group C: classic unix eggs ----------------------------------
        case "sl":
          return {
            echo: input,
            lines: [
              "        _____      . . .",
              "   ____/ tor \\_______________",
              "  |___________________________|",
              "   (O)   (O)   (O)   (O)   (O) ",
              "  choo choo — you typed ls wrong",
            ],
            action: null,
          };
        case "xyzzy":
          return { echo: input, lines: ["Nothing happens."], action: null };
        case "42":
        case "answer":
          return {
            echo: input,
            lines: ["the answer to life, the universe & everything: 42"],
            action: null,
          };
        case "moo":
          return {
            echo: input,
            lines: [
              "         (__)",
              "         (oo)",
              "   /------\\/ ",
              "  / |    ||  ",
              " *  /\\---/\\  ",
              "    ~~   ~~  ",
              "…has this terminal mooed today?",
            ],
            action: null,
          };
        case "ping": {
          var pingHost = args[0] || terminalHost();
          return {
            echo: input,
            lines: [
              "PING " + pingHost + " — pong 🏓",
              "1 packet transmitted, 1 received, 0.42 ms",
            ],
            action: null,
          };
        }
        // ---- Group D: design / ASCII eggs --------------------------------
        case "cowsay":
          return { echo: input, lines: terminalCowsay(rest), action: null };
        case "logo":
        case "ascii": {
          var logoLines = terminalArtLines();
          return {
            echo: input,
            lines: logoLines.length ? logoLines : ["(no logo art here)"],
            action: null,
          };
        }
        case "weather": {
          var weatherLoc = rest || "Göteborg";
          return {
            echo: input,
            lines: [
              weatherLoc + ": ⛅ +17°C, light breeze",
              "(source: vibes, not a real API)",
            ],
            action: null,
          };
        }
        case "matrix":
          return { echo: input, lines: [], action: { type: "matrix" } };
        case "easteregg":
        case "eastereggs":
          return {
            echo: input,
            lines: TERMINAL_EASTER_EGGS.slice(),
            action: null,
          };
        default:
          return {
            echo: input,
            lines: [cmd + ": command not found — try 'help'"],
            action: null,
          };
      }
    }

    // Party mode: a root attribute CSS hangs a playful hue-cycle off. Toggled
    // by the `konami` command and by the arrow-key Konami code at the prompt.
    //
    // The guard collapses a synchronous burst of calls into a single toggle.
    // In the browser this is a no-op — one handler fires once. It matters under
    // test, where re-requiring the module re-runs its DOMContentLoaded init and
    // stacks duplicate prompt handlers that would otherwise all toggle for one
    // keypress; the flag lives on `window` so every stacked copy shares it, and
    // clears on the next microtask so genuine later toggles still register.
    function toggleKonami() {
      if (window.__konamiToggling) {
        return;
      }
      window.__konamiToggling = true;
      window.Promise.resolve().then(function () {
        window.__konamiToggling = false;
      });
      var root = document.documentElement;
      if (root.getAttribute("data-konami") === "on") {
        root.removeAttribute("data-konami");
      } else {
        root.setAttribute("data-konami", "on");
      }
    }

    // A typed cd can only swap in place for a same-origin target.
    function isSameOriginUrl(href) {
      try {
        return (
          new URL(href, window.location.href).origin === window.location.origin
        );
      } catch (err) {
        return false;
      }
    }

    // Full-reload navigation — the click-path behaviour: stash the `cd` echo so
    // the destination prints it above its first prompt, then load. The fallback
    // for every typed nav that can't (or shouldn't) swap in place.
    function fullReloadNavigate(action) {
      if (action.cd !== false) {
        stashTerminalCd(currentTerminalCwd(), hrefToCwd(action.url));
      }
      try {
        window.location.assign(action.url);
      } catch (err) {
        window.location.href = action.url;
      }
    }

    // Typed navigation. Clicks still full-reload (see the click handler below);
    // only typed cd/resume/home reach here. Swap in place when we can — terminal
    // layout, same-origin, a real directory (home stays a full reload, it's a
    // CSS-bundled page), not a language switch (cd:false) — and hand off to
    // terminal-nav.js, which makes the final call after fetching (it declines
    // special pages it can only detect from the response). If it declines, isn't
    // present, or nothing qualifies, fall back to a full reload. The command
    // echo already printed to the scrollback, so an in-place swap needs no extra
    // output; on fallback the reload wipes it and the stash reprints it on top.
    function navigateTerminal(action) {
      var cwd = hrefToCwd(action.url);
      var canSwap =
        action.cd !== false &&
        isTerminalLayout() &&
        cwd !== "~" &&
        isSameOriginUrl(action.url) &&
        window.TerminalNav &&
        typeof window.TerminalNav.go === "function";
      if (!canSwap) {
        fullReloadNavigate(action);
        return;
      }
      window.TerminalNav.go(action.url, { cwd: cwd }).then(function (swapped) {
        if (!swapped) {
          fullReloadNavigate(action);
        }
      });
    }

    function applyTerminalAction(action) {
      if (!action) {
        return;
      }
      switch (action.type) {
        case "konami":
          toggleKonami();
          break;
        case "layout":
          // Leaving the terminal for another layout wipes the scrollback so it
          // doesn't leak into the destination (same as exitTerminal).
          if (
            action.layout &&
            action.layout !== "terminal" &&
            isTerminalLayout() &&
            terminalSession
          ) {
            terminalSession.textContent = "";
          }
          setLayout(action.layout);
          break;
        case "reset":
          if (
            typeof isPantoneModeActive === "function" &&
            isPantoneModeActive()
          ) {
            stopPantone();
          }
          setMode("system");
          commitPaletteSelection("standard", { toast: false });
          setTypography("editorial");
          setGrainEnabled(false, { silent: true });
          setBlendEnabled(false, { silent: true });
          setReducedMotionEnabled(false, { silent: true });
          break;
        case "copy":
          try {
            if (
              window.navigator &&
              window.navigator.clipboard &&
              typeof window.navigator.clipboard.writeText === "function"
            ) {
              window.navigator.clipboard.writeText(action.text);
            }
          } catch (err) {
            /* clipboard unavailable — the confirmation line already printed */
          }
          break;
        case "matrix":
          runTerminalMatrix();
          break;
        case "exit":
          exitTerminal();
          break;
        case "clear":
          if (terminalSession) {
            terminalSession.textContent = "";
          }
          break;
        case "mode":
          setMode(action.mode);
          break;
        case "pantone":
          if (action.state === "off") {
            stopPantone();
          } else if (action.state === "on") {
            if (!isPantoneModeActive()) {
              activatePantone({ playing: false, resetYear: true });
            }
          } else if (action.state === "year") {
            if (!isPantoneModeActive()) {
              activatePantone({ playing: false, resetYear: false });
            }
            setCotyYear(action.year, {
              fromUser: true,
              transitionDuration: PANTONE_MANUAL_TRANSITION_MS,
            });
          } else if (action.state === "step") {
            if (!isPantoneModeActive()) {
              activatePantone({ playing: false, resetYear: false });
            }
            advanceCotyYear(action.step, {
              fromUser: true,
              transitionDuration: PANTONE_MANUAL_TRANSITION_MS,
            });
          } else {
            togglePantoneMode();
          }
          break;
        case "grid": {
          var gridBtn = document.querySelector('[data-js="grid-toggle"]');
          if (!gridBtn) {
            break;
          }
          // "closing" means the overlay is animating out — treat it as off, the
          // same as grid-overlay.js's own open() guard, so a mid-close toggle
          // isn't misread as on.
          var gridAttr =
            document.documentElement.getAttribute("data-grid-overlay");
          var gridOn = gridAttr !== null && gridAttr !== "closing";
          if (action.state === "toggle" || (action.state === "on") !== gridOn) {
            gridBtn.click();
          }
          break;
        }
        case "effect": {
          var effect = TERMINAL_EFFECTS[action.effect];
          if (!effect) {
            break;
          }
          // `feature` is what the command word means (grain/blend present, or
          // motion playing). For motion that is the inverse of the underlying
          // data-effect-reduced-motion attribute, so `motion on` restores
          // animation rather than suppressing it.
          var attrOn =
            document.documentElement.getAttribute(effect.attr) === "on";
          var featureOn = effect.invert ? !attrOn : attrOn;
          var targetFeature =
            action.state === "on"
              ? true
              : action.state === "off"
              ? false
              : !featureOn;
          effect.set(effect.invert ? !targetFeature : targetFeature);
          break;
        }
        case "navigate":
          if (action.url) {
            navigateTerminal(action);
          }
          break;
        case "chdir":
          // Append-only cd: move the prompt only. --terminal-cwd drives the
          // PS1, so setting it (inline, wins over head.html's :root rule) is the
          // whole move. No fetch, no swap, no scroll jump — nothing above the
          // prompt changes.
          document.documentElement.style.setProperty(
            "--terminal-cwd",
            '"' + (action.cwd || "~") + '"'
          );
          break;
        case "remote-ls":
          // Append-only ls: fetch the section you've cd'd into and print its
          // files into the scrollback below — nothing above moves.
          if (typeof window.fetch !== "function") {
            printTerminalLine(
              "ls: cannot reach " + action.url,
              "terminal-session__out"
            );
            break;
          }
          window
            .fetch(action.url, { credentials: "same-origin" })
            .then(function (res) {
              return res.ok ? res.text() : Promise.reject();
            })
            .then(function (html) {
              var doc = new DOMParser().parseFromString(html, "text/html");
              var files = [];
              doc
                .querySelectorAll(
                  ".summary-card a[href], .article-card a[href]"
                )
                .forEach(function (a) {
                  var segs = terminalHrefSegments(a.getAttribute("href"));
                  if (!segs || segs.length < 2) {
                    return;
                  }
                  var slug = segs[segs.length - 1];
                  var entry = slug === "tags" ? "tags/" : slug + ".md";
                  if (files.indexOf(entry) === -1) {
                    files.push(entry);
                  }
                });
              printTerminalLine(
                files.length ? files.join("  ") : "(empty)",
                "terminal-session__out"
              );
              scrollTerminalToEnd();
            })
            .catch(function () {
              printTerminalLine(
                "ls: cannot reach " + action.url,
                "terminal-session__out"
              );
              scrollTerminalToEnd();
            });
          break;
        case "remote-cat": {
          // Append-only cat: fetch the post and print its readable text
          // (images as [image N] tokens) into the scrollback below — nothing
          // above the prompt changes. `open` is the escape hatch to the page.
          var catLabel = action.name || action.url;
          if (typeof window.fetch !== "function") {
            printTerminalLine(
              "cat: cannot reach " + action.url,
              "terminal-session__out"
            );
            break;
          }
          window
            .fetch(action.url, { credentials: "same-origin" })
            .then(function (res) {
              // A 404 means the guessed cwd-relative path doesn't exist — a
              // genuine "No such file", distinct from a network failure.
              if (!res.ok) {
                var notFound = new Error("not found");
                notFound.notFound = true;
                throw notFound;
              }
              return res.text();
            })
            .then(function (html) {
              var doc = new DOMParser().parseFromString(html, "text/html");
              var catTokens = terminalExtractPostLines(doc, action.url);
              if (!catTokens.length) {
                printTerminalLine(
                  "cat: " + catLabel + ": (empty)",
                  "terminal-session__out"
                );
              } else {
                catTokens.forEach(function (tok) {
                  if (tok.image) {
                    printTerminalImageLine(tok);
                  } else {
                    printTerminalLine(tok.text, "terminal-session__out");
                  }
                });
              }
              scrollTerminalToEnd();
            })
            .catch(function (err) {
              printTerminalLine(
                err && err.notFound
                  ? "cat: " + catLabel + ": No such file or directory"
                  : "cat: cannot reach " + action.url,
                "terminal-session__out"
              );
              scrollTerminalToEnd();
            });
          break;
        }
        case "flow":
          startTerminalFlow(action.flow);
          break;
        case "defer":
          // Print follow-up lines after a delay, so a command can fake a job
          // running before its punchline. Skip if the terminal was left in
          // the meantime.
          if (action.lines && action.lines.length) {
            window.setTimeout(function () {
              if (!isTerminalLayout()) {
                return;
              }
              action.lines.forEach(function (line) {
                printTerminalLine(line, "terminal-session__out");
              });
              scrollTerminalToEnd();
            }, action.delay || 600);
          }
          break;
        default:
          break;
      }
    }

    function printTerminalLine(text, className, frozenCwd) {
      if (!terminalSession) {
        return;
      }
      var line = document.createElement("span");
      line.className = "terminal-session__line " + className;
      line.textContent = text;
      // Freeze the prompt's cwd on an echoed command so the scrollback keeps
      // the directory it ran at — a later `cd` moves only the live prompt, not
      // the history above (matching the pending-cd echo's own inline override).
      if (frozenCwd) {
        line.style.setProperty("--terminal-cwd", '"' + frozenCwd + '"');
      }
      terminalSession.appendChild(line);
      // Remember the last *output* row, so `copy` with no argument grabs it.
      if (className.indexOf("terminal-session__out") !== -1) {
        lastTerminalOutput = text;
      }
    }

    // A cat'd image prints as a clickable [image N] token: a terminal can't
    // paint the picture, but the token carries the real image URL and filename,
    // so clicking it echoes `open <file>` and opens the picture in the lightbox
    // (see the terminalSession click handler). Keyboard-reachable as a button.
    function printTerminalImageLine(tok) {
      if (!terminalSession) {
        return;
      }
      var line = document.createElement("span");
      line.className = "terminal-session__line terminal-session__out";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "terminal-session__image";
      btn.textContent =
        "[image " + tok.n + (tok.alt ? ": " + tok.alt : "") + "]";
      btn.setAttribute("data-image-src", tok.src || "");
      btn.setAttribute("data-image-file", tok.file || "");
      btn.setAttribute("data-image-alt", tok.alt || "");
      line.appendChild(btn);
      terminalSession.appendChild(line);
    }

    // A short, bounded "digital rain" burst for `matrix` — a few deferred
    // frames of random glyph rows, then it stops. No persistent interval, so
    // nothing outlives the terminal or fights reduced motion.
    function runTerminalMatrix() {
      var GLYPHS = "01ﾊﾋﾎｱｲｳｴｵｶｷｸ日ﾘｦ";
      var FRAMES = 3;
      var step = 0;
      function row() {
        var s = "";
        for (var i = 0; i < 30; i++) {
          s += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        }
        return s;
      }
      function frame() {
        if (!isTerminalLayout()) {
          return;
        }
        for (var r = 0; r < 4; r++) {
          printTerminalLine(row(), "terminal-session__out");
        }
        scrollTerminalToEnd();
        step += 1;
        if (step < FRAMES) {
          window.setTimeout(frame, 220);
        } else {
          window.setTimeout(function () {
            if (isTerminalLayout()) {
              printTerminalLine("wake up… 🟢", "terminal-session__out");
              scrollTerminalToEnd();
            }
          }, 220);
        }
      }
      frame();
    }

    function runTerminalInput(raw) {
      // Record the command before running it, so `history` includes itself —
      // matching a real shell. Reset the ↑/↓ recall cursor to the live line.
      terminalHistoryCursor = null;
      var trimmed = String(raw === null || raw === undefined ? "" : raw).trim();
      if (trimmed) {
        terminalHistory.push(trimmed);
        if (terminalHistory.length > TERMINAL_HISTORY_MAX) {
          terminalHistory.shift();
        }
      }
      var result = runTerminalCommand(raw);
      if (result.echo) {
        // Freeze the echo at the cwd it ran at. applyTerminalAction (below)
        // is what performs an append-only `cd`, so reading the cwd now — before
        // it runs — captures where the command was actually typed.
        printTerminalLine(
          result.echo,
          "terminal-session__cmd",
          currentTerminalCwd()
        );
      }
      var artLines =
        result.action && result.action.type === "art" ? terminalArtLines() : [];
      artLines.forEach(function (line) {
        printTerminalLine(
          line,
          "terminal-session__out terminal-session__out--art"
        );
      });
      (result.lines || []).forEach(function (line) {
        printTerminalLine(line, "terminal-session__out");
      });
      applyTerminalAction(result.action);
      // Keep the newest output and the prompt in view; refocus so the mobile
      // keyboard stays up for the next command.
      scrollTerminalToEnd();
    }

    // The boot banner's small block-curl, reused as neofetch art when present.
    function terminalArtLines() {
      var art = document.querySelector(".terminal-boot__art--sm");
      if (!art || !art.textContent) {
        return [];
      }
      return art.textContent.replace(/^\n+|\n+$/g, "").split("\n");
    }

    function scrollTerminalToEnd() {
      if (terminalInput && isTerminalLayout()) {
        window.requestAnimationFrame(function () {
          window.scrollTo(0, document.body.scrollHeight);
          terminalInput.focus();
        });
      }
    }

    // ----------------------------------------------------------------------
    // Interactive prompt flows (contact, subscribe)
    // Some commands aren't one-shot: they collect a few fields one prompt at a
    // time, like a CLI wizard, then POST to the very same backend the on-page
    // forms use. While a flow runs, Enter feeds the current step (not the
    // command parser), the prompt shows the field name, and `cancel`/Escape
    // aborts. Contact posts to the Netlify form endpoint; subscribe reuses the
    // footer newsletter form's action and hidden fields.
    // ----------------------------------------------------------------------
    let terminalFlow = null;

    function isEmailish(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function nonEmpty(value) {
      return value.length > 0;
    }

    function submitContactFlow(data) {
      printTerminalLine("sending…", "terminal-session__out");
      var body = new window.URLSearchParams({
        "form-name": "contact",
        "bot-field": "",
        name: data.name || "",
        email: data.email || "",
        message: data.message || "",
      }).toString();
      window
        .fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body,
        })
        .then(function (response) {
          printTerminalLine(
            response && response.ok
              ? "message sent — thanks, I'll be in touch."
              : "send failed — try the contact page instead.",
            "terminal-session__out"
          );
        })
        .catch(function () {
          printTerminalLine(
            "send failed — you may be offline.",
            "terminal-session__out"
          );
        })
        .then(scrollTerminalToEnd);
    }

    function submitSubscribeFlow(data) {
      var form = document.querySelector("form[data-mc-form]");
      if (!form) {
        printTerminalLine(
          "subscribe: the newsletter isn't available here.",
          "terminal-session__out"
        );
        scrollTerminalToEnd();
        return;
      }
      var emailField = form.querySelector('input[type="email"]');
      var formData = new window.FormData(form);
      if (emailField && emailField.name) {
        formData.set(emailField.name, data.email);
      }
      printTerminalLine("subscribing…", "terminal-session__out");
      window
        .fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new window.URLSearchParams(formData).toString(),
        })
        .then(function (response) {
          // A non-OK status returns HTML, not JSON — surface it as a server
          // error rather than letting response.json() reject into the generic
          // "offline" catch.
          if (!response || !response.ok) {
            printTerminalLine(
              "couldn't subscribe — the server rejected it.",
              "terminal-session__out"
            );
            return null;
          }
          return response.json();
        })
        .then(function (result) {
          if (!result) {
            return; // non-OK already reported
          }
          if (result.success) {
            printTerminalLine(
              "subscribed — check your inbox to confirm.",
              "terminal-session__out"
            );
          } else if (result.error === "already_subscribed") {
            printTerminalLine(
              "you're already subscribed.",
              "terminal-session__out"
            );
          } else {
            printTerminalLine(
              "couldn't subscribe — try the footer form.",
              "terminal-session__out"
            );
          }
        })
        .catch(function () {
          printTerminalLine(
            "couldn't subscribe — you may be offline.",
            "terminal-session__out"
          );
        })
        .then(scrollTerminalToEnd);
    }

    var TERMINAL_FLOWS = {
      contact: {
        intro: "contact — send me a message. type 'cancel' to abort.",
        steps: [
          {
            key: "email",
            label: "email",
            validate: isEmailish,
            error: "that doesn't look like an email — try again",
          },
          {
            key: "name",
            label: "name",
            validate: nonEmpty,
            error: "name can't be empty",
          },
          {
            key: "message",
            label: "message",
            validate: nonEmpty,
            error: "message can't be empty",
          },
        ],
        confirm: "send this? [Y/n]",
        submit: submitContactFlow,
      },
      subscribe: {
        intro:
          "subscribe — the occasional note, no spam. type 'cancel' to abort.",
        steps: [
          {
            key: "email",
            label: "email",
            validate: isEmailish,
            error: "that doesn't look like an email — try again",
          },
        ],
        confirm: "subscribe with this address? [Y/n]",
        submit: submitSubscribeFlow,
      },
    };

    // The prompt is shown verbatim; field steps pass "email>", the confirm step
    // passes its full question. Pass null to restore the shell PS1. The label is
    // set on BOTH the tail (so the hint's ::after can switch) and the prompt
    // span (so its ::before can read the label via attr() — attr() only sees the
    // pseudo-element's own element, not an ancestor).
    function setFlowPrompt(prompt) {
      if (!terminalTail) {
        return;
      }
      var promptEl = terminalTail.querySelector(".terminal-tail__prompt");
      if (prompt) {
        terminalTail.setAttribute("data-flow-label", prompt);
        if (promptEl) {
          promptEl.setAttribute("data-flow-label", prompt);
        }
      } else {
        terminalTail.removeAttribute("data-flow-label");
        if (promptEl) {
          promptEl.removeAttribute("data-flow-label");
        }
      }
    }

    function startTerminalFlow(name) {
      var def = TERMINAL_FLOWS[name];
      if (!def) {
        return;
      }
      terminalFlow = { def: def, step: 0, data: {}, confirming: false };
      printTerminalLine(def.intro, "terminal-session__out");
      setFlowPrompt(def.steps[0].label + ">");
    }

    function endTerminalFlow() {
      terminalFlow = null;
      setFlowPrompt(null);
    }

    // Let the top-level exitTerminal() abort a flow when leaving the terminal.
    terminalFlowReset = endTerminalFlow;

    function handleTerminalFlowInput(raw) {
      var flow = terminalFlow;
      var value = String(raw === null || raw === undefined ? "" : raw).trim();

      if (value.toLowerCase() === "cancel") {
        printTerminalLine("^C", "terminal-session__out");
        endTerminalFlow();
        return;
      }

      if (!flow.confirming) {
        var stepDef = flow.def.steps[flow.step];
        printTerminalLine(
          stepDef.label + "> " + value,
          "terminal-session__flow"
        );
        if (stepDef.validate && !stepDef.validate(value)) {
          printTerminalLine(stepDef.error, "terminal-session__out");
          return; // stay on this step
        }
        flow.data[stepDef.key] = value;
        flow.step += 1;
        if (flow.step < flow.def.steps.length) {
          setFlowPrompt(flow.def.steps[flow.step].label + ">");
        } else {
          flow.confirming = true;
          setFlowPrompt(flow.def.confirm);
        }
        return;
      }

      // Confirmation step: empty / y / yes sends; n / no aborts.
      printTerminalLine(
        flow.def.confirm + " " + value,
        "terminal-session__flow"
      );
      var answer = value.toLowerCase();
      if (answer === "" || answer === "y" || answer === "yes") {
        var submit = flow.def.submit;
        var data = flow.data;
        endTerminalFlow();
        submit(data);
      } else if (answer === "n" || answer === "no") {
        printTerminalLine("cancelled", "terminal-session__out");
        endTerminalFlow();
      } else {
        printTerminalLine("please answer y or n", "terminal-session__out");
      }
    }

    function syncTerminalInputSize() {
      if (!terminalInput) {
        return;
      }
      terminalInput.size = Math.max(1, terminalInput.value.length);
      if (terminalTail) {
        terminalTail.classList.toggle("is-typing", terminalInput.value !== "");
      }
    }

    // Track the Konami code as it's typed into the prompt. Non-destructive:
    // it only watches keys, then tidies the stray "b"/"a" once it completes.
    function advanceKonami(e) {
      var key = String(e.key || "").toLowerCase();
      if (key === KONAMI_SEQUENCE[konamiProgress]) {
        konamiProgress += 1;
        if (konamiProgress === KONAMI_SEQUENCE.length) {
          konamiProgress = 0;
          if (terminalInput) {
            terminalInput.value = "";
            syncTerminalInputSize();
          }
          toggleKonami();
          printTerminalLine("konami: party mode 🌈", "terminal-session__out");
          scrollTerminalToEnd();
        }
      } else {
        // Let a mistyped key restart the sequence if it's the first step.
        konamiProgress = key === KONAMI_SEQUENCE[0] ? 1 : 0;
      }
    }

    // ↑/↓ history recall: walk terminalHistory, oldest→newest, restoring an
    // empty line past the newest entry. `dir` is -1 for ↑ (older), +1 for ↓.
    function terminalRecallHistory(dir) {
      if (!terminalInput || !terminalHistory.length) {
        return;
      }
      if (terminalHistoryCursor === null) {
        terminalHistoryCursor = terminalHistory.length;
      }
      terminalHistoryCursor = Math.max(
        0,
        Math.min(terminalHistory.length, terminalHistoryCursor + dir)
      );
      terminalInput.value = terminalHistory[terminalHistoryCursor] || "";
      syncTerminalInputSize();
      var end = terminalInput.value.length;
      try {
        terminalInput.setSelectionRange(end, end);
      } catch (err) {
        /* selection API unavailable — value is still set */
      }
    }

    // Tab completion: complete the command word, or a cd/ls/open path fragment
    // against the current directory's children. Single match fills; multiple
    // print the candidates.
    function terminalCompleteInput() {
      if (!terminalInput) {
        return;
      }
      var value = terminalInput.value;
      var parts = value.split(/\s+/);
      var candidates;
      var frag;
      if (parts.length <= 1) {
        frag = (parts[0] || "").toLowerCase();
        candidates = TERMINAL_COMMAND_NAMES.filter(function (name) {
          return name.indexOf(frag) === 0;
        });
      } else {
        var verb = parts[0].toLowerCase();
        if (
          verb !== "cd" &&
          verb !== "ls" &&
          verb !== "open" &&
          verb !== "cat"
        ) {
          return;
        }
        frag = (parts[parts.length - 1] || "").toLowerCase();
        var cwdSegs = terminalCwdSegments();
        var node = terminalNodeAt(cwdSegs);
        candidates = node
          ? Object.keys(node.children).filter(function (name) {
              return name.indexOf(frag) === 0;
            })
          : [];
        // cat/open reach the page's posts too — complete them as .md files.
        if (verb === "cat" || verb === "open") {
          terminalPageContentSlugs(cwdSegs).forEach(function (slug) {
            var file = slug + ".md";
            if (file.indexOf(frag) === 0 && candidates.indexOf(file) === -1) {
              candidates.push(file);
            }
          });
        }
      }
      if (candidates.length === 1) {
        parts[parts.length - 1] = candidates[0];
        terminalInput.value = parts.join(" ") + (parts.length === 1 ? " " : "");
        syncTerminalInputSize();
      } else if (candidates.length > 1) {
        printTerminalLine(candidates.join("  "), "terminal-session__out");
        scrollTerminalToEnd();
      }
    }

    if (terminalInput) {
      // Typing invalidates the history-recall position.
      terminalInput.addEventListener("input", function () {
        terminalHistoryCursor = null;
        syncTerminalInputSize();
      });
      terminalInput.addEventListener("keydown", function (e) {
        advanceKonami(e);
        // Ctrl shortcuts: ^L clear screen, ^U clear line, ^C cancel line.
        if (e.ctrlKey && !e.altKey && !e.metaKey) {
          var ctrlKey = (e.key || "").toLowerCase();
          if (ctrlKey === "l") {
            e.preventDefault();
            if (terminalSession) {
              terminalSession.textContent = "";
            }
            return;
          }
          if (ctrlKey === "u") {
            e.preventDefault();
            terminalInput.value = "";
            terminalHistoryCursor = null;
            syncTerminalInputSize();
            return;
          }
          if (ctrlKey === "c") {
            e.preventDefault();
            printTerminalLine("^C", "terminal-session__out");
            if (terminalFlow) {
              endTerminalFlow();
            }
            terminalInput.value = "";
            terminalHistoryCursor = null;
            syncTerminalInputSize();
            scrollTerminalToEnd();
            return;
          }
        }
        if (e.key === "Tab") {
          e.preventDefault();
          if (!terminalFlow) {
            terminalCompleteInput();
          }
          return;
        }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          if (!terminalFlow && terminalHistory.length) {
            e.preventDefault();
            terminalRecallHistory(e.key === "ArrowUp" ? -1 : 1);
          }
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          var value = terminalInput.value;
          terminalInput.value = "";
          syncTerminalInputSize();
          if (terminalFlow) {
            handleTerminalFlowInput(value);
            scrollTerminalToEnd();
          } else {
            runTerminalInput(value);
          }
        } else if (e.key === "Escape") {
          if (terminalFlow) {
            // Escape aborts an in-progress flow rather than leaving — clear the
            // half-typed value too, so it isn't run as a command on next Enter.
            e.preventDefault();
            terminalInput.value = "";
            syncTerminalInputSize();
            printTerminalLine("^C", "terminal-session__out");
            endTerminalFlow();
            scrollTerminalToEnd();
          } else if (
            e.defaultPrevented ||
            document.documentElement.classList.contains("lightbox-open") ||
            document.documentElement.hasAttribute("data-settings-panel-open")
          ) {
            // An open overlay owns this Escape — let it close first, exactly as
            // the global handler defers.
            return;
          } else if (terminalInput.value === "") {
            // Empty prompt + Escape leaves the terminal, matching the global
            // handler (which ignores events targeting inputs).
            terminalInput.blur();
            exitTerminal();
          }
        }
      });
      syncTerminalInputSize();
    }

    // ----------------------------------------------------------------------
    // Nav "cd" feedback
    // A full page load gives almost no signal that navigation happened. So a
    // nav click (or a typed `cd`) reads like running `cd <page>`: we stash the
    // command, and the destination page prints it as the first scrollback line
    // above its own `~/cwd$ ls nav/` prompt — the real cd→ls sequence, with no
    // scroll and no boot theater. Purely additive; navigation is never delayed.
    // ----------------------------------------------------------------------
    const TERMINAL_CD_KEY = "terminal-cd";

    function currentTerminalCwd() {
      var value = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue("--terminal-cwd")
        .trim()
        .replace(/^["']|["']$/g, "");
      return value || "~";
    }

    // Derive a page's cwd (~ or ~/segment) from a link href, mirroring the
    // per-page logic in head.html (strip origin, query/hash, and lang prefix).
    function hrefToCwd(href) {
      var path = String(href || "")
        .replace(/^[a-z]+:\/\/[^/]+/i, "")
        .replace(/[?#].*$/, "")
        .replace(/^\/+|\/+$/g, "");
      var lang = (
        document.documentElement.getAttribute("lang") || ""
      ).toLowerCase();
      var parts = path.split("/").filter(Boolean);
      if (parts.length && parts[0].toLowerCase() === lang) {
        parts.shift();
      }
      return parts.length ? "~/" + parts[0] : "~";
    }

    function stashTerminalCd(fromCwd, targetCwd) {
      if (fromCwd === targetCwd) {
        return; // same directory — nothing to echo
      }
      try {
        sessionStorage.setItem(
          TERMINAL_CD_KEY,
          JSON.stringify({ from: fromCwd, cmd: "cd " + targetCwd })
        );
      } catch (e) {
        /* sessionStorage unavailable — skip the echo */
      }
    }

    // Print any pending `cd` as scrollback above this page's first prompt.
    function printPendingTerminalCd() {
      if (!isTerminalLayout()) {
        return;
      }
      var raw;
      try {
        raw = sessionStorage.getItem(TERMINAL_CD_KEY);
        sessionStorage.removeItem(TERMINAL_CD_KEY);
      } catch (e) {
        return;
      }
      if (!raw) {
        return;
      }
      var data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        return;
      }
      if (!data || !data.cmd) {
        return;
      }
      var container = document.querySelector(".top-menu__container");
      var anchor = container
        ? container.querySelector(":scope > .terminal-prompt")
        : null;
      if (!container || !anchor) {
        return;
      }
      var line = document.createElement("span");
      line.className = "terminal-prompt terminal-prompt--cd";
      line.setAttribute("aria-hidden", "true");
      // Override the prompt's cwd to where we came from, so CSS renders the
      // exact PS1 (responsive compact form included) for that directory.
      line.style.setProperty("--terminal-cwd", '"' + data.from + '"');
      line.innerHTML =
        '<span class="terminal-prompt__user"></span>' +
        '<span class="terminal-prompt__host-plain"></span>' +
        '<span class="terminal-prompt__cwd"></span>' +
        '<span class="terminal-prompt__cmd"></span>';
      line.querySelector(".terminal-prompt__cmd").textContent = data.cmd;
      container.insertBefore(line, anchor);
    }

    // Nav clicks that change page read as `cd <page>` on the next screen.
    document.addEventListener("click", function (e) {
      if (
        !isTerminalLayout() ||
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      var link =
        e.target && e.target.closest
          ? e.target.closest(
              // Skip the statusbar quick-toggles — the language toggle switches
              // language, not directory, so it must not print a `cd` echo.
              ".top-menu__nav a[href]:not(.terminal-quick), " +
                ".terminal-prompt__host[href]"
            )
          : null;
      if (!link) {
        return;
      }
      var href = link.getAttribute("href");
      if (!href || href.charAt(0) === "#") {
        return;
      }
      stashTerminalCd(currentTerminalCwd(), hrefToCwd(href));
    });

    printPendingTerminalCd();

    // Posts are files: stamp each content card's title link with its slug so the
    // terminal CSS can render it as `slug.md` (an ls-row filename) instead of the
    // human title. The title stays in the DOM for screen readers + other layouts;
    // terminal.css just hides it and shows the slug. Re-run after an in-place nav.
    function terminalStampSlugs() {
      document
        .querySelectorAll(
          ".summary-card__title a[href], .article-card__title a[href], " +
            ".related-items__item .type-headline-4 a[href]"
        )
        .forEach(function (link) {
          var segs = terminalHrefSegments(link.getAttribute("href"));
          if (!segs || !segs.length) {
            return;
          }
          var slug = segs[segs.length - 1];
          // A taxonomy/section card (e.g. works' "tags") is a directory, not a
          // file — render it slug/ instead of slug.md.
          if (slug === "tags" || TERMINAL_SECTION_DIRS[slug]) {
            link.setAttribute("data-dir", slug);
          } else {
            link.setAttribute("data-slug", slug);
          }
        });
    }
    terminalStampSlugs();
    window.TerminalSlugs = { refresh: terminalStampSlugs };

    // Terminal layout: statusbar quick toggle that shows the resolved mode as
    // a bracketed word; clicking flips light/dark (an explicit choice, so it
    // replaces "system"). The label tracks every mode change via the
    // theme:mode-changed event, including system-preference flips.
    const terminalModeToggle = document.querySelector(
      '[data-js="terminal-mode-toggle"]'
    );
    if (terminalModeToggle) {
      const syncTerminalModeLabel = function () {
        const resolved =
          document.documentElement.getAttribute("data-mode") === "dark"
            ? "dark"
            : "light";
        const label =
          terminalModeToggle.getAttribute("data-label-" + resolved) || resolved;
        // Brackets live in the text (not pseudo-elements) so they hug the
        // label with no flex-item gaps.
        terminalModeToggle.textContent = "[" + label + "]";
      };
      syncTerminalModeLabel();
      window.addEventListener("theme:mode-changed", syncTerminalModeLabel);
      terminalModeToggle.addEventListener("click", function () {
        setMode(
          document.documentElement.getAttribute("data-mode") === "dark"
            ? "light"
            : "dark"
        );
      });
    }

    if (effectBlendButtons) {
      effectBlendButtons.forEach((button) => {
        button.addEventListener("click", function () {
          setBlendEnabled(
            document.documentElement.getAttribute("data-effect-blend") !== "on"
          );
        });
      });
    }

    if (effectGrainButtons) {
      effectGrainButtons.forEach((button) => {
        button.addEventListener("click", function () {
          setGrainEnabled(
            document.documentElement.getAttribute("data-effect-grain") !== "on"
          );
        });
      });
    }

    if (effectMotionButtons) {
      effectMotionButtons.forEach((button) => {
        button.addEventListener("click", function () {
          setReducedMotionEnabled(
            document.documentElement.getAttribute(
              "data-effect-reduced-motion"
            ) !== "on"
          );
        });
      });
    }

    // Lift the transition suppression injected by the early head script.
    // Double-rAF ensures the browser has painted once with the correct palette
    // colors before transitions are allowed to fire.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.remove("theme-loading");
        var s = document.getElementById("theme-no-trans");
        if (s) {
          s.remove();
        }
      });
    });
  });

  // Global function for backwards compatibility (if needed elsewhere)
  window.setTheme = setMode;
})();
