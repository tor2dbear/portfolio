/**
 * Settings Dropdown (XS)
 * Handles opening/closing the combined settings panel.
 */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.querySelector('[data-js="settings-toggle"]');
    const panel = document.querySelector('[data-js="settings-panel"]');
    const overlay = document.querySelector('[data-js="settings-overlay"]');

    if (!toggle || !panel) {
      return;
    }

    // Keep the terminal collapsed marker ("… +N lines (click to expand)") honest:
    // N is the number of settings the panel lists (mode, typography, layout,
    // effects, share, language). Recomputed from the DOM so it can't drift when a
    // section is added or removed. No-op off the terminal layout (the attribute is
    // only rendered as text there); works for every locale by rewriting the digits.
    (function syncTerminalExpandCount() {
      const expandLabel = toggle.getAttribute("data-terminal-expand");
      if (!expandLabel) {
        return;
      }
      const count = panel.querySelectorAll(".theme-section").length;
      toggle.setAttribute(
        "data-terminal-expand",
        expandLabel.replace(/\+\s*\d+/, "+" + count)
      );
    })();

    // --- Popover prototype (progressive enhancement) ---------------------
    // Where the Popover API is supported, upgrade the panel to a native
    // top-layer popover: native open/close/light-dismiss/focus, ::backdrop as
    // the scrim, and CSS-driven enter/exit. The whole legacy path below (portal,
    // outside-click, Escape, overlay element) is skipped in that case. Browsers
    // without popover fall through to the legacy implementation unchanged.
    var supportsPopover =
      typeof panel.showPopover === "function" &&
      Object.prototype.hasOwnProperty.call(window.HTMLElement.prototype, "popover");

    function inTerminalLayout() {
      return (
        document.documentElement.getAttribute("data-layout") === "terminal"
      );
    }

    function initPopoverPanel() {
      // The custom overlay is replaced by ::backdrop.
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }

      function enablePopover() {
        if (panel.getAttribute("popover") === "auto") {
          return;
        }
        panel.removeAttribute("hidden");
        panel.setAttribute("popover", "auto"); // closed until showPopover/target
        toggle.setAttribute("popovertarget", panel.id);
      }

      function disablePopover() {
        if (panel.matches(":popover-open")) {
          try {
            panel.hidePopover();
          } catch (e) {
            /* not open */
          }
        }
        panel.removeAttribute("popover");
        toggle.removeAttribute("popovertarget");
      }

      // The terminal layout prints the panel inline as text — not a popover.
      if (inTerminalLayout()) {
        disablePopover();
      } else {
        enablePopover();
      }

      // Desktop: the top-layer panel is anchored under the toggle via inline
      // position; mobile keeps the CSS fixed bottom sheet.
      function positionPanel() {
        if (!window.matchMedia("(min-width: 30em)").matches) {
          panel.style.top = "";
          panel.style.right = "";
          panel.style.left = "";
          return;
        }
        var r = toggle.getBoundingClientRect();
        panel.style.left = "auto";
        panel.style.right =
          Math.max(8, Math.round(window.innerWidth - r.right)) + "px";
        panel.style.top = Math.round(r.bottom + 8) + "px";
      }

      panel.addEventListener("toggle", function (e) {
        var open = e.newState === "open";
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        setSettingsPanelOpenState(open);
        if (open) {
          closeThemePanel();
          closeLanguagePanel();
          positionPanel();
        }
      });

      var reposition = function () {
        if (panel.matches(":popover-open")) {
          positionPanel();
        }
      };
      window.addEventListener("resize", reposition);
      window.addEventListener("scroll", reposition, { passive: true });

      // --- Drag-to-dismiss for the mobile bottom sheet ---------------------
      // Only the sheet layout (< 30em, open) is draggable; the desktop
      // dropdown is left alone. A downward drag from the top handle zone
      // follows the finger; releasing past a threshold hides the popover,
      // otherwise it snaps back.
      var DRAG_ZONE = 56; // px from the top of the panel that starts a drag
      var DRAG_ENGAGE = 6; // px of travel before we treat it as a drag
      var dragPointerId = null;
      var dragStartY = 0;
      var dragDelta = 0;
      var dragEngaged = false;

      function isMobileSheet() {
        return (
          panel.matches(":popover-open") &&
          !window.matchMedia("(min-width: 30em)").matches
        );
      }

      function setDragTransition(on) {
        panel.style.transition = on ? "" : "none";
      }

      function onDragMove(e) {
        if (dragPointerId === null || e.pointerId !== dragPointerId) {
          return;
        }
        var delta = e.clientY - dragStartY;
        if (!dragEngaged) {
          if (delta < DRAG_ENGAGE) {
            // Ignore upward / tiny moves; let them stay a tap or scroll.
            return;
          }
          dragEngaged = true;
          setDragTransition(false);
          panel.classList.add("is-dragging"); // freezes the ::backdrop transition
          try {
            panel.setPointerCapture(dragPointerId);
          } catch (err) {
            /* capture unsupported */
          }
        }
        // Clamp so an upward drag can't lift the sheet above its resting spot.
        dragDelta = Math.max(0, delta);
        e.preventDefault();
        panel.style.transform = "translateY(" + dragDelta + "px)";
        // Fade the scrim/blur out in step with the pull (0 at rest → 1 when the
        // sheet has travelled its full height).
        var progress = Math.min(1, dragDelta / (panel.offsetHeight || 1));
        panel.style.setProperty("--sheet-drag", String(progress));
      }

      function endDrag(e) {
        if (dragPointerId === null || e.pointerId !== dragPointerId) {
          return;
        }
        var wasEngaged = dragEngaged;
        var delta = dragDelta;
        try {
          panel.releasePointerCapture(dragPointerId);
        } catch (err) {
          /* not captured */
        }
        dragPointerId = null;
        dragEngaged = false;
        dragDelta = 0;
        if (!wasEngaged) {
          return;
        }
        var threshold = Math.min(120, panel.offsetHeight * 0.25);
        // Re-enable the CSS transitions (both the panel's and, via removing the
        // class, the ::backdrop's) so the tail motion animates.
        panel.classList.remove("is-dragging");
        setDragTransition(true);
        void panel.offsetHeight; // flush so the dragged position is the start
        if (delta > threshold) {
          // Slide the rest of the way down from the finger position and fade the
          // scrim fully out in sync, then close.
          var settled = false;
          var finish = function () {
            if (settled) {
              return;
            }
            settled = true;
            panel.removeEventListener("transitionend", onEnd);
            try {
              panel.hidePopover();
            } catch (err) {
              /* already closed */
            }
            // Clear the inline overrides so the next open starts clean
            // (::backdrop + @starting-style drive the enter animation).
            panel.style.transform = "";
            panel.style.transition = "";
            panel.style.removeProperty("--sheet-drag");
          };
          var onEnd = function (ev) {
            if (ev.target === panel && ev.propertyName === "transform") {
              finish();
            }
          };
          panel.addEventListener("transitionend", onEnd);
          window.setTimeout(finish, 500); // fallback if transitionend is missed
          panel.style.transform = "translateY(100%)";
          panel.style.setProperty("--sheet-drag", "1");
        } else {
          // Snap back to the resting position and restore the full scrim.
          panel.style.transform = "";
          panel.style.setProperty("--sheet-drag", "0");
        }
      }

      panel.addEventListener("pointerdown", function (e) {
        if (dragPointerId !== null || !isMobileSheet()) {
          return;
        }
        if (e.pointerType === "mouse") {
          return; // touch/pen only — mouse users have light-dismiss
        }
        var r = panel.getBoundingClientRect();
        if (e.clientY - r.top > DRAG_ZONE) {
          return; // grabbed below the handle zone — leave scrolling alone
        }
        dragPointerId = e.pointerId;
        dragStartY = e.clientY;
        dragDelta = 0;
        dragEngaged = false;
      });
      panel.addEventListener("pointermove", onDragMove);
      panel.addEventListener("pointerup", endDrag);
      panel.addEventListener("pointercancel", endDrag);

      window.addEventListener("theme:layout-changed", function (e) {
        if (e && e.detail && e.detail.layout === "terminal") {
          disablePopover();
        } else {
          enablePopover();
        }
      });
    }

    if (supportsPopover) {
      initPopoverPanel();
      return;
    }

    function setSettingsPanelOpenState(isOpen) {
      if (isOpen) {
        document.documentElement.setAttribute(
          "data-settings-panel-open",
          "true"
        );
        return;
      }
      document.documentElement.removeAttribute("data-settings-panel-open");
      window.dispatchEvent(new window.CustomEvent("theme:sheet-closed"));
    }

    function isGridActive() {
      return document.documentElement.hasAttribute("data-grid-overlay");
    }

    function ensurePortalOrigin(el) {
      if (!el || el.__portalPlaceholder) {
        return;
      }
      const placeholder = document.createComment("settings-portal-anchor");
      el.parentNode.insertBefore(placeholder, el);
      el.__portalPlaceholder = placeholder;
    }

    function restorePortal(el) {
      if (!el || !el.classList.contains("dropdown-panel--portal")) {
        return;
      }
      const placeholder = el.__portalPlaceholder;
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.insertBefore(el, placeholder);
        placeholder.remove();
      }
      el.__portalPlaceholder = null;
      el.classList.remove("dropdown-panel--portal");
      el.style.position = "";
      el.style.top = "";
      el.style.left = "";
      el.style.right = "";
      el.style.bottom = "";
    }

    function mountPortal(el) {
      if (!el) {
        return;
      }
      ensurePortalOrigin(el);
      if (el.parentNode !== document.body) {
        document.body.appendChild(el);
      }
      el.classList.add("dropdown-panel--portal");
    }

    // Only the mobile bottom sheet portals to <body>. At >= 30em the panel is
    // an anchored dropdown popover and must stay inside its relative container.
    // The terminal layout prints the panel inline into the buffer at EVERY
    // width (like desktop) — never the bottom sheet — so it opts out entirely.
    function isMobileSheet() {
      if (document.documentElement.getAttribute("data-layout") === "terminal") {
        return false;
      }
      return !window.matchMedia("(min-width: 30em)").matches;
    }

    function syncSettingsPortal() {
      const open = panel && !panel.hasAttribute("hidden");
      if (open && isMobileSheet()) {
        mountPortal(panel);
        if (overlay) {
          mountPortal(overlay);
        }
        return;
      }
      if (isGridActive() && isMobileSheet()) {
        return;
      }
      restorePortal(panel);
      if (overlay) {
        restorePortal(overlay);
      }
    }

    function closeThemePanel() {
      const themePanel = document.querySelector(".theme-panel");
      const themeToggle = document.querySelector(".theme-toggle");
      const themeOverlay = document.querySelector(".theme-overlay");

      if (themePanel && !themePanel.hasAttribute("hidden")) {
        themePanel.setAttribute("hidden", "");
        if (themeOverlay) {
          themeOverlay.setAttribute("hidden", "");
        }
        if (themeToggle) {
          themeToggle.setAttribute("aria-expanded", "false");
        }
        document.documentElement.removeAttribute("data-theme-panel-open");
      }
    }

    function closeLanguagePanel() {
      const languagePanel = document.querySelector(".language-panel");
      const languageToggle = document.querySelector(".language-toggle");
      const languageOverlay = document.querySelector(".language-overlay");

      if (languagePanel && !languagePanel.hasAttribute("hidden")) {
        languagePanel.setAttribute("hidden", "");
        if (languageOverlay) {
          languageOverlay.setAttribute("hidden", "");
        }
        if (languageToggle) {
          languageToggle.setAttribute("aria-expanded", "false");
        }
      }
    }

    function resetPanelStyles() {
      if (!panel) {
        return;
      }
      panel.style.transform = "";
      panel.style.transition = "";
      if (overlay) {
        overlay.style.opacity = "";
        overlay.style.transition = "";
      }
    }

    function teardownPortal() {
      resetPanelStyles();
      syncSettingsPortal();
    }

    function closePanel() {
      if (!panel || panel.hasAttribute("hidden")) {
        return;
      }

      // The mobile sheet is portaled to <body>. Restoring the portal moves the
      // panel in the DOM, which cancels a running CSS transition — so a straight
      // teardown snaps the sheet shut. Let the slide-out finish first, then tear
      // down. Desktop (not portaled) and reduced-motion tear down immediately.
      var reduceMotion =
        document.documentElement.getAttribute("data-effect-reduced-motion") ===
          "on" ||
        (window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      var animateOut =
        panel.classList.contains("dropdown-panel--portal") && !reduceMotion;

      panel.setAttribute("hidden", "");
      if (overlay) {
        overlay.setAttribute("hidden", "");
      }
      toggle.setAttribute("aria-expanded", "false");
      setSettingsPanelOpenState(false);

      if (!animateOut) {
        teardownPortal();
        return;
      }

      var done = false;
      var timer = null;
      var finish = function () {
        if (done) {
          return;
        }
        done = true;
        panel.removeEventListener("transitionend", onEnd);
        if (timer) {
          window.clearTimeout(timer);
        }
        // A fast re-open before the slide-out ends cancels the teardown.
        if (panel.hasAttribute("hidden")) {
          teardownPortal();
        }
      };
      var onEnd = function (e) {
        if (
          e.target === panel &&
          (e.propertyName === "transform" || e.propertyName === "opacity")
        ) {
          finish();
        }
      };
      panel.addEventListener("transitionend", onEnd);
      // Fallback if transitionend never arrives (interrupted mid-flight, etc.).
      timer = window.setTimeout(finish, 500);
    }

    function togglePanel(e) {
      e.stopPropagation();
      const isHidden = panel.hasAttribute("hidden");

      if (isHidden) {
        closeThemePanel();
        closeLanguagePanel();
        panel.removeAttribute("hidden");
        if (overlay) {
          overlay.removeAttribute("hidden");
        }
        toggle.setAttribute("aria-expanded", "true");
        setSettingsPanelOpenState(true);
        resetPanelStyles();
        syncSettingsPortal();
      } else {
        closePanel();
      }
    }

    toggle.addEventListener("click", togglePanel);

    // Entering the terminal layout plays the boot theater — the panel the
    // user just picked it from would otherwise sit visible, unanimated,
    // while the chrome prints around it. The command has run: close it.
    window.addEventListener("theme:layout-changed", function (e) {
      if (e.detail && e.detail.layout === "terminal") {
        closePanel();
      }
    });

    if (overlay) {
      overlay.addEventListener("click", closePanel);
    }

    document.addEventListener("click", function (e) {
      if (!toggle.contains(e.target) && !panel.contains(e.target)) {
        closePanel();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel && !panel.hasAttribute("hidden")) {
        // Consume the event so the terminal layout's exit-on-Escape handler,
        // which may run after us on this same keydown, doesn't also fire.
        e.preventDefault();
        closePanel();
      }
    });

    const syncOnStateChange = function () {
      if (!panel.hasAttribute("hidden")) {
        syncSettingsPortal();
      }
    };
    window.addEventListener("resize", syncOnStateChange);
    window.addEventListener("scroll", syncOnStateChange, { passive: true });

    const gridObserver = new MutationObserver(function () {
      syncOnStateChange();
    });
    gridObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-grid-overlay"],
    });

    // Touch support for swipe-to-close on mobile bottom sheet
    let touchStartY = 0;
    let touchCurrentY = 0;

    if (panel && overlay) {
      panel.addEventListener("touchstart", function (e) {
        touchStartY = e.changedTouches[0].screenY;
        panel.style.transition = "none";
        overlay.style.transition = "none";
      });

      panel.addEventListener("touchmove", function (e) {
        touchCurrentY = e.changedTouches[0].screenY;
        const deltaY = touchCurrentY - touchStartY;

        // Only allow dragging downwards
        if (deltaY > 0) {
          e.preventDefault();
          panel.style.transform = `translateY(${deltaY}px)`;

          // Update overlay opacity based on drag distance
          const panelHeight = panel.getBoundingClientRect().height;
          const maxDeltaY = window.innerHeight - panelHeight - 8; // 8px from bottom
          const opacity = 1 - deltaY / maxDeltaY;
          overlay.style.opacity = Math.max(opacity, 0);
        }
      });

      panel.addEventListener("touchend", function (_e) {
        const deltaY = touchCurrentY - touchStartY;

        panel.style.transition = "transform 0.3s ease-in-out";
        overlay.style.transition = "opacity 0.3s ease-in-out";

        // Close if dragged down more than 50px
        if (deltaY > 50) {
          closePanel();
        } else {
          // Return to original position
          panel.style.transform = "translateY(0)";
          overlay.style.opacity = "1";
        }

        touchStartY = 0;
        touchCurrentY = 0;
      });
    }
  });
})();
