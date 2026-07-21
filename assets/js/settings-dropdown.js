/**
 * Settings Dropdown (XS)
 * Handles opening/closing the combined settings panel.
 */

(function () {
  "use strict";

  // Pure decision for where a released detent drag settles, from the sheet's
  // proposed outer height (px) after following the finger and the two detent
  // heights. Kept DOM-free for unit testing (see settings-sheet.test.js).
  //   - pulled well below the resting height (past dismissThreshold) → dismiss;
  //   - at or above the midpoint between rest and full → expand;
  //   - otherwise settle at rest ("rest" covers both a snap-back from rest and
  //     a collapse from expanded).
  function decideSheetTarget(proposedPx, restPx, fullPx, dismissThreshold) {
    if (proposedPx <= restPx - dismissThreshold) {
      return "dismiss";
    }
    if (proposedPx >= (restPx + fullPx) / 2) {
      return "expand";
    }
    return "rest";
  }

  // Testing seam.
  window.__settingsSheetInternals = {
    decideSheetTarget: decideSheetTarget,
  };

  document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.querySelector('[data-js="settings-toggle"]');
    const panel = document.querySelector('[data-js="settings-panel"]');
    const overlay = document.querySelector('[data-js="settings-overlay"]');

    if (!toggle || !panel) {
      return;
    }

    // --- Popover prototype (progressive enhancement) ---------------------
    // Where the Popover API is supported, upgrade the panel to a native
    // top-layer popover: native open/close/light-dismiss/focus, ::backdrop as
    // the scrim, and CSS-driven enter/exit. The whole legacy path below (portal,
    // outside-click, Escape, overlay element) is skipped in that case. Browsers
    // without popover fall through to the legacy implementation unchanged.
    var supportsPopover =
      typeof panel.showPopover === "function" &&
      Object.prototype.hasOwnProperty.call(
        window.HTMLElement.prototype,
        "popover"
      );

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
        // Restore the closed [hidden] state. Without the popover attribute the
        // panel is a plain element again and would otherwise render inline. In
        // the terminal layout settings are edited via the `set` command (the
        // toggle is hidden there), so the DOM panel stays hidden.
        panel.setAttribute("hidden", "");
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

      // The mobile sheet's internal scroll container; the detent drag grows/
      // shrinks the sheet around it. Absent on the desktop dropdown path.
      var panelBody = panel.querySelector('[data-js="settings-panel-body"]');
      var sheetExpanded = false;

      panel.addEventListener("toggle", function (e) {
        var open = e.newState === "open";
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        setSettingsPanelOpenState(open);
        if (open) {
          positionPanel();
        } else {
          // Reset to the resting detent so the next open starts collapsed, and
          // rewind the body to the top — the resting sheet doesn't scroll, so a
          // stale scrollTop would leave the first controls clipped on reopen.
          sheetExpanded = false;
          panel.classList.remove("is-expanded");
          if (panelBody) {
            panelBody.scrollTop = 0;
          }
        }
      });

      var reposition = function () {
        if (panel.matches(":popover-open")) {
          positionPanel();
        }
      };
      window.addEventListener("resize", reposition);
      window.addEventListener("scroll", reposition, { passive: true });

      // --- Detent drag for the mobile bottom sheet -------------------------
      // Only the sheet layout (< 30em, open) is draggable; the desktop
      // dropdown is left alone. The resting sheet is a single drag surface
      // (its body doesn't scroll), so a drag ANYWHERE drives the detents: a
      // downward pull follows the finger and dismisses past a threshold, an
      // upward pull expands the sheet toward full height (when there's overflow
      // to reveal). Once expanded the body scrolls; only a downward pull that
      // starts at the very top (scrollTop 0) is reclaimed to collapse back to
      // rest — mid-scroll gestures are left to the browser. Expand/collapse
      // snap on release; only the dismiss pull tracks the finger. A drag that
      // engages suppresses the click it would otherwise fire on a control.
      var DRAG_ENGAGE = 6; // px of travel before we treat it as a drag
      var dragPointerId = null;
      var dragStartY = 0;
      var dragDelta = 0;
      var dragEngaged = false;
      var suppressNextClick = false;
      // Geometry snapshot taken when a drag engages, so the live resize and the
      // release decision share one coordinate frame.
      var dragStartMax = 0; // sheet outer height at engage (px)
      var dragRestPx = 0; // resting detent height (px)
      var dragFullPx = 0; // expanded detent height (px)
      var dragResizable = false; // can the sheet grow/shrink (vs dismiss-only)?

      function isMobileSheet() {
        return (
          panel.matches(":popover-open") &&
          !window.matchMedia("(min-width: 30em)").matches
        );
      }

      // Expanding only helps when the resting sheet clips its content — i.e. the
      // body has overflow to reveal. No overflow → nothing to expand into.
      function sheetCanExpand() {
        return (
          !!panelBody && panelBody.scrollHeight > panelBody.clientHeight + 1
        );
      }

      // The two detent heights (px) the CSS caps the sheet at: rest = 82dvh,
      // full = 100dvh - --spacing-24. innerHeight stands in for dvh.
      function sheetBounds() {
        var vh = window.innerHeight || 0;
        var gap =
          parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--spacing-24"
            )
          ) || 24;
        return { rest: Math.round(vh * 0.82), full: Math.round(vh - gap) };
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
          // Engage on travel in either direction (down = dismiss/collapse,
          // up = expand); a tiny move stays a tap.
          if (Math.abs(delta) < DRAG_ENGAGE) {
            return;
          }
          // Expanded + upward from the top means the user is scrolling into the
          // content — release the gesture back to the browser rather than drag.
          if (sheetExpanded && delta < 0) {
            dragPointerId = null;
            return;
          }
          dragEngaged = true;
          setDragTransition(false);
          panel.classList.add("is-dragging"); // freezes the ::backdrop transition
          // Snapshot the geometry the live resize + release decision work in.
          // Use the measured height for the current detent (accurate) and the
          // computed bound for the other.
          var bounds = sheetBounds();
          dragStartMax = Math.round(panel.getBoundingClientRect().height);
          dragResizable = sheetExpanded || sheetCanExpand();
          dragRestPx = sheetExpanded ? bounds.rest : dragStartMax;
          dragFullPx = sheetExpanded ? dragStartMax : bounds.full;
          try {
            panel.setPointerCapture(dragPointerId);
          } catch (err) {
            /* capture unsupported */
          }
        }
        dragDelta = delta;
        e.preventDefault();
        if (dragResizable) {
          // Follow the finger: pulling up grows the sheet toward full, pulling
          // down shrinks it toward rest; below rest it becomes the dismiss track
          // (slide down + fade the scrim). proposed is the sheet's outer height.
          var proposed = dragStartMax - delta;
          if (proposed >= dragRestPx) {
            panel.style.transform = "";
            panel.style.maxHeight = Math.min(proposed, dragFullPx) + "px";
            panel.style.setProperty("--sheet-drag", "0");
          } else {
            panel.style.maxHeight = dragRestPx + "px";
            var off = dragRestPx - proposed;
            panel.style.transform = "translateY(" + off + "px)";
            panel.style.setProperty(
              "--sheet-drag",
              String(Math.min(1, off / (dragRestPx || 1)))
            );
          }
          return;
        }
        // Not resizable (content fits at rest): only a downward dismiss pull
        // follows the finger; an upward pull does nothing.
        if (delta > 0) {
          panel.style.transform = "translateY(" + delta + "px)";
          panel.style.setProperty(
            "--sheet-drag",
            String(Math.min(1, delta / (panel.offsetHeight || 1)))
          );
        } else {
          panel.style.transform = "";
          panel.style.setProperty("--sheet-drag", "0");
        }
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
        // The gesture became a drag, not a tap — swallow the click it would
        // otherwise synthesize on the control it started on.
        suppressNextClick = true;
        var dismissThreshold = Math.min(120, (dragRestPx || 480) * 0.25);
        var action;
        if (dragResizable) {
          action = decideSheetTarget(
            dragStartMax - delta,
            dragRestPx,
            dragFullPx,
            dismissThreshold
          );
        } else {
          // Content fits at rest: only a downward dismiss pull, no detents.
          action =
            delta > Math.min(120, panel.offsetHeight * 0.25)
              ? "dismiss"
              : "rest";
        }
        // Re-enable the CSS transitions (both the panel's and, via removing the
        // class, the ::backdrop's) so the tail motion animates.
        panel.classList.remove("is-dragging");
        setDragTransition(true);
        void panel.offsetHeight; // flush so the dragged position is the start
        if (action === "dismiss") {
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
            panel.style.maxHeight = "";
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
          return;
        }
        if (action === "expand") {
          sheetExpanded = true;
          panel.classList.add("is-expanded");
        } else {
          // "rest": snap-back from rest, or collapse from expanded. Reset the
          // body to the top so the resting (non-scrolling) sheet never starts
          // mid-content with the beginning clipped.
          sheetExpanded = false;
          panel.classList.remove("is-expanded");
          if (panelBody) {
            panelBody.scrollTop = 0;
          }
        }
        // Hand the height back to the class (which animates via max-height) and
        // clear the drag overrides / restore the full scrim.
        panel.style.maxHeight = "";
        panel.style.transform = "";
        panel.style.setProperty("--sheet-drag", "0");
      }

      panel.addEventListener("pointerdown", function (e) {
        if (dragPointerId !== null || !isMobileSheet()) {
          return;
        }
        if (e.pointerType === "mouse") {
          return; // touch/pen only — mouse users have light-dismiss
        }
        suppressNextClick = false; // fresh gesture — drop any stale suppression
        // Expanded: the body scrolls, so only arm a drag when it's at the very
        // top — a downward pull from there collapses; mid-scroll is the
        // browser's to scroll. At rest the whole sheet is the drag surface.
        if (sheetExpanded && panelBody && panelBody.scrollTop > 0) {
          return;
        }
        dragPointerId = e.pointerId;
        dragStartY = e.clientY;
        dragDelta = 0;
        dragEngaged = false;
      });
      panel.addEventListener("pointermove", onDragMove);
      panel.addEventListener("pointerup", endDrag);
      panel.addEventListener("pointercancel", endDrag);

      // A drag that engaged (moved past the threshold) must not also fire a
      // click on whatever control it started on — swallow the synthesized click
      // in the capture phase before it reaches the button/radio.
      panel.addEventListener(
        "click",
        function (e) {
          if (suppressNextClick) {
            suppressNextClick = false;
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true
      );

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
