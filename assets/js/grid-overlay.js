/**
 * Grid Overlay Toggle
 * Shows/hides a 12-column grid overlay for design verification.
 * Toggle via theme panel button or Ctrl+G keyboard shortcut.
 * State persisted in localStorage.
 */
(function () {
  var STORAGE_KEY = "grid-overlay";

  function isActive() {
    return document.documentElement.hasAttribute("data-grid-overlay");
  }

  function enable() {
    document.documentElement.setAttribute("data-grid-overlay", "");
    localStorage.setItem(STORAGE_KEY, "true");
    updateUI(true);
  }

  function disable() {
    document.documentElement.removeAttribute("data-grid-overlay");
    localStorage.removeItem(STORAGE_KEY);
    updateUI(false);
  }

  function toggle() {
    if (isActive()) {
      disable();
    } else {
      enable();
    }
  }

  function updateUI(on) {
    var buttons = document.querySelectorAll('[data-js="grid-toggle"]');
    buttons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(on));
    });
  }

  // Restore state from localStorage
  if (localStorage.getItem(STORAGE_KEY) === "true") {
    document.documentElement.setAttribute("data-grid-overlay", "");
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Update button state on load
    updateUI(isActive());

    // Click handlers for toggle buttons in theme/settings panels
    document.querySelectorAll('[data-js="grid-toggle"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        toggle();
      });
    });

    // Keyboard shortcut: Ctrl+G
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.key === "g" && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        toggle();
      }
    });
  });
})();
