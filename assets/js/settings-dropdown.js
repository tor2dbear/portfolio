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

    function isGridActive() {
      return document.documentElement.hasAttribute('data-grid-overlay');
    }

    function ensurePortalOrigin(el) {
      if (!el || el.__portalPlaceholder) return;
      const placeholder = document.createComment('settings-portal-anchor');
      el.parentNode.insertBefore(placeholder, el);
      el.__portalPlaceholder = placeholder;
    }

    function restorePortal(el) {
      if (!el || !el.classList.contains('dropdown-panel--portal')) return;
      const placeholder = el.__portalPlaceholder;
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.insertBefore(el, placeholder);
        placeholder.remove();
      }
      el.__portalPlaceholder = null;
      el.classList.remove('dropdown-panel--portal');
      el.style.position = '';
      el.style.top = '';
      el.style.left = '';
      el.style.right = '';
      el.style.bottom = '';
    }

    function mountPortal(el) {
      if (!el) return;
      ensurePortalOrigin(el);
      if (el.parentNode !== document.body) {
        document.body.appendChild(el);
      }
      el.classList.add('dropdown-panel--portal');
    }

    function syncSettingsPortal() {
      const open = panel && !panel.hasAttribute('hidden');
      if (open && isGridActive()) {
        mountPortal(panel);
        if (overlay) mountPortal(overlay);
        return;
      }
      restorePortal(panel);
      if (overlay) restorePortal(overlay);
    }

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

    function resetPanelStyles() {
      if (!panel) return;
      panel.style.transform = '';
      panel.style.transition = '';
      if (overlay) {
        overlay.style.opacity = '';
        overlay.style.transition = '';
      }
    }

    function closePanel() {
      if (panel && !panel.hasAttribute('hidden')) {
        panel.setAttribute('hidden', '');
        if (overlay) overlay.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
        resetPanelStyles();
        syncSettingsPortal();
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
        resetPanelStyles();
        syncSettingsPortal();
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

    const syncOnStateChange = function() {
      if (!panel.hasAttribute('hidden')) {
        syncSettingsPortal();
      }
    };
    window.addEventListener('resize', syncOnStateChange);
    window.addEventListener('scroll', syncOnStateChange, { passive: true });

    const gridObserver = new MutationObserver(function() {
      syncOnStateChange();
    });
    gridObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-grid-overlay']
    });

    // Touch support for swipe-to-close on mobile bottom sheet
    let touchStartY = 0;
    let touchCurrentY = 0;

    if (panel && overlay) {
      panel.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].screenY;
        panel.style.transition = 'none';
        overlay.style.transition = 'none';
      });

      panel.addEventListener('touchmove', function(e) {
        touchCurrentY = e.changedTouches[0].screenY;
        const deltaY = touchCurrentY - touchStartY;

        // Only allow dragging downwards
        if (deltaY > 0) {
          e.preventDefault();
          panel.style.transform = `translateY(${deltaY}px)`;

          // Update overlay opacity based on drag distance
          const panelHeight = panel.getBoundingClientRect().height;
          const maxDeltaY = window.innerHeight - panelHeight - 8; // 8px from bottom
          const opacity = 1 - (deltaY / maxDeltaY);
          overlay.style.opacity = Math.max(opacity, 0);
        }
      });

      panel.addEventListener('touchend', function(e) {
        const deltaY = touchCurrentY - touchStartY;

        panel.style.transition = 'transform 0.3s ease-in-out';
        overlay.style.transition = 'opacity 0.3s ease-in-out';

        // Close if dragged down more than 50px
        if (deltaY > 50) {
          closePanel();
        } else {
          // Return to original position
          panel.style.transform = 'translateY(0)';
          overlay.style.opacity = '1';
        }

        touchStartY = 0;
        touchCurrentY = 0;
      });
    }
  });
})();
