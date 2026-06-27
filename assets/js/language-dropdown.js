/**
 * Language navigation + (optional) dropdown panel.
 *
 * Language switching binds the radio inputs globally and exposes
 * window.LanguageActions, so it works from the unified settings panel even
 * though the standalone language dropdown panel/toggle has been retired.
 * The legacy panel code below the guard only runs if `.language-panel` is
 * present in the DOM.
 */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.querySelector('.language-toggle');
    const panel = document.querySelector('.language-panel');
    const overlay = document.querySelector('.language-overlay');

    function setPendingToast(languageName) {
      if (!languageName) {return;}
      try {
        localStorage.setItem('pending-toast', JSON.stringify({
          category: 'language',
          value: languageName.trim(),
          icon: 'icon-language-micro'
        }));
      } catch (e) {}
    }

    function navigateByInput(input) {
      if (!input) {return;}
      const href = input.getAttribute('data-language-href');
      if (!href) {return;}
      const name = input.getAttribute('data-language-name') || '';
      setPendingToast(name);
      window.location.href = href;
    }

    function navigateByLanguageCode(code) {
      if (!code) {return;}
      const input = document.querySelector(`input[type="radio"][data-language-code="${code}"][data-language-href]`);
      if (!input) {return;}
      navigateByInput(input);
    }

    // Navigation works regardless of the legacy panel — the language radio
    // inputs live in the settings panel.
    window.LanguageActions = { setLanguage: navigateByLanguageCode };

    document.querySelectorAll('input[type="radio"][data-language-href]').forEach(function(input) {
      input.addEventListener('change', function() {
        navigateByInput(input);
      });
    });

    // Everything below drives the standalone language dropdown panel, which is
    // optional. When it is absent (unified settings panel), we stop here.
    if (!toggle || !panel) {return;}

    function isGridActive() {
      const value = document.documentElement.getAttribute('data-grid-overlay');
      return value !== null && value !== 'closing';
    }

    function shouldUsePanelPortal() {
      if (panel.hasAttribute('hidden')) {return false;}
      if (!window.matchMedia('(min-width: 30em)').matches) {return false;}
      return isGridActive();
    }

    function ensurePanelPortalOrigin() {
      if (panel.__portalPlaceholder) {return;}
      const placeholder = document.createComment('dropdown-portal-anchor');
      panel.parentNode.insertBefore(placeholder, panel);
      panel.__portalPlaceholder = placeholder;
    }

    function positionPanelAtToggle() {
      const toggleRect = toggle.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const panelWidth = panelRect.width;
      const viewportWidth = window.innerWidth;
      const gutter = 8;

      let left = toggleRect.right - panelWidth;
      if (left < gutter) {left = gutter;}
      if (left + panelWidth > viewportWidth - gutter) {
        left = viewportWidth - panelWidth - gutter;
      }

      panel.style.top = `${toggleRect.bottom + 8}px`;
      panel.style.left = `${Math.max(left, gutter)}px`;
      panel.style.width = `${panelWidth}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    }

    function mountPanelPortal() {
      ensurePanelPortalOrigin();
      if (panel.parentNode !== document.body) {
        document.body.appendChild(panel);
      }
      panel.classList.add('dropdown-panel--portal');
      panel.style.position = 'fixed';
      positionPanelAtToggle();
    }

    function restorePanelPortal(panelEl) {
      if (!panelEl || !panelEl.classList.contains('dropdown-panel--portal')) {return;}

      const placeholder = panelEl.__portalPlaceholder;
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.insertBefore(panelEl, placeholder);
        placeholder.remove();
      }

      panelEl.__portalPlaceholder = null;
      panelEl.classList.remove('dropdown-panel--portal');
      panelEl.style.position = '';
      panelEl.style.top = '';
      panelEl.style.left = '';
      panelEl.style.width = '';
      panelEl.style.right = '';
      panelEl.style.bottom = '';
    }

    function syncLanguagePanelPortal() {
      if (shouldUsePanelPortal()) {
        mountPanelPortal();
        return;
      }
      if (document.documentElement.hasAttribute('data-grid-overlay')) {
        return;
      }
      restorePanelPortal(panel);
    }

    function togglePanel(e) {
      e.stopPropagation();
      const isHidden = panel.hasAttribute('hidden');

      if (isHidden) {
        closeThemePanel();
        panel.removeAttribute('hidden');
        if (overlay) {overlay.removeAttribute('hidden');}
        toggle.setAttribute('aria-expanded', 'true');
        syncLanguagePanelPortal();
      } else {
        closePanel();
      }
    }

    function closePanel() {
      if (panel && !panel.hasAttribute('hidden')) {
        panel.setAttribute('hidden', '');
        if (overlay) {overlay.setAttribute('hidden', '');}
        toggle.setAttribute('aria-expanded', 'false');
        syncLanguagePanelPortal();
      }
    }

    function closeThemePanel() {
      const themePanel = document.querySelector('.theme-panel');
      const themeToggle = document.querySelector('.theme-toggle');
      const themeOverlay = document.querySelector('.theme-overlay');

      if (themePanel && !themePanel.hasAttribute('hidden')) {
        themePanel.setAttribute('hidden', '');
        if (themeOverlay) {themeOverlay.setAttribute('hidden', '');}
        if (themeToggle) {themeToggle.setAttribute('aria-expanded', 'false');}
        restorePanelPortal(themePanel);
      }
    }

    // Toggle on click
    toggle.addEventListener('click', togglePanel);
    syncLanguagePanelPortal();

    if (overlay) {
      overlay.addEventListener('click', closePanel);
    }

    // Close on click outside
    document.addEventListener('click', function(e) {
      if (!toggle.contains(e.target) && !panel.contains(e.target)) {
        closePanel();
      }
    });

    const syncOnViewportChange = function() {
      if (!panel.hasAttribute('hidden')) {
        syncLanguagePanelPortal();
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

      panel.addEventListener('touchend', function () {
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
