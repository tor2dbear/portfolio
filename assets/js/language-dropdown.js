/**
 * Language Dropdown Toggle
 * Handles opening/closing the language selection panel
 */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.querySelector('.language-toggle');
    const panel = document.querySelector('.language-panel');

    if (!toggle || !panel) return;

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

    function closePanel() {
      if (panel && !panel.hasAttribute('hidden')) {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
      }
    }

    // Toggle on click
    toggle.addEventListener('click', togglePanel);

    // Close on click outside
    document.addEventListener('click', function(e) {
      if (!toggle.contains(e.target) && !panel.contains(e.target)) {
        closePanel();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closePanel();
      }
    });
  });
})();
