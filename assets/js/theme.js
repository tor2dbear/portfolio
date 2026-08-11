/**
 * Theme Management System (Mode + Palette + Typography)
 * Handles color mode (light/dark/system), color palette, and typography presets
 * with localStorage persistence and dropdown UI
 */

(function () {
  "use strict";

  // localStorage can throw — Safari private mode, storage disabled by policy,
  // or QuotaExceededError. A bare setItem inside a click handler would abort the
  // handler mid-way and leave mode/palette/layout in an inconsistent state, so
  // every access to storage in this module goes through these guards. Reads fall
  // back to null (caller supplies its own default); writes/removes are best-effort.
  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  // Returns true when the value was actually persisted, false when storage
  // threw — callers that branch on persistence (e.g. setLayout's redirect to
  // the home terminal) need to know the write didn't stick.
  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      /* storage unavailable — the preference simply isn't persisted */
      return false;
    }
  }
  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      /* storage unavailable — no-op */
    }
  }

  // Theme dropdown selectors (will be initialized after DOM load)
  let themeIcon;
  let modeOptions;
  let paletteOptions;
  let typographyOptions;
  let layoutOptions;
  let effectBlendButtons;
  let effectGrainButtons;
  let effectMotionButtons;
  const EFFECT_BLEND_KEY = "theme-effect-blend";
  const EFFECT_GRAIN_KEY = "theme-effect-grain";
  const EFFECT_MOTION_KEY = "theme-effect-reduced-motion";
  const LAST_NON_PANTONE_PALETTE_KEY = "theme-last-non-pantone-palette";
  const THEME_SWAP_TRANSITION_DEFAULT_MS = 700;
  let themeTransitionTimer = null;
  let themeColorAnimFrame = null;
  let playerSpriteUrl = "";

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
    // Set the duration on :root, not <body>. Safari inherits top-layer elements
    // (the open settings sheet is a popover) from :root rather than their DOM
    // parent, so a var on <body> never reached the sheet — it fell back to
    // --motion-duration-xslow (1000ms) while the page used this 700ms, and the
    // sheet's colour swap lagged behind the rest of the page. On :root the sheet
    // inherits it too (same path --surface-page already takes), so they sync.
    document.documentElement.style.setProperty(
      "--theme-transition-duration",
      duration + "ms"
    );
    void document.body.offsetWidth;
    document.body.classList.add("darkmodeTransition");
    themeTransitionTimer = window.setTimeout(function () {
      document.body.classList.remove("darkmodeTransition");
      document.documentElement.style.removeProperty(
        "--theme-transition-duration"
      );
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

  // Lazy handle to the pantone controller (theme-pantone.js, loads after this
  // file). Guarded at every call site so the theme works without it.
  function pantoneCtl() {
    return window.ThemePantone || null;
  }

  // The terminal engine is code-split (see head.html): it is NOT in the global
  // bundle, so on the first switch INTO the terminal layout we inject it on
  // demand, mirroring theme-pantone.js's ensureCotyLoaded. window.__terminalSrc
  // is published by the inline head script; the terminal CSS ships globally so
  // the layout is already correct while the JS loads. The callback runs once the
  // module is available (its onReady init has published window.Terminal).
  var terminalLoadStarted = false;
  function ensureTerminalLoaded(onAlreadyLoaded) {
    // Already available — eager-injected on a terminal page load, or a prior
    // switch already brought it in. The engine is present but its init has
    // already run (as a no-op, or on a previous entry), so IT won't boot on this
    // switch — the caller's enterLayout does. Run it now.
    if (window.Terminal && typeof window.Terminal.enterLayout === "function") {
      if (onAlreadyLoaded) {
        onAlreadyLoaded();
      }
      return;
    }
    var src = window.__terminalSrc;
    if (!src) {
      // No bundle configured (shouldn't happen in a normal build) — fail soft.
      return;
    }
    // Freshly loading the engine. Its own init() boots the terminal — by the
    // time the async script runs, setLayout has already flipped data-layout to
    // terminal (applyLayout runs synchronously right after this call), so the
    // init's runTerminalBootTranscript() fires. We must therefore NOT also run
    // enterLayout on load, or the boot transcript replays twice. So the callback
    // is deliberately dropped here: a fresh load self-boots via init.
    if (
      terminalLoadStarted ||
      document.querySelector("script[data-terminal-bundle]")
    ) {
      return;
    }
    terminalLoadStarted = true;
    var script = document.createElement("script");
    script.src = src;
    script.setAttribute("data-terminal-bundle", "");
    document.head.appendChild(script);
  }

  // ==========================================================================
  // MODE MANAGEMENT (light/dark/system)
  // ==========================================================================

  function setMode(mode) {
    // A works page can hard-lock its mode (data-work-mode, set server-side).
    // Ignore any request to change it — the toggle is hidden there, but the
    // keyboard shortcut and programmatic callers still route through here.
    if (document.documentElement.getAttribute("data-work-mode")) {
      return;
    }
    safeSet("theme-mode", mode);
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
    // A works page can hard-lock its mode (data-work-mode, set server-side).
    // Enforce it at this single choke point so every caller keeps the lock —
    // including the OS-appearance listener that calls applyMode("system")
    // directly while the page is open, which setMode's guard doesn't cover.
    var lockedWorkMode =
      document.documentElement.getAttribute("data-work-mode");
    if (lockedWorkMode) {
      mode = lockedWorkMode;
    }
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
    if (window.ThemePantone) {
      window.ThemePantone.onModeApplied(mode);
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

  // Restore the stored colour mode to the default (system). The terminal
  // `reset` command needs this: setMode is a no-op on a work-mode-locked page,
  // so a plain setMode("system") would leave the visitor's old preference in
  // place despite reset's "restored to defaults" message. This clears the
  // preference and re-applies — applyMode keeps a locked page on its forced
  // mode, so the display doesn't flip, but the global default is genuinely
  // restored (and takes effect once the visitor leaves the locked page).
  function resetMode() {
    safeSet("theme-mode", "system");
    runThemeTransition(THEME_SWAP_TRANSITION_DEFAULT_MS);
    applyMode("system");
    updateModeUI("system");
  }

  // Terminal in-place navigation swaps #main without reloading <html>, so the
  // server-set data-work-mode lock doesn't move on its own — terminal-nav.js
  // syncs the attribute from the destination, then calls this to reconcile the
  // actual mode. Mirrors init: a locked destination forces its mode, an
  // unlocked one restores the visitor's stored (or system) preference.
  // applyMode enforces the lock at its choke point and the mode controls
  // hide/show via the [data-work-mode] CSS gate, so entering a locked work
  // installs the lock and leaving it frees the following pages.
  function reconcileWorkMode() {
    var locked = document.documentElement.getAttribute("data-work-mode");
    var mode = locked || safeGet("theme-mode") || "system";
    runThemeTransition(THEME_SWAP_TRANSITION_DEFAULT_MS);
    applyMode(mode);
    updateModeUI(mode);
  }

  // ==========================================================================
  // PALETTE MANAGEMENT (standard/pantone)
  // ==========================================================================

  function setPalette(palette) {
    runThemeTransition(THEME_SWAP_TRANSITION_DEFAULT_MS);
    if (!commitPaletteSelection(palette)) {
      return;
    }
    const pantone = pantoneCtl();
    if (pantone) {
      pantone.setPantoneState(palette === "pantone" ? "paused" : "inactive", {
        syncPalette: false,
      });
    }
  }

  function applyPalette(palette) {
    if (palette === "custom") {
      if (!applyStoredCustomPalette()) {
        clearAppliedCustomTokens();
        palette = "standard";
        safeSet("theme-palette", palette);
      }
    } else {
      clearAppliedCustomTokens();
    }
    document.documentElement.setAttribute("data-palette", palette);

    if (window.ThemePantone) {
      window.ThemePantone.onPaletteApplied(palette);
    }

    updateFooterPaletteLabel(palette);
    if (window.ThemePantone) {
      window.ThemePantone.syncCotyPlayerUI();
    }
    animateThemeColorMeta(THEME_SWAP_TRANSITION_DEFAULT_MS);
  }

  function formatPaletteLabel(baseLabel, palette) {
    if (palette !== "pantone") {
      return baseLabel;
    }
    const pantone = pantoneCtl();
    const year = pantone ? pantone.getCurrentCotyYear() : "";
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

  // ==========================================================================
  // CUSTOM PALETTE (delegated to theme-custom-palette.js)
  // The custom-palette machinery — loading the stored payload, deriving runtime
  // tokens via window.ThemeDerive, and applying/clearing them — lives in its own
  // module behind window.ThemeCustomPalette. These thin shims keep the call
  // sites here unchanged and degrade to no-ops if that module isn't present.
  // ==========================================================================
  function hasCustomPalette() {
    return window.ThemeCustomPalette ? window.ThemeCustomPalette.has() : false;
  }

  function clearAppliedCustomTokens() {
    if (window.ThemeCustomPalette) {
      window.ThemeCustomPalette.clearAppliedTokens();
    }
  }

  function applyStoredCustomPalette() {
    return window.ThemeCustomPalette
      ? window.ThemeCustomPalette.applyStored()
      : false;
  }

  function syncCustomPaletteOptionVisibility() {
    if (window.ThemeCustomPalette) {
      window.ThemeCustomPalette.syncOptionVisibility();
    }
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
    safeSet("theme-typography", typography);
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
          applyTypography(typography, true);
          if (window.Toast) {
            window.Toast.show(typoCategoryLabel, typoLabel);
          }
        })
        .catch(function () {
          // Font loading failed; apply anyway (CSS fallback stack kicks in)
          applyTypography(typography, true);
          if (window.Toast) {
            window.Toast.show(typoCategoryLabel, typoLabel);
          }
        });
    } else {
      applyTypography(typography, true);
      if (window.Toast) {
        window.Toast.show(typoCategoryLabel, typoLabel);
      }
    }
  }

  function applyTypography(typography, dropProjectTypeset) {
    document.documentElement.setAttribute("data-typography", typography);
    // An explicit user choice wins everywhere, including a per-project typeset.
    // Drop the gate in the SAME frame the chosen preset is applied (after any
    // async font load), so the project body never flashes the old preset first.
    // Only on user action — init keeps the gate so a no-choice visitor still
    // sees the project's typeset.
    if (dropProjectTypeset) {
      document.documentElement.removeAttribute("data-project-typeset");
    }
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

  function applyLayoutPairings(layout) {
    var pairing = LAYOUT_PAIRINGS[layout];
    if (!pairing) {
      return;
    }
    if (
      pairing.typography &&
      safeGet("theme-typography") !== pairing.typography
    ) {
      setTypography(pairing.typography);
    }
    if (pairing.palette && safeGet("theme-palette") !== pairing.palette) {
      setPalette(pairing.palette);
    }
  }

  function setLayout(layout) {
    var storedLayout = safeGet("theme-layout");
    // A visual tool (ui-library, palette generator) can't be a terminal, and it
    // isn't part of the terminal filesystem. Picking terminal here honours the
    // choice by storing it and going to the home terminal — this page has none
    // to show. (Exit from there drops back to column.)
    if (
      layout === "terminal" &&
      document.documentElement.hasAttribute("data-terminal-exempt")
    ) {
      safeSet("theme-layout-previous", "column");
      safeSet("theme-layout-previous-stored", storedLayout ? "1" : "0");
      // The redirect only makes sense if the terminal choice actually persisted:
      // the home page reads theme-layout on load to open in terminal. If storage
      // threw, that write is lost, so home would open in column and we'd have
      // navigated the visitor away from this page for nothing — stay put instead.
      if (!safeSet("theme-layout", "terminal")) {
        return;
      }
      var homeUrl =
        document.documentElement.getAttribute("data-home-url") || "/";
      try {
        window.location.href = homeUrl;
      } catch (e) {
        window.location.assign(homeUrl);
      }
      return;
    }
    // Entering terminal snapshots where the user came from, so exit (ESC,
    // typing "exit", the boot [exit] button) can return there — including
    // the typography the pairing is about to replace.
    var currentLayout = storedLayout || "column";
    if (layout === "terminal" && currentLayout !== "terminal") {
      // Snapshot the EFFECTIVE pre-terminal layout — a per-project
      // data-work-layout default counts, not just the global fallback — and
      // whether it was the visitor's own stored choice, so restoreLayoutAfterTerminal()
      // can bring back a transient project default without persisting it.
      var effectiveLayout =
        storedLayout ||
        document.documentElement.getAttribute("data-work-layout") ||
        "column";
      safeSet("theme-layout-previous", effectiveLayout);
      safeSet("theme-layout-previous-stored", storedLayout ? "1" : "0");
      safeSet(
        "theme-typography-previous",
        safeGet("theme-typography") || "editorial"
      );
      // Snap to the top so the boot banner/animation plays in view — otherwise a
      // visitor part-way down the page enters the terminal mid-stream and misses
      // it. Instant (not smooth) so it lands before the layout reflows.
      window.scrollTo(0, 0);
      // Hand the boot theatre + transcript replay to the terminal module (it
      // owns playTerminalBoot and the boot-transcript runner now). Deferred
      // internally so applyLayout below has flipped data-layout first. The
      // engine is code-split, so ensure it's loaded first (a no-op once present)
      // and enter on its callback — on a page that never had the terminal, this
      // is the switch that pulls the bundle in.
      ensureTerminalLoaded(function () {
        if (
          window.Terminal &&
          typeof window.Terminal.enterLayout === "function"
        ) {
          window.Terminal.enterLayout();
        }
      });
    }
    safeSet("theme-layout", layout);
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

  // Restore the pre-terminal layout on terminal exit. If the visitor had a real
  // stored choice, re-apply it (persisted). If they didn't — the snapshot was a
  // transient per-project default — clear the stored key and apply the effective
  // layout without persisting, so leaving terminal returns to the "no choice"
  // state and the project's data-work-layout default keeps applying elsewhere.
  function restoreLayoutAfterTerminal() {
    var prev = safeGet("theme-layout-previous") || "column";
    if (prev === "terminal") {
      prev = "column";
    }
    var wasStored = safeGet("theme-layout-previous-stored") !== "0";
    if (wasStored) {
      // A real stored choice is page-independent — restore it (persisted).
      setLayout(prev);
    } else {
      // No stored choice: the layout is a per-project default. Derive it from
      // the CURRENT page's data-work-layout (terminal typed-nav may have moved
      // to a different work since entry, so the entry snapshot can be stale) and
      // apply without persisting, keeping the "no choice" state.
      safeRemove("theme-layout");
      var effective =
        document.documentElement.getAttribute("data-work-layout") || "column";
      updateLayoutUI(effective);
      applyLayout(effective);
      applyLayoutPairings(effective);
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
        // Cache the settled colour keyed by the resolved mode so the early
        // inline <head> script can pre-seed the status-bar meta before paint on
        // the next navigation — avoiding the white flash on iOS. Keyed by every
        // dimension that moves --surface-page (mode, palette, and the COTY year
        // for Pantone) so a different theme combo never seeds a stale colour.
        try {
          var settledMode =
            document.documentElement.getAttribute("data-mode") || "light";
          var settledPalette =
            document.documentElement.getAttribute("data-palette") || "standard";
          var settledYear = safeGet("theme-coty-year") || "2026";
          // A work theme moves --surface-page too (on the standard palette), so
          // it must be part of the key — otherwise the next page seeds the bar
          // with the previous project's colour. Mirror the head.html seed key.
          var settledWork =
            document.documentElement.getAttribute("data-work-theme") || "";
          var settledKey =
            "theme-color-cache-" +
            settledMode +
            "-" +
            settledPalette +
            (settledPalette === "pantone"
              ? "-" + settledYear
              : settledWork
              ? "-wt-" + settledWork
              : "");
          safeSet(settledKey, resolvePageColor());
        } catch (e) {}
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
    const raw = safeGet(key);
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
    safeSet(EFFECT_BLEND_KEY, value ? "1" : "0");
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
    safeSet(EFFECT_GRAIN_KEY, value ? "1" : "0");
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
    safeSet(EFFECT_MOTION_KEY, value ? "1" : "0");
    syncEffectButtons(effectMotionButtons, value);
    if (!opts.silent) {
      showEffectToast(effectMotionButtons, value, "Reduce motion");
    }
  }

  function isTerminalLayout() {
    return document.documentElement.getAttribute("data-layout") === "terminal";
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
      const pantone = pantoneCtl();
      if (pantone) {
        label = pantone.formatCotyTrackText(
          pantone.getCotyEntryByYear(pantone.getCurrentCotyYear())
        );
      }
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
      safeSet(LAST_NON_PANTONE_PALETTE_KEY, palette);
    }
    safeSet("theme-palette", palette);
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

  // ==========================================================================
  // SYSTEM PREFERENCE LISTENER
  // ==========================================================================

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      const storedMode = safeGet("theme-mode") || "system";
      if (storedMode === "system") {
        applyMode("system");
      }
    });

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  document.addEventListener("DOMContentLoaded", function () {
    // Initialize selectors
    themeIcon = document.querySelector('[data-js="theme-icon"]');
    modeOptions = document.querySelectorAll('[data-js="mode-option"]');
    paletteOptions = document.querySelectorAll('[data-js="palette-option"]');
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

    // Load stored preferences or use defaults. A works page may HARD-LOCK its
    // mode (data-work-mode, set server-side + forced in the head pre-paint); on
    // such a page the locked value wins over the stored/system choice and the
    // toggle is hidden. localStorage is not touched, so the stored mode resumes
    // on the next page.
    const lockedMode = document.documentElement.getAttribute("data-work-mode");
    const storedMode = lockedMode || safeGet("theme-mode") || "system";
    const storedPalette = safeGet("theme-palette") || "standard";
    // Typography is purely the visitor's own preference (or the site default);
    // a per-project typeset is content-scoped and gated by data-project-typeset
    // (set pre-paint in head.html), not by this global attribute.
    const storedTypography = safeGet("theme-typography") || "editorial";
    // Layout may take a per-project default (data-work-layout, set server-side)
    // when the visitor has no explicit stored choice — mirrors the pre-paint
    // script so init doesn't clobber the server default. applyLayout below
    // doesn't persist, so this default never becomes the visitor's choice.
    const storedLayout =
      safeGet("theme-layout") ||
      document.documentElement.getAttribute("data-work-layout") ||
      "column";
    const normalizedStoredPalette =
      storedPalette === "coty" ? "pantone" : storedPalette;
    let initialPalette =
      normalizedStoredPalette === "custom" && !hasCustomPalette()
        ? "standard"
        : normalizedStoredPalette;
    if (window.ThemePantone) {
      initialPalette =
        window.ThemePantone.reconcileStartupPalette(initialPalette);
    }

    // Apply stored preferences
    applyMode(storedMode);
    if (window.ThemePantone) {
      window.ThemePantone.initControls();
    }
    syncCustomPaletteOptionVisibility();
    applyPalette(initialPalette);
    applyTypography(storedTypography);
    applyLayout(storedLayout);
    // The terminal engine is code-split. If this page opened in the terminal
    // layout (data-layout was resolved pre-paint by the head script — work
    // defaults / exemptions included, so read it rather than storedLayout), load
    // the engine now. This runs AFTER theme.js has published window.Theme, which
    // terminal.js captures at its own eval — the load order the head script's
    // preload can't guarantee on its own. ensureTerminalLoaded self-boots via
    // terminal.js's init (no enterLayout callback on a fresh load).
    if (document.documentElement.getAttribute("data-layout") === "terminal") {
      ensureTerminalLoaded();
    }
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
    if (window.ThemePantone) {
      window.ThemePantone.initTransportUI();
    }

    window.ThemeActions = {
      setMode: setMode,
      setPalette: setPalette,
      setTypography: setTypography,
      setLayout: setLayout,
      togglePantone: function () {
        if (window.ThemePantone) {
          window.ThemePantone.togglePantoneMode();
        }
      },
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
      playPantone: function () {
        if (window.ThemePantone) {
          window.ThemePantone.playPantone();
        }
      },
      pausePantone: function () {
        if (window.ThemePantone) {
          window.ThemePantone.pausePantone();
        }
      },
      stopPantone: function () {
        if (window.ThemePantone) {
          window.ThemePantone.stopPantone();
        }
      },
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
      setCotyYear: function (year, options) {
        if (window.ThemePantone) {
          window.ThemePantone.setCotyYear(year, options);
        }
      },
      getCotyYear: function () {
        return window.ThemePantone
          ? window.ThemePantone.getCurrentCotyYear()
          : null;
      },
      setCotyShuffleEnabled: function (enabled) {
        if (window.ThemePantone) {
          window.ThemePantone.setCotyShuffleEnabled(enabled);
        }
      },
      refreshCustomPalette: refreshCustomPaletteState,
    };

    window.addEventListener(
      "theme:custom-palette-updated",
      refreshCustomPaletteState
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

  // ==========================================================================
  // PUBLIC THEME SEAM (window.Theme)
  // The high-level theme/layout API a terminal (or any other module living in
  // its own file) needs to drive appearance without reaching into this closure.
  // This is the inward counterpart to the window.Terminal seam: terminal.js
  // consumes these to run `set`/`pantone`/`reset`/exit, and never touches the
  // low-level apply*/Toast layer. Published synchronously at module eval so it
  // is ready before any later-loaded module's IIFE runs. Keep the shape stable
  // — it is a contract, and its members are unit-test seams.
  // ==========================================================================
  window.Theme = {
    // Setters
    setMode: setMode,
    resetMode: resetMode,
    reconcileWorkMode: reconcileWorkMode,
    setTypography: setTypography,
    setLayout: setLayout,
    restoreLayoutAfterTerminal: restoreLayoutAfterTerminal,
    commitPaletteSelection: commitPaletteSelection,
    setGrainEnabled: setGrainEnabled,
    setBlendEnabled: setBlendEnabled,
    setReducedMotionEnabled: setReducedMotionEnabled,
    // Pantone / Colour-of-the-Year controls (lazy delegators: the controller
    // lives in theme-pantone.js, which loads after this file — these wrappers
    // keep window.Theme's shape stable for eval-time consumers like terminal.js)
    stopPantone: function () {
      if (window.ThemePantone) {
        window.ThemePantone.stopPantone();
      }
    },
    activatePantone: function (options) {
      if (window.ThemePantone) {
        window.ThemePantone.activatePantone(options);
      }
    },
    setCotyYear: function (year, options) {
      if (window.ThemePantone) {
        window.ThemePantone.setCotyYear(year, options);
      }
    },
    advanceCotyYear: function (step, options) {
      if (window.ThemePantone) {
        window.ThemePantone.advanceCotyYear(step, options);
      }
    },
    togglePantoneMode: function () {
      if (window.ThemePantone) {
        window.ThemePantone.togglePantoneMode();
      }
    },
    // Read-only state queries
    isTerminalLayout: isTerminalLayout,
    isPantoneModeActive: function () {
      return window.ThemePantone
        ? window.ThemePantone.isPantoneModeActive()
        : false;
    },
    getCurrentCotyYear: function () {
      return window.ThemePantone
        ? window.ThemePantone.getCurrentCotyYear()
        : null;
    },
    getCotyActions: function () {
      return window.ThemePantone ? window.ThemePantone.getCotyActions() : null;
    },
    // Consumed by theme-pantone.js (captured at its eval)
    applyPalette: applyPalette,
    updatePaletteUI: updatePaletteUI,
    updateFooterPaletteLabel: updateFooterPaletteLabel,
    runThemeTransition: runThemeTransition,
    animateThemeColorMeta: animateThemeColorMeta,
    getPlayerSpriteUrl: getPlayerSpriteUrl,
    // Timing constant used by manual pantone transitions from the terminal.
    // Canonical definition lives in theme-pantone.js; the literal is duplicated
    // here because eval-time consumers copy the value before that file loads.
    PANTONE_MANUAL_TRANSITION_MS: 4000,
  };
})();
