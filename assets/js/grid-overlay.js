/**
 * Grid Overlay Toggle
 * Shows/hides a 12-column grid overlay for design verification.
 * Toggle via theme panel button or Ctrl+G keyboard shortcut.
 * State persisted in localStorage.
 * Columns animate in/out only on explicit toggle (not page navigation).
 */
(function () {
  var STORAGE_KEY = "grid-overlay";
  var closing = false;

  function isActive() {
    return (
      document.documentElement.hasAttribute("data-grid-overlay") && !closing
    );
  }

  function enable() {
    closing = false;
    document.documentElement.setAttribute("data-grid-animate", "");
    document.documentElement.setAttribute("data-grid-overlay", "");
    localStorage.setItem(STORAGE_KEY, "true");
    updateUI(true);
  }

  function disable() {
    if (closing) return;
    closing = true;

    document.documentElement.setAttribute("data-grid-animate", "");
    document.documentElement.setAttribute("data-grid-overlay", "closing");
    updateUI(false);

    // Column 1 finishes last in reverse stagger — listen for its animationend
    var lastCol = document.querySelector(".grid-overlay__col:first-child");
    if (lastCol) {
      lastCol.addEventListener(
        "animationend",
        function () {
          document.documentElement.removeAttribute("data-grid-overlay");
          document.documentElement.removeAttribute("data-grid-animate");
          localStorage.removeItem(STORAGE_KEY);
          closing = false;
        },
        { once: true }
      );

      // Safety timeout in case animationend doesn't fire
      setTimeout(function () {
        if (closing) {
          document.documentElement.removeAttribute("data-grid-overlay");
          document.documentElement.removeAttribute("data-grid-animate");
          localStorage.removeItem(STORAGE_KEY);
          closing = false;
        }
      }, 600);
    } else {
      document.documentElement.removeAttribute("data-grid-overlay");
      document.documentElement.removeAttribute("data-grid-animate");
      localStorage.removeItem(STORAGE_KEY);
      closing = false;
    }
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

  // Restore state from localStorage — no animation on page load
  if (localStorage.getItem(STORAGE_KEY) === "true") {
    document.documentElement.setAttribute("data-grid-overlay", "");
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Update button state on load
    updateUI(isActive());

    // Click handlers for toggle buttons in theme/settings panels
    document
      .querySelectorAll('[data-js="grid-toggle"]')
      .forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          toggle();
        });
      });

    // Keyboard shortcut: Ctrl+G
    document.addEventListener("keydown", function (e) {
      if (
        e.ctrlKey &&
        e.key === "g" &&
        !e.shiftKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        toggle();
      }
    });
  });
})();
