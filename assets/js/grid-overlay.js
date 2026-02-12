/**
 * Grid Overlay Toggle
 * Shows/hides a 12-column grid overlay for design verification.
 * Toggle via theme panel button or keyboard chords.
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
      var title = btn ? btn.getAttribute("data-toast-title") : "Grid";
      var val = btn ? btn.getAttribute("data-toast-on") : "";
      window.Toast.show(title, val, { icon: "icon-grid-micro" });
    }
    updateFooterGrid(true);
  }

  function disable(showToast) {
    if (closing) return;
    closing = true;

    document.documentElement.setAttribute("data-grid-animate", "");
    document.documentElement.setAttribute("data-grid-overlay", "closing");
    updateUI(false);
    if (showToast && window.Toast) {
      var btn = document.querySelector('[data-js="grid-toggle"]');
      var title = btn ? btn.getAttribute("data-toast-title") : "Grid";
      var val = btn ? btn.getAttribute("data-toast-off") : "";
      window.Toast.show(title, val, { icon: "icon-grid-micro" });
    }
    updateFooterGrid(false);

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

  function closeSettingsPanelOnMobile() {
    if (!window.matchMedia("(max-width: 29.9375em)").matches) return;

    var settingsPanel = document.querySelector('[data-js="settings-panel"]');
    var settingsOverlay = document.querySelector('[data-js="settings-overlay"]');
    var settingsToggle = document.querySelector('[data-js="settings-toggle"]');

    if (settingsPanel && !settingsPanel.hasAttribute("hidden")) {
      settingsPanel.setAttribute("hidden", "");
      settingsPanel.style.transform = "";
      settingsPanel.style.transition = "";
    }

    if (settingsOverlay && !settingsOverlay.hasAttribute("hidden")) {
      settingsOverlay.setAttribute("hidden", "");
      settingsOverlay.style.opacity = "";
      settingsOverlay.style.transition = "";
    }

    if (settingsToggle) {
      settingsToggle.setAttribute("aria-expanded", "false");
    }
  }

  function updateUI(on) {
    var buttons = document.querySelectorAll('[data-js="grid-toggle"]');
    buttons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(on));
    });
  }

  function updateFooterGrid(on) {
    var el = document.querySelector('[data-js="footer-grid"]');
    if (!el) return;
    var btn = document.querySelector('[data-js="grid-toggle"]');
    var title = btn ? btn.getAttribute("data-toast-title") : "Grid";
    var label = on
      ? (btn ? btn.getAttribute("data-toast-on") : "")
      : (btn ? btn.getAttribute("data-toast-off") : "");
    el.textContent = title + " " + label;
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
    // Update button state and footer on load
    updateUI(isActive());
    updateFooterGrid(isActive());

    // Click handlers for toggle buttons in theme/settings panels
    document
      .querySelectorAll('[data-js="grid-toggle"]')
      .forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          toggle();
          closeSettingsPanelOnMobile();
        });
      });
  });

  window.GridOverlayActions = {
    toggle: function () {
      toggle();
      closeSettingsPanelOnMobile();
    },
    isActive: isActive
  };
})();
