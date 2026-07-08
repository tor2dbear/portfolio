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
    if (
      (typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) ||
      document.documentElement.getAttribute("data-effect-reduced-motion") ===
        "on"
    ) {
      return;
    }
    var root = document.documentElement;
    root.classList.remove("terminal-booting");
    void root.offsetWidth;
    root.classList.add("terminal-booting");
    try {
      sessionStorage.setItem("terminal-boot-played", "1");
    } catch (e) {
      /* storage unavailable — the boot simply replays next load */
    }
    if (terminalBootTimer) {
      window.clearTimeout(terminalBootTimer);
    }
    terminalBootTimer = window.setTimeout(function () {
      root.classList.remove("terminal-booting");
    }, 2400);
  }

  // Leave the terminal: back to the snapshotted layout, and restore the
  // snapshotted typography if the pairing's choice (technical) is still
  // active — a manual typography change inside the terminal is respected.
  function exitTerminal() {
    if (document.documentElement.getAttribute("data-layout") !== "terminal") {
      return;
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
      // Inline, it is always expanded — no floating collapse state.
      setCotyTransportUiState("expanded");
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

    const TERMINAL_HELP = [
      "available commands:",
      "  help              this list",
      "  whoami            who's asking",
      "  date              current date & time",
      "  pwd               print working directory",
      "  echo <text>       print text",
      "  neofetch          session summary",
      "  dark | light | system   colour mode",
      "  pantone [on|off]  colour-of-the-year effect",
      "  grid              toggle the layout grid",
      "  clear             clear the screen",
      "  exit              leave the terminal",
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
          return {
            echo: input,
            lines: ["pantone: colour-of-the-year toggled"],
            action: { type: "pantone", state: "toggle" },
          };
        }
        case "grid":
          return {
            echo: input,
            lines: ["grid: toggled"],
            action: { type: "grid" },
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
          return {
            echo: input,
            lines: [
              "make: *** no rule to make target '" + (args[0] || "") + "'.",
            ],
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

    function applyTerminalAction(action) {
      if (!action) {
        return;
      }
      switch (action.type) {
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
          } else {
            togglePantoneMode();
          }
          break;
        case "grid": {
          var gridBtn = document.querySelector('[data-js="grid-toggle"]');
          if (gridBtn) {
            gridBtn.click();
          }
          break;
        }
        default:
          break;
      }
    }

    function printTerminalLine(text, className) {
      if (!terminalSession) {
        return;
      }
      var line = document.createElement("span");
      line.className = "terminal-session__line " + className;
      line.textContent = text;
      terminalSession.appendChild(line);
    }

    function runTerminalInput(raw) {
      var result = runTerminalCommand(raw);
      if (result.echo) {
        printTerminalLine(result.echo, "terminal-session__cmd");
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
      if (
        terminalInput &&
        document.documentElement.getAttribute("data-layout") === "terminal"
      ) {
        window.requestAnimationFrame(function () {
          window.scrollTo(0, document.body.scrollHeight);
          terminalInput.focus();
        });
      }
    }

    // The boot banner's small block-curl, reused as neofetch art when present.
    function terminalArtLines() {
      var art = document.querySelector(".terminal-boot__art--sm");
      if (!art || !art.textContent) {
        return [];
      }
      return art.textContent.replace(/^\n+|\n+$/g, "").split("\n");
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

    if (terminalInput) {
      terminalInput.addEventListener("input", syncTerminalInputSize);
      terminalInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          var value = terminalInput.value;
          terminalInput.value = "";
          syncTerminalInputSize();
          runTerminalInput(value);
        } else if (e.key === "Escape" && terminalInput.value === "") {
          // Empty prompt + Escape leaves the terminal, matching the global
          // handler (which ignores events targeting inputs).
          terminalInput.blur();
          exitTerminal();
        }
      });
      syncTerminalInputSize();
    }

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
