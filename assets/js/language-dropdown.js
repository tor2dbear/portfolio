/**
 * Language Dropdown Toggle
 * Handles opening/closing of language selection panel
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.querySelector('.language-toggle');
    const panel = document.querySelector('.language-panel');

    if (!toggle || !panel) return;

    // Toggle panel visibility
    function togglePanel(e) {
      e.stopPropagation();
      const isHidden = panel.hasAttribute('hidden');

      if (isHidden) {
        panel.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
      }
    }

    // Close panel when clicking outside
    function closePanel(e) {
      if (!toggle.contains(e.target) && !panel.contains(e.target)) {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
      }
    }

    // Close panel on Escape key
    function handleEscape(e) {
      if (e.key === 'Escape' && !panel.hasAttribute('hidden')) {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    }

    // Event listeners
    toggle.addEventListener('click', togglePanel);
    document.addEventListener('click', closePanel);
    document.addEventListener('keydown', handleEscape);

    // Touch support for mobile
    let touchStartY = 0;

    toggle.addEventListener('touchstart', function(e) {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    toggle.addEventListener('touchend', function(e) {
      const touchEndY = e.changedTouches[0].clientY;
      // Only toggle if not scrolling
      if (Math.abs(touchEndY - touchStartY) < 10) {
        togglePanel(e);
      }
    });
  });
})();
