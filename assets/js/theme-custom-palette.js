/**
 * Custom palette runtime.
 *
 * Applies a user-authored ("custom") palette at runtime: it reads the stored
 * payload (v1 token snapshot or v2 role-based), derives the runtime CSS custom
 * properties through the window.ThemeDerive seam, writes them onto <html>, and
 * keeps track of what it set so it can clear them again on a palette switch.
 * It also computes the swatch preview values that light up the custom option in
 * the theme dropdown.
 *
 * Extracted from theme.js. It owns NONE of the theme core: it consumes only
 * window.ThemeDerive (+ the DOM) and publishes window.ThemeCustomPalette, which
 * theme.js drives through four thin shims (applyMode/applyPalette apply and
 * clear; setPalette/init query has(); refreshCustomPaletteState re-syncs). Load
 * BEFORE theme.js so the seam is published before theme.js's init runs; the
 * shims degrade to no-ops if this module is absent.
 */

(function () {
  "use strict";

  const CUSTOM_PALETTE_KEY = "theme-custom-palette";
  // The runtime CSS custom properties this module has set on <html>, so a
  // palette switch can remove exactly those again (no stale custom tokens).
  let appliedCustomTokenNames = [];

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

  // ==========================================================================
  // Public seam (window.ThemeCustomPalette)
  // The minimal surface theme.js needs: apply/clear the runtime tokens, ask
  // whether a stored custom palette exists, and re-sync the dropdown option.
  // ==========================================================================
  window.ThemeCustomPalette = {
    has: hasCustomPalette,
    applyStored: applyStoredCustomPalette,
    clearAppliedTokens: clearAppliedCustomTokens,
    syncOptionVisibility: syncCustomPaletteOptionVisibility,
  };
})();
