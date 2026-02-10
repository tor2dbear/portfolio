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

  function enable(showToast) {
    closing = false;
    document.documentElement.setAttribute("data-grid-animate", "");
    document.documentElement.setAttribute("data-grid-overlay", "");
    localStorage.setItem(STORAGE_KEY, "true");
    updateUI(true);
    if (showToast && window.Toast) {
      var btn = document.querySelector('[data-js="grid-toggle"]');
      var msg = btn ? btn.getAttribute("data-toast-on") : null;
      if (msg) window.Toast.show(msg);
    }
  }

  function disable(showToast) {
    if (closing) return;
    closing = true;

    document.documentElement.setAttribute("data-grid-animate", "");
    document.documentElement.setAttribute("data-grid-overlay", "closing");
    updateUI(false);
    if (showToast && window.Toast) {
      var btn = document.querySelector('[data-js="grid-toggle"]');
      var msg = btn ? btn.getAttribute("data-toast-off") : null;
      if (msg) window.Toast.show(msg);
    }

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
      disable(true);
    } else {
      enable(true);
    }
  }

  function updateUI(on) {
    var buttons = document.querySelectorAll('[data-js="grid-toggle"]');
    buttons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(on));
    });
  }

  // Track scrollbar width so the fixed-position overlay matches content alignment
  function syncScrollbarWidth() {
    var sw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty("--scrollbar-width", sw + "px");
  }
  syncScrollbarWidth();
  window.addEventListener("resize", syncScrollbarWidth);

  // Restore state from localStorage — no animation on page load
  if (localStorage.getItem(STORAGE_KEY) === "true") {
    document.documentElement.setAttribute("data-grid-overlay", "");
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Show ⌘G on Mac, Ctrl+G elsewhere
    if (/Mac|iPhone|iPad|iPod/.test(navigator.userAgent)) {
      document.querySelectorAll(".toggle-switch__shortcut, kbd").forEach(function (el) {
        if (el.textContent.trim() === "Ctrl+G") el.textContent = "⌘G";
      });
    }

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

    // Keyboard shortcut: Ctrl+G (Win/Linux) or Cmd+G (Mac)
    document.addEventListener("keydown", function (e) {
      var mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "g" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        toggle();
      }
    });
  });
})();
