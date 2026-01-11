/**
 * Settings Dropdown (XS)
 * Handles opening/closing the combined settings panel.
 */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.querySelector('[data-js="settings-toggle"]');
    const panel = document.querySelector('[data-js="settings-panel"]');
    const overlay = document.querySelector('[data-js="settings-overlay"]');

    if (!toggle || !panel) return;

    function closeThemePanel() {
      const themePanel = document.querySelector('.theme-panel');
      const themeToggle = document.querySelector('.theme-toggle');
      const themeOverlay = document.querySelector('.theme-overlay');

      if (themePanel && !themePanel.hasAttribute('hidden')) {
        themePanel.setAttribute('hidden', '');
        if (themeOverlay) themeOverlay.setAttribute('hidden', '');
        if (themeToggle) themeToggle.setAttribute('aria-expanded', 'false');
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

    function closePanel() {
      if (panel && !panel.hasAttribute('hidden')) {
        panel.setAttribute('hidden', '');
        if (overlay) overlay.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
      }
    }

    function togglePanel(e) {
      e.stopPropagation();
      const isHidden = panel.hasAttribute('hidden');

      if (isHidden) {
        closeThemePanel();
        closeLanguagePanel();
        panel.removeAttribute('hidden');
        if (overlay) overlay.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        closePanel();
      }
    }

    toggle.addEventListener('click', togglePanel);

    if (overlay) {
      overlay.addEventListener('click', closePanel);
    }

    document.addEventListener('click', function(e) {
      if (!toggle.contains(e.target) && !panel.contains(e.target)) {
        closePanel();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closePanel();
      }
    });

    // Touch support for swipe-to-close on mobile bottom sheet
    let touchStartY = 0;
    let touchCurrentY = 0;
    let isDragging = false;

    if (panel) {
      panel.addEventListener('touchstart', function(e) {
        // Only handle touches on the panel itself or the drag handle area
        const rect = panel.getBoundingClientRect();
        const touchY = e.touches[0].clientY;

        // Check if touch is in the top drag handle area (first 48px)
        if (touchY - rect.top < 48) {
          touchStartY = touchY;
          isDragging = true;
        }
      }, { passive: true });

      panel.addEventListener('touchmove', function(e) {
        if (!isDragging) return;

        touchCurrentY = e.touches[0].clientY;
        const deltaY = touchCurrentY - touchStartY;

        // Only allow dragging downwards
        if (deltaY > 0) {
          panel.style.transform = `translateY(${deltaY}px)`;
        }
      }, { passive: true });

      panel.addEventListener('touchend', function(e) {
        if (!isDragging) return;

        const deltaY = touchCurrentY - touchStartY;

        // Close if dragged down more than 80px
        if (deltaY > 80) {
          closePanel();
        }

        // Reset transform
        panel.style.transform = '';
        isDragging = false;
        touchStartY = 0;
        touchCurrentY = 0;
      });
    }
  });
})();
