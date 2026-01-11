/**
 * Theme Management System (Mode + Palette)
 * Handles both color mode (light/dark/system) and color palette (standard/pantone)
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
  }

  function applyPalette(palette) {
    document.documentElement.setAttribute('data-palette', palette);
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

    // Load stored preferences or use defaults
    const storedMode = localStorage.getItem('theme-mode') || 'system';
    const storedPalette = localStorage.getItem('theme-palette') || 'standard';

    // Apply stored preferences
    applyMode(storedMode);
    applyPalette(storedPalette);

    // Update UI to reflect current settings
    updateModeUI(storedMode);
    updatePaletteUI(storedPalette);

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
      let isDragging = false;

      themePanel.addEventListener('touchstart', function(e) {
        // Only handle touches on the panel itself or the drag handle area
        const rect = themePanel.getBoundingClientRect();
        const touchY = e.touches[0].clientY;

        // Check if touch is in the top drag handle area (first 48px)
        if (touchY - rect.top < 48) {
          touchStartY = touchY;
          isDragging = true;
        }
      }, { passive: true });

      themePanel.addEventListener('touchmove', function(e) {
        if (!isDragging) return;

        touchCurrentY = e.touches[0].clientY;
        const deltaY = touchCurrentY - touchStartY;

        // Only allow dragging downwards
        if (deltaY > 0) {
          themePanel.style.transform = `translateY(${deltaY}px)`;
        }
      }, { passive: true });

      themePanel.addEventListener('touchend', function(e) {
        if (!isDragging) return;

        const deltaY = touchCurrentY - touchStartY;

        // Close if dragged down more than 80px
        if (deltaY > 80) {
          closePanel();
        }

        // Reset transform
        themePanel.style.transform = '';
        isDragging = false;
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
  });

  // Global function for backwards compatibility (if needed elsewhere)
  window.setTheme = setMode;

})();
