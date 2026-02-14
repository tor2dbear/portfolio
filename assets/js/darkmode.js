/**
 * Theme Management System (Mode + Palette + Typography)
 * Handles color mode (light/dark/system), color palette, and typography presets
 * with localStorage persistence and dropdown UI
 */

(function() {
  'use strict';

  // Theme dropdown selectors (will be initialized after DOM load)
  let themeToggle;
  let themePanel;
  let themeOverlay;
  let themeIcon;
  let modeOptions;
  let paletteOptions;
  let cotyYearSelects;
  let typographyOptions;
  let spriteBase = '';
  const CUSTOM_PALETTE_KEY = 'theme-custom-palette';
  const COTY_YEAR_KEY = 'theme-coty-year';
  let appliedCustomTokenNames = [];

  function getUseHref(use) {
    return use.getAttribute('href')
      || use.getAttribute('xlink:href')
      || (use.href && use.href.baseVal)
      || use.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
      || '';
  }

  function inferSpriteBaseFromScripts() {
    const scripts = document.querySelectorAll('script[src]');
    for (let i = scripts.length - 1; i >= 0; i -= 1) {
      const src = scripts[i].getAttribute('src') || scripts[i].src || '';
      if (!src) continue;
      if (src.indexOf('/js') !== -1 || src.indexOf('js.') !== -1) {
        try {
          return new URL('img/svg/sprite.svg?v=20260211b', src).toString();
        } catch (e) {
          // Ignore malformed script src values
        }
      }
    }
    return '/img/svg/sprite.svg?v=20260211b';
  }

  function getSpriteBase() {
    if (spriteBase) return spriteBase;
    const uses = document.querySelectorAll('svg use');
    for (let i = 0; i < uses.length; i += 1) {
      const href = getUseHref(uses[i]);
      if (href && href.indexOf('sprite.svg') !== -1) {
        spriteBase = href.split('#')[0];
        break;
      }
    }
    if (!spriteBase) spriteBase = inferSpriteBaseFromScripts();
    return spriteBase;
  }

  function isGridActive() {
    const value = document.documentElement.getAttribute('data-grid-overlay');
    return value !== null && value !== 'closing';
  }

  function shouldUsePanelPortal(panel) {
    if (!panel || panel.hasAttribute('hidden')) return false;
    if (!window.matchMedia('(min-width: 30em)').matches) return false;
    return isGridActive();
  }

  function ensurePanelPortalOrigin(panel) {
    if (!panel || panel.__portalPlaceholder) return;
    const placeholder = document.createComment('dropdown-portal-anchor');
    panel.parentNode.insertBefore(placeholder, panel);
    panel.__portalPlaceholder = placeholder;
  }

  function positionPanelAtToggle(panel, toggle) {
    if (!panel || !toggle) return;

    const toggleRect = toggle.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const panelWidth = panelRect.width;
    const viewportWidth = window.innerWidth;
    const gutter = 8;

    let left = toggleRect.right - panelWidth;
    if (left < gutter) left = gutter;
    if (left + panelWidth > viewportWidth - gutter) {
      left = viewportWidth - panelWidth - gutter;
    }

    panel.style.top = `${toggleRect.bottom + 8}px`;
    panel.style.left = `${Math.max(left, gutter)}px`;
    panel.style.width = `${panelWidth}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  }

  function mountPanelPortal(panel, toggle) {
    if (!panel) return;
    ensurePanelPortalOrigin(panel);
    if (panel.parentNode !== document.body) {
      document.body.appendChild(panel);
    }
    panel.classList.add('dropdown-panel--portal');
    panel.style.position = 'fixed';
    positionPanelAtToggle(panel, toggle);
  }

  function restorePanelPortal(panel) {
    if (!panel || !panel.classList.contains('dropdown-panel--portal')) return;

    const placeholder = panel.__portalPlaceholder;
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.insertBefore(panel, placeholder);
      placeholder.remove();
    }

    panel.__portalPlaceholder = null;
    panel.classList.remove('dropdown-panel--portal');
    panel.style.position = '';
    panel.style.top = '';
    panel.style.left = '';
    panel.style.width = '';
    panel.style.right = '';
    panel.style.bottom = '';
  }

  function syncThemePanelPortal() {
    if (!themePanel) return;
    if (shouldUsePanelPortal(themePanel)) {
      mountPanelPortal(themePanel, themeToggle);
      return;
    }
    restorePanelPortal(themePanel);
  }

  function restoreExternalPanelPortal(panel) {
    if (!panel) return;
    if (!panel.classList.contains('dropdown-panel--portal')) return;

    const placeholder = panel.__portalPlaceholder;
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.insertBefore(panel, placeholder);
      placeholder.remove();
    }

    panel.__portalPlaceholder = null;
    panel.classList.remove('dropdown-panel--portal');
    panel.style.position = '';
    panel.style.top = '';
    panel.style.left = '';
    panel.style.width = '';
    panel.style.right = '';
    panel.style.bottom = '';
  }

  // ==========================================================================
  // DROPDOWN TOGGLE
  // ==========================================================================

  function togglePanel(e) {
    if (e) e.stopPropagation();
    const isHidden = themePanel.hasAttribute('hidden');

    if (isHidden) {
      closeLanguagePanel();
      themePanel.removeAttribute('hidden');
      if (themeOverlay) themeOverlay.removeAttribute('hidden');
      themeToggle.setAttribute('aria-expanded', 'true');
      syncThemePanelPortal();
    } else {
      closePanel();
    }
  }

  function closePanel() {
    if (themePanel && !themePanel.hasAttribute('hidden')) {
      themePanel.setAttribute('hidden', '');
      if (themeOverlay) themeOverlay.setAttribute('hidden', '');
      themeToggle.setAttribute('aria-expanded', 'false');
      syncThemePanelPortal();
    }
  }

  function closeLanguagePanel() {
    const languagePanel = document.querySelector('.language-panel');
    const languageToggle = document.querySelector('.language-toggle');
    const languageOverlay = document.querySelector('.language-overlay');

    if (languagePanel && !languagePanel.hasAttribute('hidden')) {
      languagePanel.setAttribute('hidden', '');
      if (languageOverlay) languageOverlay.setAttribute('hidden', '');
      if (languageToggle) languageToggle.setAttribute('aria-expanded', 'false');
      restoreExternalPanelPortal(languagePanel);
    }
  }

  function closeSettingsPanel() {
    const settingsPanel = document.querySelector('[data-js="settings-panel"]');
    const settingsToggle = document.querySelector('[data-js="settings-toggle"]');
    const settingsOverlay = document.querySelector('[data-js="settings-overlay"]');

    if (settingsPanel && !settingsPanel.hasAttribute('hidden')) {
      settingsPanel.setAttribute('hidden', '');
      if (settingsOverlay) settingsOverlay.setAttribute('hidden', '');
      if (settingsToggle) settingsToggle.setAttribute('aria-expanded', 'false');
    }
  }

  // ==========================================================================
  // MODE MANAGEMENT (light/dark/system)
  // ==========================================================================

  function setMode(mode) {
    localStorage.setItem('theme-mode', mode);
    applyMode(mode);
    updateModeUI(mode);
    closePanel();
    closeSettingsPanel();

    var el = document.querySelector('[data-js="footer-mode"]');
    var category = el ? el.getAttribute('data-category') : '';
    var label = el ? (el.getAttribute('data-label-' + mode) || mode) : mode;
    var icon = el ? el.getAttribute('data-toast-icon') : '';
    if (window.Toast) window.Toast.show(category, label, { icon: icon });
  }

  function applyMode(mode) {
    var requestedMode = mode;
    if (mode === 'system') {
      const systemMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-mode', systemMode);
    } else {
      document.documentElement.setAttribute('data-mode', mode);
    }
    updateThemeIcon(mode);
    updateThemeColorMeta();
    updateFooterModeLabel(mode);
    const cotyActions = window.CotyScaleActions || null;
    if (cotyActions && typeof cotyActions.applyForMode === 'function') {
      cotyActions.applyForMode(document.documentElement.getAttribute('data-mode') || mode);
    }

    // Recompute mode-sensitive runtime tokens for custom palettes
    if ((document.documentElement.getAttribute('data-palette') || 'standard') === 'custom') {
      applyStoredCustomPalette();
    }

    window.dispatchEvent(new CustomEvent('theme:mode-changed', {
      detail: {
        requestedMode: requestedMode,
        mode: document.documentElement.getAttribute('data-mode') || 'light'
      }
    }));
  }

  function updateModeUI(currentMode) {
    modeOptions.forEach(option => {
      const mode = option.getAttribute('data-mode');
      if (mode === currentMode) {
        option.classList.add('active');
        option.setAttribute('aria-current', 'true');
      } else {
        option.classList.remove('active');
        option.removeAttribute('aria-current');
      }
    });
  }

  // ==========================================================================
  // PALETTE MANAGEMENT (standard/pantone)
  // ==========================================================================

  function setPalette(palette) {
    if (palette === 'custom' && !hasCustomPalette()) return;
    localStorage.setItem('theme-palette', palette);
    applyPalette(palette);
    updatePaletteUI(palette);
    window.dispatchEvent(new CustomEvent('theme:palette-changed', {
      detail: { palette: palette }
    }));
    closePanel();
    closeSettingsPanel();

    var el = document.querySelector('[data-js="footer-palette"]');
    var category = el ? el.getAttribute('data-category') : '';
    var label = el ? (el.getAttribute('data-label-' + palette) || palette) : palette;
    label = formatPaletteLabel(label, palette);
    var icon = el ? el.getAttribute('data-toast-icon') : '';
    if (window.Toast) window.Toast.show(category, label, { icon: icon });
  }

  function applyPalette(palette) {
    if (palette === 'custom') {
      if (!applyStoredCustomPalette()) {
        clearAppliedCustomTokens();
        palette = 'standard';
        localStorage.setItem('theme-palette', palette);
      }
    } else {
      clearAppliedCustomTokens();
    }
    document.documentElement.setAttribute('data-palette', palette);
    updateFooterPaletteLabel(palette);
  }

  function getCotyActions() {
    return window.CotyScaleActions || null;
  }

  function getCurrentCotyYear() {
    const actions = getCotyActions();
    if (actions && typeof actions.getCurrentYear === 'function') {
      return actions.getCurrentYear();
    }
    const attr = Number(document.documentElement.getAttribute('data-coty-year'));
    if (attr) return attr;
    const stored = Number(localStorage.getItem(COTY_YEAR_KEY));
    return stored || 2026;
  }

  function formatPaletteLabel(baseLabel, palette) {
    if (palette !== 'coty') return baseLabel;
    const year = getCurrentCotyYear();
    return baseLabel + ' (' + year + ')';
  }

  function updatePaletteUI(currentPalette) {
    paletteOptions.forEach(option => {
      const palette = option.getAttribute('data-palette');
      if (palette === currentPalette) {
        option.classList.add('active');
        option.setAttribute('aria-current', 'true');
      } else {
        option.classList.remove('active');
        option.removeAttribute('aria-current');
      }
    });
  }

  function loadCustomPalette() {
    try {
      const raw = localStorage.getItem(CUSTOM_PALETTE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.version >= 2) {
        if (!parsed.roles || typeof parsed.roles !== 'object') return null;
        return parsed;
      }
      if (!parsed.tokens || typeof parsed.tokens !== 'object') return null;
      return parsed;
    } catch (_err) {
      return null;
    }
  }

  function hasCustomPalette() {
    return Boolean(loadCustomPalette());
  }

  function clearAppliedCustomTokens() {
    appliedCustomTokenNames.forEach(name => {
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
    var deriveImageTokens = window.ThemeDerive && window.ThemeDerive.deriveImageTokens;
    if (typeof deriveImageTokens === 'function') {
      var mode = document.documentElement.getAttribute('data-mode') || 'light';
      var imageTokens = deriveImageTokens({
        roles: custom.roles || {},
        policies: custom.policies || {},
        mode: mode
      });
      Object.entries(imageTokens).forEach(function(entry) {
        setCustomRuntimeToken(entry[0], entry[1]);
      });
      return;
    }

    // Fallback if derive module is unavailable.
    setCustomRuntimeToken('--image-grayscale', '0%');
    setCustomRuntimeToken('--image-blend-mode', 'normal');
    setCustomRuntimeToken('--image-background', 'transparent');
  }

  function applyCustomDerivedTokens(custom) {
    var derive = window.ThemeDerive && window.ThemeDerive.deriveRuntimeTokens;
    if (typeof derive !== 'function') return;

    var derived = derive({
      roles: custom.roles || {},
      policies: custom.policies || {}
    });

    Object.entries(derived).forEach(function(entry) {
      var name = entry[0];
      var value = entry[1];
      setCustomRuntimeToken(name, value);
    });
  }

  function normalizeOverrideTokenName(key) {
    if (!key) return '';
    if (key.indexOf('--') === 0) return key;
    return '--' + key.replace(/_/g, '-');
  }

  function getCustomDerivedPaletteTokens(custom) {
    var derive = window.ThemeDerive && window.ThemeDerive.derivePaletteTokens;
    if (typeof derive !== 'function') return null;
    if (!custom || !custom.roles) return null;
    return derive({
      roles: custom.roles,
      policies: custom.policies || {},
      component_overrides: custom.component_overrides || {}
    });
  }

  function getCustomPreviewValues(custom) {
    var preview = custom.preview || {};
    var derivePreview = window.ThemeDerive && window.ThemeDerive.derivePreview;
    var derivedPreview = null;
    if (typeof derivePreview === 'function' && custom && custom.roles) {
      derivedPreview = derivePreview({
        roles: custom.roles,
        policies: custom.policies || {},
        component_overrides: custom.component_overrides || {}
      });
    }
    var derived = getCustomDerivedPaletteTokens(custom) || {};
    var tokens = custom.tokens || {};
    var primary = preview.primary
      || preview.accent
      || (derivedPreview && derivedPreview.primary)
      || derived['--accent-primary-strong']
      || tokens['--accent-primary-strong']
      || 'var(--gray-11)';
    var surface = preview.surface
      || preview.bg
      || (derivedPreview && derivedPreview.surface)
      || derived['--bg-page']
      || tokens['--bg-page']
      || 'var(--gray-2)';
    var secondary = preview.secondary
      || (derivedPreview && derivedPreview.secondary)
      || derived['--accent-secondary-strong']
      || tokens['--accent-secondary-strong']
      || primary;
    var toneMode = preview.tone_mode
      || (derivedPreview && derivedPreview.toneMode)
      || (custom.policies && custom.policies.tone_mode)
      || 'mono';

    return {
      primary: primary,
      surface: surface,
      secondary: secondary,
      toneMode: toneMode
    };
  }

  function applyStoredCustomPalette() {
    const custom = loadCustomPalette();
    if (!custom) return false;

    clearAppliedCustomTokens();
    if (custom.version >= 2) {
      var derivedTokens = getCustomDerivedPaletteTokens(custom) || {};
      Object.entries(derivedTokens).forEach(function(entry) {
        var name = entry[0];
        var value = entry[1];
        setCustomRuntimeToken(name, String(value));
      });

      var overrides = custom.overrides || {};
      Object.keys(overrides).forEach(function(key) {
        var tokenName = normalizeOverrideTokenName(key);
        var value = overrides[key];
        if (!tokenName || typeof value === 'undefined' || value === null) return;
        setCustomRuntimeToken(tokenName, String(value));
      });
    } else {
      Object.entries(custom.tokens).forEach(([name, value]) => {
        if (!name || typeof value === 'undefined' || value === null) return;
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
    document.documentElement.style.setProperty('--palette-custom-accent', previewValues.primary);
    document.documentElement.style.setProperty('--palette-custom-bg', previewValues.surface);
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

      document.documentElement.style.setProperty('--palette-custom-accent', primary);
      document.documentElement.style.setProperty('--palette-custom-bg', surface);
      document.documentElement.style.setProperty('--palette-custom-primary', primary);
      document.documentElement.style.setProperty('--palette-custom-surface', surface);
      document.documentElement.style.setProperty('--palette-custom-secondary', secondary);

      document.documentElement.style.setProperty('--palette-custom-seg1', '1');
      document.documentElement.style.setProperty('--palette-custom-seg2', '1');
      document.documentElement.style.setProperty('--palette-custom-seg3', toneMode === 'duo' ? '1' : '0');
    }
    const customOptions = document.querySelectorAll('[data-role="palette-custom-option"]');
    customOptions.forEach(option => {
      if (customAvailable) {
        option.removeAttribute('hidden');
      } else {
        option.setAttribute('hidden', '');
      }
    });
  }

  function refreshCustomPaletteState() {
    syncCustomPaletteOptionVisibility();
    const current = document.documentElement.getAttribute('data-palette') || 'standard';
    if (current === 'custom') {
      if (!applyStoredCustomPalette()) {
        setPalette('standard');
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
    refined:    ['400 1em "Playfair Display"'],
    expressive: ['500 1em "Bricolage Grotesque"'],
    technical:  ['400 1em "JetBrains Mono"']
  };

  function setTypography(typography) {
    localStorage.setItem('theme-typography', typography);
    // Highlight the selected option immediately for instant feedback
    updateTypographyUI(typography);

    // Get the readable label from the clicked option's aria-label
    var clickedOpt = document.querySelector('[data-js="typography-option"][data-typography="' + typography + '"]');
    var typoLabel = clickedOpt ? clickedOpt.getAttribute('aria-label') : typography;
    var typoCategory = document.querySelector('[data-toast-category="typography"]');
    var typoCategoryLabel = typoCategory ? typoCategory.getAttribute('data-toast-label') : '';

    var fontsNeeded = TYPOGRAPHY_FONTS[typography];
    if (fontsNeeded && fontsNeeded.length > 0) {
      // Preload web fonts before applying the preset so the font is
      // already in the FontFaceSet when CSS references it — avoids
      // the font-display:optional block-period miss.
      Promise.all(fontsNeeded.map(function(spec) {
        return document.fonts.load(spec);
      })).then(function() {
        applyTypography(typography);
        closePanel();
        closeSettingsPanel();
        if (window.Toast) window.Toast.show(typoCategoryLabel, typoLabel);
      }).catch(function() {
        // Font loading failed; apply anyway (CSS fallback stack kicks in)
        applyTypography(typography);
        closePanel();
        closeSettingsPanel();
        if (window.Toast) window.Toast.show(typoCategoryLabel, typoLabel);
      });
    } else {
      applyTypography(typography);
      closePanel();
      closeSettingsPanel();
      if (window.Toast) window.Toast.show(typoCategoryLabel, typoLabel);
    }
  }

  function applyTypography(typography) {
    document.documentElement.setAttribute('data-typography', typography);
    updateFooterTypographyLabel(typography);
  }

  function updateTypographyUI(currentTypography) {
    typographyOptions.forEach(option => {
      const typography = option.getAttribute('data-typography');
      if (typography === currentTypography) {
        option.classList.add('active');
        option.setAttribute('aria-current', 'true');
      } else {
        option.classList.remove('active');
        option.removeAttribute('aria-current');
      }
    });
  }

  // ==========================================================================
  // ICON MANAGEMENT
  // ==========================================================================

  function updateThemeIcon() {
    if (!themeIcon) return;

    // Theme toggle icon is static and no longer reflects active mode.
    themeIcon.innerHTML = `<svg width="24" height="24" aria-hidden="true">
      <use href="/img/svg/sprite.svg?v=20260212a#icon-theme-palette"></use>
    </svg>`;
  }

  // ==========================================================================
  // META TAG MANAGEMENT
  // ==========================================================================

  function updateThemeColorMeta() {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) return;

    const currentMode = document.documentElement.getAttribute('data-mode');
    if (currentMode === 'dark') {
      themeColorMeta.setAttribute('content', '#18181b');
    } else {
      themeColorMeta.setAttribute('content', '#FFFFFF');
    }
  }

  function updateFooterModeLabel(mode) {
    const modeLabel = document.querySelector('[data-js="footer-mode"]');
    if (!modeLabel) return;
    const label = modeLabel.getAttribute(`data-label-${mode}`) || mode;
    modeLabel.textContent = label;
  }

  function updateFooterPaletteLabel(palette) {
    const paletteLabel = document.querySelector('[data-js="footer-palette"]');
    if (!paletteLabel) return;
    const baseLabel = paletteLabel.getAttribute(`data-label-${palette}`) || palette;
    paletteLabel.textContent = formatPaletteLabel(baseLabel, palette);
  }

  function updateFooterTypographyLabel(typography) {
    const typographyLabel = document.querySelector('[data-js="footer-typography"]');
    if (!typographyLabel) return;
    const label = typographyLabel.getAttribute(`data-label-${typography}`) || typography;
    typographyLabel.textContent = label;
  }

  // ==========================================================================
  // SYSTEM PREFERENCE LISTENER
  // ==========================================================================

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const storedMode = localStorage.getItem('theme-mode') || 'system';
    if (storedMode === 'system') {
      applyMode('system');
    }
  });

  function syncCotyYearUI(year) {
    if (!cotyYearSelects) return;
    cotyYearSelects.forEach(select => {
      select.value = String(year);
    });
  }

  function setCotyYear(year, options) {
    const opts = options || {};
    const actions = getCotyActions();
    let entry = null;

    if (actions && typeof actions.setYear === 'function') {
      entry = actions.setYear(year);
    } else {
      const numeric = Number(year) || 2026;
      document.documentElement.setAttribute('data-coty-year', String(numeric));
      entry = { year: numeric };
    }

    if (!entry || !entry.year) return;

    try {
      localStorage.setItem(COTY_YEAR_KEY, String(entry.year));
    } catch (_err) {
      // Ignore storage failures.
    }

    syncCotyYearUI(entry.year);
    const currentPalette = document.documentElement.getAttribute('data-palette') || 'standard';
    if (currentPalette !== 'pantone') {
      localStorage.setItem('theme-palette', 'pantone');
      applyPalette('pantone');
      updatePaletteUI('pantone');
      window.dispatchEvent(new CustomEvent('theme:palette-changed', {
        detail: { palette: 'pantone' }
      }));
    } else {
      updateFooterPaletteLabel(currentPalette);
    }

    if (!opts.silent) {
      window.dispatchEvent(new CustomEvent('theme:coty-year-changed', {
        detail: { year: entry.year, name: entry.name || '' }
      }));
    }
  }

  function initCotyYearControls() {
    const actions = getCotyActions();
    if (!cotyYearSelects || !cotyYearSelects.length || !actions || typeof actions.getEntries !== 'function') {
      return;
    }

    const entries = actions.getEntries();
    if (!entries || !entries.length) return;

    cotyYearSelects.forEach(select => {
      select.innerHTML = '';
      entries.forEach(entry => {
        const option = document.createElement('option');
        option.value = String(entry.year);
        option.textContent = String(entry.year) + ' \u2014 ' + entry.name;
        select.appendChild(option);
      });
      select.addEventListener('change', function() {
        setCotyYear(this.value);
      });
    });

    const initialYear = Number(localStorage.getItem(COTY_YEAR_KEY)) || actions.getCurrentYear();
    setCotyYear(initialYear, { silent: true });
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  document.addEventListener('DOMContentLoaded', function() {
    // Initialize selectors
    themeToggle = document.querySelector('[data-js="theme-toggle"]');
    themePanel = document.querySelector('[data-js="theme-panel"]');
    themeOverlay = document.querySelector('[data-js="theme-overlay"]');
    themeIcon = document.querySelector('[data-js="theme-icon"]');
    modeOptions = document.querySelectorAll('[data-js="mode-option"]');
    paletteOptions = document.querySelectorAll('[data-js="palette-option"]');
    cotyYearSelects = document.querySelectorAll('[data-js="coty-year-theme"]');
    typographyOptions = document.querySelectorAll('[data-js="typography-option"]');

    // Load stored preferences or use defaults
    const storedMode = localStorage.getItem('theme-mode') || 'system';
    const storedPalette = localStorage.getItem('theme-palette') || 'standard';
    const storedTypography = localStorage.getItem('theme-typography') || 'editorial';
    const normalizedStoredPalette = storedPalette === 'coty' ? 'pantone' : storedPalette;
    const initialPalette = (normalizedStoredPalette === 'custom' && !hasCustomPalette()) ? 'standard' : normalizedStoredPalette;
    if (initialPalette !== storedPalette) {
      localStorage.setItem('theme-palette', initialPalette);
    }

    // Apply stored preferences
    applyMode(storedMode);
    if (window.CotyScaleActions && typeof window.CotyScaleActions.init === 'function') {
      window.CotyScaleActions.init();
    }
    initCotyYearControls();
    syncCustomPaletteOptionVisibility();
    applyPalette(initialPalette);
    applyTypography(storedTypography);

    // Update UI to reflect current settings
    updateModeUI(storedMode);
    updatePaletteUI(initialPalette);
    updateTypographyUI(storedTypography);

    window.ThemeActions = {
      setMode: setMode,
      setPalette: setPalette,
      setTypography: setTypography,
      getPaletteOrder: function() {
        const seen = new Set();
        const values = [];
        paletteOptions.forEach(option => {
          if (option.hasAttribute('hidden')) return;
          const value = option.getAttribute('data-palette');
          if (value && !seen.has(value)) {
            seen.add(value);
            values.push(value);
          }
        });
        return values;
      },
      getTypographyOrder: function() {
        const seen = new Set();
        const values = [];
        typographyOptions.forEach(option => {
          const value = option.getAttribute('data-typography');
          if (value && !seen.has(value)) {
            seen.add(value);
            values.push(value);
          }
        });
        return values;
      },
      setCotyYear: setCotyYear,
      getCotyYear: getCurrentCotyYear,
      refreshCustomPalette: refreshCustomPaletteState
    };

    window.addEventListener('theme:custom-palette-updated', refreshCustomPaletteState);

    // Setup event listeners
    if (themeToggle && themePanel) {
      themeToggle.addEventListener('click', togglePanel);
      syncThemePanelPortal();

      // Close on overlay click
      if (themeOverlay) {
        themeOverlay.addEventListener('click', closePanel);
      }

      // Close on click outside
      document.addEventListener('click', function(e) {
        if (!themeToggle.contains(e.target) && !themePanel.contains(e.target)) {
          closePanel();
        }
      });

      const syncOnViewportChange = function() {
        if (!themePanel.hasAttribute('hidden')) {
          syncThemePanelPortal();
        }
      };
      window.addEventListener('resize', syncOnViewportChange);
      window.addEventListener('scroll', syncOnViewportChange, { passive: true });

      const gridObserver = new MutationObserver(function() {
        syncOnViewportChange();
      });
      gridObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-grid-overlay']
      });

      // Close on Escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          closePanel();
        }
      });

      // Touch support for swipe-to-close on mobile bottom sheet
      let touchStartY = 0;
      let touchCurrentY = 0;

      themePanel.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].screenY;
        themePanel.style.transition = 'none';
        themeOverlay.style.transition = 'none';
      });

      themePanel.addEventListener('touchmove', function(e) {
        touchCurrentY = e.changedTouches[0].screenY;
        const deltaY = touchCurrentY - touchStartY;

        // Only allow dragging downwards
        if (deltaY > 0) {
          e.preventDefault();
          themePanel.style.transform = `translateY(${deltaY}px)`;

          // Update overlay opacity based on drag distance
          const panelHeight = themePanel.getBoundingClientRect().height;
          const maxDeltaY = window.innerHeight - panelHeight - 8; // 8px from bottom
          const opacity = 1 - (deltaY / maxDeltaY);
          themeOverlay.style.opacity = Math.max(opacity, 0);
        }
      });

      themePanel.addEventListener('touchend', function(e) {
        const deltaY = touchCurrentY - touchStartY;

        themePanel.style.transition = 'transform 0.3s ease-in-out';
        themeOverlay.style.transition = 'opacity 0.3s ease-in-out';

        // Close if dragged down more than 50px
        if (deltaY > 50) {
          closePanel();
        } else {
          // Return to original position
          themePanel.style.transform = 'translateY(0)';
          themeOverlay.style.opacity = '1';
        }

        touchStartY = 0;
        touchCurrentY = 0;
      });
    }

    // Mode option listeners
    modeOptions.forEach(option => {
      option.addEventListener('click', function() {
        const mode = this.getAttribute('data-mode');
        setMode(mode);
      });
    });

    // Palette option listeners
    paletteOptions.forEach(option => {
      option.addEventListener('click', function() {
        const palette = this.getAttribute('data-palette');
        setPalette(palette);
      });
    });

    // Typography option listeners
    typographyOptions.forEach(option => {
      option.addEventListener('click', function() {
        const typography = this.getAttribute('data-typography');
        setTypography(typography);
      });
    });
  });

  // Global function for backwards compatibility (if needed elsewhere)
  window.setTheme = setMode;

})();
