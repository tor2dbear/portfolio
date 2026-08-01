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

    // Keep the trigger's accessible name in step with what it opens: the primary
    // menu at the nav breakpoint (where the panel also carries the nav), plain
    // settings above it. CSS swaps the glyph at the same width but can't touch
    // aria-label, so mirror it here — on load and on width changes — for both
    // the popover and legacy paths.
    var navMedia = window.matchMedia("(max-width: 47.9375em)");
    function syncToggleLabel() {
      var label = navMedia.matches
        ? toggle.getAttribute("data-label-menu")
        : toggle.getAttribute("data-label-settings");
      if (label) {
        toggle.setAttribute("aria-label", label);
      }
    }
    syncToggleLabel();
    if (navMedia.addEventListener) {
      navMedia.addEventListener("change", syncToggleLabel);
    } else if (navMedia.addListener) {
      navMedia.addListener(syncToggleLabel);
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
      // The scrim is this real .settings-overlay element, NOT the popover
      // ::backdrop: on iOS Safari a top-layer pseudo-element recolours late on a
      // light/dark swap, so its page-coloured top bar fell out of step with the
      // page. A real element inherits normally and transitions in sync. Move it
      // to <body> so its fixed positioning is viewport-relative (no header
      // ancestor transform can trap it) and it stacks predictably beneath the
      // top-layer panel (which always paints above normal DOM).
      if (overlay && overlay.parentNode !== document.body) {
        document.body.appendChild(overlay);
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

      // The scrim lives on a sibling element now (see above), so its drag state
      // has to be driven in lockstep with the panel's: --sheet-drag fades the
      // scrim/blur as the sheet is pulled down, and .is-dragging freezes its
      // transition while the finger is down. Mirror every set onto the overlay.
      function setSheetDrag(value) {
        panel.style.setProperty("--sheet-drag", value);
        if (overlay) {
          overlay.style.setProperty("--sheet-drag", value);
        }
      }
      function clearSheetDrag() {
        // Panel only — the overlay's --sheet-drag is owned by openOverlay /
        // closeOverlay (and the live drag). Clearing it here would undo the
        // fade-out closeOverlay sets, snapping the scrim back to full opacity.
        panel.style.removeProperty("--sheet-drag");
      }
      function setSheetDragging(on) {
        panel.classList.toggle("is-dragging", on);
        if (overlay) {
          overlay.classList.toggle("is-dragging", on);
        }
      }

      // Open the scrim: un-hide and clear any closing/drag state so it fades in
      // fresh (base opacity:0 -> open, via @starting-style in the CSS).
      function openOverlay() {
        if (!overlay) {
          return;
        }
        overlay.classList.remove("is-dragging");
        overlay.style.transition = "";
        overlay.style.removeProperty("--sheet-drag");
        overlay.removeAttribute("hidden");
      }

      // Close the scrim in step with the sheet's popover exit: fade it out first
      // (opacity/blur -> 0 via --sheet-drag), then set [hidden] once the
      // transition ends. Setting [hidden] immediately would display:none the
      // element before its transition could run, snapping the wash away while the
      // sheet is still sliding out. Guarded by openGeneration so a quick reopen
      // doesn't hide the freshly reopened scrim.
      function closeOverlay() {
        if (!overlay || overlay.hasAttribute("hidden")) {
          return;
        }
        overlay.classList.remove("is-dragging");
        overlay.style.transition = "";
        overlay.style.setProperty("--sheet-drag", "1");
        var gen = openGeneration;
        var done = false;
        var timer = null;
        var onEnd = null;
        var finish = function () {
          if (done) {
            return;
          }
          done = true;
          overlay.removeEventListener("transitionend", onEnd);
          if (timer) {
            window.clearTimeout(timer);
          }
          // Reopened since this close armed? leave the now-open scrim alone.
          if (openGeneration !== gen) {
            return;
          }
          overlay.setAttribute("hidden", "");
          overlay.style.removeProperty("--sheet-drag");
        };
        onEnd = function (ev) {
          if (ev.target === overlay && ev.propertyName === "opacity") {
            finish();
          }
        };
        overlay.addEventListener("transitionend", onEnd);
        // Fallback if transitionend never arrives (desktop keeps the overlay
        // display:none, reduced-motion, an interrupted close, etc.).
        timer = window.setTimeout(finish, 500);
      }

      var sheetExpanded = false;
      // The resting outer height (px), measured while the sheet is actually at
      // rest (on open, and at the start of a rest drag). Reused when a drag
      // starts from the expanded state, where the flex-stretched body can no
      // longer report the content-hugging height.
      var restHeightPx = 0;
      // Bumped on every open/close so a deferred callback armed for one open
      // (e.g. the drag-dismiss fallback) can detect it now belongs to a stale
      // instance and bail instead of acting on a freshly reopened panel.
      var openGeneration = 0;

      panel.addEventListener("toggle", function (e) {
        var open = e.newState === "open";
        openGeneration++;
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        setSettingsPanelOpenState(open);
        // Show/hide the real scrim with the panel. On desktop the CSS keeps it
        // display:none, so this is a no-op there — no scrim on the anchored
        // dropdown, only on the mobile bottom sheet. Close fades out first (see
        // closeOverlay) instead of snapping [hidden] on mid-slide.
        if (open) {
          openOverlay();
          positionPanel();
          // Capture the true resting height now, while the sheet hugs its
          // content (before any expand stretches the body).
          restHeightPx = Math.round(panel.getBoundingClientRect().height);
          updateClipCue();
        } else {
          // Reset to the resting detent so the next open starts collapsed, and
          // rewind the body to the top — the resting sheet doesn't scroll, so a
          // stale scrollTop would leave the first controls clipped on reopen.
          // Cancel any in-flight settle and clear its inline sizing too, so a
          // reopen before the fallback fires doesn't render at (and cache) a
          // stale detent height, then snap when the old cleanup runs.
          sheetExpanded = false;
          panel.classList.remove("is-expanded");
          panel.classList.remove("is-clipped");
          cancelPendingSizeCleanup();
          // Release an in-flight drag too (Escape / grid-switch can close the
          // sheet mid-drag); otherwise a stuck dragPointerId rejects every
          // pointerdown after reopening and the detent interaction is dead.
          if (dragPointerId !== null) {
            try {
              panel.releasePointerCapture(dragPointerId);
            } catch (err) {
              /* not captured */
            }
            dragPointerId = null;
          }
          dragEngaged = false;
          dragDelta = 0;
          setSheetDragging(false);
          panel.style.height = "";
          panel.style.maxHeight = "";
          panel.style.transform = "";
          panel.style.transition = "";
          clearSheetDrag();
          closeOverlay();
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

      // A viewport change (e.g. rotation) makes the cached resting height stale.
      // Re-measure it when the sheet is at rest; when it's expanded the resting
      // height can't be measured, so invalidate it and let restingHeight()
      // recompute from content on the next collapse.
      window.addEventListener("resize", function () {
        if (!panel.matches(":popover-open")) {
          return;
        }
        restHeightPx = sheetExpanded
          ? 0
          : Math.round(panel.getBoundingClientRect().height);
        updateClipCue();
      });

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
      var dragCanExpand = false; // is there overflow to reveal by expanding?
      var suppressNextClick = false;
      // Geometry snapshot taken when a drag engages, so the live resize and the
      // release decision share one coordinate frame.
      var dragStartMax = 0; // sheet outer height at engage (px)
      var dragRestPx = 0; // resting detent height (px)
      var dragFullPx = 0; // expanded detent height (px)

      function isMobileSheet() {
        return (
          panel.matches(":popover-open") &&
          !window.matchMedia("(min-width: 30em)").matches
        );
      }

      // Panel padding + borders (px) — the chrome around the scrollable body.
      function panelChromeV() {
        var cs = getComputedStyle(panel);
        return (
          parseFloat(cs.paddingTop) +
          parseFloat(cs.paddingBottom) +
          parseFloat(cs.borderTopWidth) +
          parseFloat(cs.borderBottomWidth)
        );
      }

      // The body's intrinsic content height (px), reliable even while the body
      // is flex-stretched to the expanded detent (where scrollHeight reports the
      // stretched client height, not the content). Measures the last child's
      // extent from the body's content top instead.
      function bodyContentHeight() {
        if (!panelBody) {
          return 0;
        }
        var last = panelBody.lastElementChild;
        if (!last) {
          return panelBody.scrollHeight;
        }
        var bottom =
          last.getBoundingClientRect().bottom -
          panelBody.getBoundingClientRect().top +
          panelBody.scrollTop +
          (parseFloat(getComputedStyle(last).marginBottom) || 0);
        return Math.round(bottom);
      }

      // The resting outer height (px): the sheet hugs its content up to the rest
      // cap (82dvh). Prefer the value measured while actually at rest; fall back
      // to the intrinsic content height (used when the cache was invalidated,
      // e.g. after a resize while expanded). Both are clamped to the cap.
      function restingHeight() {
        var cap = sheetBounds().rest;
        if (restHeightPx > 0) {
          return Math.min(restHeightPx, cap);
        }
        return Math.min(bodyContentHeight() + panelChromeV(), cap);
      }

      // Resolve a CSS length token to pixels. getPropertyValue on a custom
      // property returns the raw token (e.g. "1.5rem", not "24px"), so a rem
      // value must be scaled by the root font size rather than parseFloat'd
      // straight — otherwise "1.5rem" reads as 1.5px.
      function tokenToPx(prop, fallback) {
        var raw = getComputedStyle(document.documentElement)
          .getPropertyValue(prop)
          .trim();
        var n = parseFloat(raw);
        if (isNaN(n)) {
          return fallback;
        }
        if (raw.indexOf("rem") !== -1) {
          var root =
            parseFloat(getComputedStyle(document.documentElement).fontSize) ||
            16;
          return n * root;
        }
        return n;
      }

      // The two detent heights (px) the CSS caps the sheet at: rest = 82dvh,
      // full = 100dvh - --spacing-24. innerHeight stands in for dvh. Keep the
      // 0.82 rest fraction in sync with --sheet-max in settings-dropdown.css.
      function sheetBounds() {
        var vh = window.innerHeight || 0;
        var gap = tokenToPx("--spacing-24", 24);
        return { rest: Math.round(vh * 0.82), full: Math.round(vh - gap) };
      }

      // Show the bottom-fade overflow cue only when the resting sheet still has
      // content below the fold — i.e. not expanded, not mid-drag, and there's
      // room left to scroll (a mouse/keyboard user can scroll the resting body,
      // so drop the cue once they reach the end). Re-run on body scroll.
      function updateClipCue() {
        var clipped = false;
        if (panelBody && panel.matches(":popover-open")) {
          // Purely whether there's more content below the fold right now — not
          // tied to the detent flag, so it tracks a live resize drag (the flag
          // only flips at release). Fades in/out via the ::after opacity.
          var remaining =
            panelBody.scrollHeight -
            panelBody.clientHeight -
            panelBody.scrollTop;
          clipped = remaining > 1;
        }
        panel.classList.toggle("is-clipped", clipped);
      }

      function setDragTransition(on) {
        panel.style.transition = on ? "" : "none";
      }

      // Teardown for the in-flight settle cleanup (below), so a new drag can
      // cancel the previous settle's pending listener + fallback timer before
      // they fire mid-gesture and wipe the live inline size.
      var pendingSizeCleanup = null;

      function cancelPendingSizeCleanup() {
        if (pendingSizeCleanup) {
          pendingSizeCleanup();
        }
      }

      // After a detent settle animates, clear the inline height/max-height so
      // CSS controls the sheet again (the resting cap hugs content; .is-expanded
      // holds the full height) — otherwise a stale inline px would survive a
      // rotation or content change.
      function clearInlineSizeAfterTransition() {
        cancelPendingSizeCleanup(); // supersede any previous settle
        var done = false;
        var teardown = function () {
          if (done) {
            return;
          }
          done = true;
          panel.removeEventListener("transitionend", onHeightEnd);
          window.clearTimeout(timer);
          if (pendingSizeCleanup === teardown) {
            pendingSizeCleanup = null;
          }
        };
        var clear = function () {
          if (done) {
            return;
          }
          teardown();
          panel.style.height = "";
          panel.style.maxHeight = "";
          // Layout is final now — re-evaluate whether the resting sheet clips.
          updateClipCue();
        };
        var onHeightEnd = function (ev) {
          if (ev.target === panel && ev.propertyName === "height") {
            clear();
          }
        };
        panel.addEventListener("transitionend", onHeightEnd);
        var timer = window.setTimeout(clear, 500); // fallback if end is missed
        // A superseding drag calls this to drop the listener/timer WITHOUT
        // clearing (the new gesture now owns the inline size).
        pendingSizeCleanup = teardown;
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
          // A settle from a previous drag may still be animating — drop its
          // pending cleanup so its fallback timer can't wipe this drag's size.
          cancelPendingSizeCleanup();
          // Keep the overflow fade through the drag (it re-evaluates on settle)
          // so it doesn't blink out the moment you touch the sheet.
          setDragTransition(false);
          setSheetDragging(true); // freezes the scrim's transition too
          // Snapshot the geometry the live resize + release decision work in:
          // the outer height at grab, the full detent, and the resting height
          // (measured when already at rest, computed from content otherwise).
          dragStartMax = Math.round(panel.getBoundingClientRect().height);
          dragFullPx = sheetBounds().full;
          // Whether expanding would actually reveal anything: measured now, while
          // the body is still at its resting layout (before the resize below).
          // Already expanded → the body scrolls, so treat as expandable.
          dragCanExpand =
            sheetExpanded ||
            (!!panelBody &&
              panelBody.scrollHeight > panelBody.clientHeight + 1);
          if (!sheetExpanded) {
            // At rest the measured height IS the resting height — keep it fresh
            // for a later collapse that starts from the expanded state.
            restHeightPx = dragStartMax;
          }
          dragRestPx = sheetExpanded ? restingHeight() : dragStartMax;
          try {
            panel.setPointerCapture(dragPointerId);
          } catch (err) {
            /* capture unsupported */
          }
        }
        dragDelta = delta;
        e.preventDefault();
        // Follow the finger with an explicit height (not max-height, which
        // wouldn't stretch past the content): pulling up grows the sheet toward
        // full, pulling down shrinks it toward rest; below rest it becomes the
        // dismiss track (hold at rest height + slide down, fading the scrim).
        var proposed = dragStartMax - delta;
        panel.style.maxHeight = "none";
        if (proposed >= dragRestPx) {
          panel.style.transform = "";
          panel.style.height = Math.min(proposed, dragFullPx) + "px";
          setSheetDrag("0");
        } else {
          panel.style.height = dragRestPx + "px";
          var off = dragRestPx - proposed;
          panel.style.transform = "translateY(" + off + "px)";
          setSheetDrag(String(Math.min(1, off / (dragRestPx || 1))));
        }
        // Re-evaluate the overflow fade against the sheet's new live height, so
        // it fades in as a collapse crosses into overflow (not only on release).
        updateClipCue();
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
        // otherwise synthesize on the control it started on. Only a pointerup
        // synthesizes that click; a pointercancel doesn't, so don't leave the
        // flag armed to swallow the user's next real click/keyboard activation.
        suppressNextClick = e.type === "pointerup";
        var dismissThreshold = Math.min(120, (dragRestPx || 480) * 0.25);
        var action = decideSheetTarget(
          dragStartMax - delta,
          dragRestPx,
          dragFullPx,
          dismissThreshold
        );
        // The drag follows the finger, but don't SETTLE expanded when there's
        // nothing to reveal — otherwise a compact sheet rests as a near-empty
        // fullscreen. Fall back to rest instead.
        if (action === "expand" && !dragCanExpand) {
          action = "rest";
        }
        // A downward pull past the dismiss threshold closes the sheet from
        // either detent: from rest directly, and from fullscreen once it has
        // been dragged all the way down through rest (decideSheetTarget already
        // requires clearing rest − dismissThreshold, so a small collapse still
        // just settles at rest).
        // Re-enable the CSS transitions (both the panel's and, via removing the
        // class, the ::backdrop's) so the tail motion animates.
        setSheetDragging(false);
        setDragTransition(true);
        void panel.offsetHeight; // flush so the dragged position is the start
        if (action === "dismiss") {
          // Slide the rest of the way down from the finger position and fade the
          // scrim fully out in sync, then close.
          var settled = false;
          var dismissGen = openGeneration;
          var finish = function () {
            if (settled) {
              return;
            }
            settled = true;
            panel.removeEventListener("transitionend", onEnd);
            // If the panel was closed and reopened since this dismiss armed, the
            // callback belongs to a stale instance — don't hidePopover() (which
            // would close the new one) or touch its inline styles.
            if (openGeneration !== dismissGen) {
              return;
            }
            try {
              panel.hidePopover();
            } catch (err) {
              /* already closed */
            }
            // Clear the inline overrides so the next open starts clean
            // (::backdrop + @starting-style drive the enter animation).
            panel.style.transform = "";
            panel.style.transition = "";
            panel.style.height = "";
            panel.style.maxHeight = "";
            clearSheetDrag();
          };
          var onEnd = function (ev) {
            if (ev.target === panel && ev.propertyName === "transform") {
              finish();
            }
          };
          panel.addEventListener("transitionend", onEnd);
          window.setTimeout(finish, 500); // fallback if transitionend is missed
          panel.style.transform = "translateY(100%)";
          setSheetDrag("1");
          return;
        }
        panel.style.transform = "";
        setSheetDrag("0");
        // Leave max-height unconstrained (it's "none" from the drag) through the
        // height transition — a none→length max-height isn't interpolated, so
        // reapplying the cap now would clamp a high dragged height to rest before
        // the height can animate (a snap). clearInlineSizeAfterTransition clears
        // both once the height settles.
        if (action === "expand") {
          sheetExpanded = true;
          panel.classList.add("is-expanded");
          // Animate the explicit height the rest of the way to full, then hand
          // it back to the class (which holds the full height).
          panel.style.height = dragFullPx + "px";
        } else {
          // "rest": snap-back from rest, or collapse from expanded. Reset the
          // body to the top, animate to the hug height, then hand back to the
          // resting cap.
          sheetExpanded = false;
          panel.classList.remove("is-expanded");
          if (panelBody) {
            panelBody.scrollTop = 0;
          }
          panel.style.height = restingHeight() + "px";
        }
        clearInlineSizeAfterTransition();
      }

      panel.addEventListener("pointerdown", function (e) {
        if (dragPointerId !== null || !isMobileSheet()) {
          return;
        }
        if (e.pointerType === "mouse") {
          return; // touch/pen only — mouse users have light-dismiss
        }
        suppressNextClick = false; // fresh gesture — drop any stale suppression
        // Expanded + scrolled: leave a gesture that starts INSIDE the scrollable
        // body to the browser (it's scrolling). But the pinned handle/top
        // padding (target is the panel, not the body) must always be able to
        // collapse the sheet, even when the content is scrolled down.
        if (
          sheetExpanded &&
          panelBody &&
          panelBody.scrollTop > 0 &&
          panelBody.contains(e.target)
        ) {
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

      // A mouse/keyboard user can scroll the resting body; re-evaluate the
      // overflow cue so it lifts once they reach the end.
      if (panelBody) {
        panelBody.addEventListener("scroll", updateClipCue, { passive: true });
      }

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

    // No touch swipe-to-close on the legacy (no-Popover) fallback: it fought the
    // sheet's own body scroll — a downward swipe to scroll back up toward the
    // nav read as a dismiss — and the fallback already closes via the overlay,
    // Escape, and an outside click. The modern popover path keeps its full
    // drag-to-dismiss / expand detents (initPopoverPanel); this swipe only ever
    // ran where the Popover API is absent, which is effectively nowhere now.
  });
})();
