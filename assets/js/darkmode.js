/**
 * Theme Management System (Mode + Palette)
 * Handles both color mode (light/dark/system) and color palette (standard/pantone)
 * with localStorage persistence and dropdown UI
 */

(function() {
  'use strict';

  // Theme dropdown selectors
  const themeToggle = document.querySelector('[data-js="theme-toggle"]');
  const themePanel = document.querySelector('[data-js="theme-panel"]');
  const themeIcon = document.querySelector('[data-js="theme-icon"]');
  const modeOptions = document.querySelectorAll('[data-js="mode-option"]');
  const paletteOptions = document.querySelectorAll('[data-js="palette-option"]');

  // ==========================================================================
  // DROPDOWN TOGGLE
  // ==========================================================================

  function togglePanel(e) {
    if (e) e.stopPropagation();
    const isHidden = themePanel.hasAttribute('hidden');

    if (isHidden) {
      themePanel.removeAttribute('hidden');
      themeToggle.setAttribute('aria-expanded', 'true');
    } else {
      themePanel.setAttribute('hidden', '');
      themeToggle.setAttribute('aria-expanded', 'false');
    }
  }

  function closePanel() {
    if (themePanel && !themePanel.hasAttribute('hidden')) {
      themePanel.setAttribute('hidden', '');
      themeToggle.setAttribute('aria-expanded', 'false');
    }
  }

  // Event listeners for dropdown
  if (themeToggle && themePanel) {
    themeToggle.addEventListener('click', togglePanel);

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
  }

  // ==========================================================================
  // MODE MANAGEMENT (light/dark/system)
  // ==========================================================================

  function setMode(mode) {
    localStorage.setItem('theme-mode', mode);
    applyMode(mode);
    updateModeUI(mode);
    closePanel();
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

    let svgPath = '';
    if (mode === 'light') {
      svgPath = '/img/svg/light.svg';
    } else if (mode === 'dark') {
      svgPath = '/img/svg/dark.svg';
    } else if (mode === 'system') {
      svgPath = '/img/svg/system.svg';
    }

    fetch(svgPath)
      .then(response => response.text())
      .then(svg => {
        const svgElement = new DOMParser()
          .parseFromString(svg, 'image/svg+xml')
          .querySelector('svg');
        themeIcon.innerHTML = '';
        themeIcon.appendChild(svgElement);
      })
      .catch(err => console.warn('Failed to load theme icon:', err));
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
  // EVENT LISTENERS
  // ==========================================================================

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

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  document.addEventListener('DOMContentLoaded', function() {
    // Load stored preferences or use defaults
    const storedMode = localStorage.getItem('theme-mode') || 'system';
    const storedPalette = localStorage.getItem('theme-palette') || 'standard';

    // Apply stored preferences
    applyMode(storedMode);
    applyPalette(storedPalette);

    // Update UI to reflect current settings
    updateModeUI(storedMode);
    updatePaletteUI(storedPalette);
  });

  // Global function for backwards compatibility (if needed elsewhere)
  window.setTheme = setMode;

})();
