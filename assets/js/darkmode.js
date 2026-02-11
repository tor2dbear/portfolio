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
  let typographyOptions;

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
    } else {
      themePanel.setAttribute('hidden', '');
      if (themeOverlay) themeOverlay.setAttribute('hidden', '');
      themeToggle.setAttribute('aria-expanded', 'false');
    }
  }

  function closePanel() {
    if (themePanel && !themePanel.hasAttribute('hidden')) {
      themePanel.setAttribute('hidden', '');
      if (themeOverlay) themeOverlay.setAttribute('hidden', '');
      themeToggle.setAttribute('aria-expanded', 'false');
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
    if (mode === 'system') {
      const systemMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-mode', systemMode);
    } else {
      document.documentElement.setAttribute('data-mode', mode);
    }
    updateThemeIcon(mode);
    updateThemeColorMeta();
    updateFooterModeLabel(mode);
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
    localStorage.setItem('theme-palette', palette);
    applyPalette(palette);
    updatePaletteUI(palette);
    closePanel();
    closeSettingsPanel();

    var el = document.querySelector('[data-js="footer-palette"]');
    var category = el ? el.getAttribute('data-category') : '';
    var label = el ? (el.getAttribute('data-label-' + palette) || palette) : palette;
    var icon = el ? el.getAttribute('data-toast-icon') : '';
    if (window.Toast) window.Toast.show(category, label, { icon: icon });
  }

  function applyPalette(palette) {
    document.documentElement.setAttribute('data-palette', palette);
    updateFooterPaletteLabel(palette);
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

  function updateThemeIcon(mode) {
    if (!themeIcon) return;

    let iconId = '';
    if (mode === 'light') {
      iconId = 'icon-light';
    } else if (mode === 'dark') {
      iconId = 'icon-dark';
    } else if (mode === 'system') {
      iconId = 'icon-system';
    }

    // Use SVG sprite system for instant icon updates
    themeIcon.innerHTML = `<svg width="24" height="24" aria-hidden="true">
      <use href="/img/svg/sprite.svg#${iconId}"></use>
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
    const label = paletteLabel.getAttribute(`data-label-${palette}`) || palette;
    paletteLabel.textContent = label;
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
    typographyOptions = document.querySelectorAll('[data-js="typography-option"]');

    // Load stored preferences or use defaults
    const storedMode = localStorage.getItem('theme-mode') || 'system';
    const storedPalette = localStorage.getItem('theme-palette') || 'standard';
    const storedTypography = localStorage.getItem('theme-typography') || 'editorial';

    // Apply stored preferences
    applyMode(storedMode);
    applyPalette(storedPalette);
    applyTypography(storedTypography);

    // Update UI to reflect current settings
    updateModeUI(storedMode);
    updatePaletteUI(storedPalette);
    updateTypographyUI(storedTypography);

    // Setup event listeners
    if (themeToggle && themePanel) {
      themeToggle.addEventListener('click', togglePanel);

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
