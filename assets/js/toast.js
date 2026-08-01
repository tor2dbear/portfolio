/**
 * Toast — lightweight setting-change confirmations
 * Centred top of viewport, icon + two-line layout (title + value), auto-dismiss.
 *
 * API:  window.Toast.show(title, value, options?)
 *       title    — category label  (e.g. "Läge")
 *       value    — selected option  (e.g. "Mörkt")
 *       options.icon     — sprite symbol ID (e.g. "icon-mode-micro")
 *       options.duration — ms before auto-hide (default 2500)
 *
 * Pending-toast (survives navigation):
 *   localStorage.setItem('pending-toast', JSON.stringify({ category, value, icon }))
 *   → shown and removed automatically on next page load.
 */
(function () {
  'use strict';

  var PENDING_KEY = 'pending-toast';
  var DEFAULT_DURATION = 2500;
  var SWIPE_DISMISS_THRESHOLD = 50;
  var el = null;
  var iconWrap = null;
  var textWrap = null;
  var titleEl = null;
  var valueEl = null;
  var hideTimer = null;
  // Pending teardown from the last hide() — tracked so a superseding show() can
  // cancel it before it fires. Otherwise the stale animationend listener / 400ms
  // fallback would hidePopover() the reused element out from under a new toast,
  // leaving it flagged visible but removed from the top layer (so, invisible).
  var hideListener = null;
  var hideFallbackTimer = null;
  var spriteBase = '';
  var swipeStartX = 0;
  var swipeStartY = 0;
  var swipeTracking = false;

  function getUseHref(use) {
    return use.getAttribute('href') ||
      use.getAttribute('xlink:href') ||
      (use.href && use.href.baseVal) ||
      use.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ||
      '';
  }

  function inferSpriteBaseFromScripts() {
    var scripts = document.querySelectorAll('script[src]');
    for (var i = scripts.length - 1; i >= 0; i -= 1) {
      var src = scripts[i].getAttribute('src') || scripts[i].src || '';
      if (!src) {continue;}
      if (src.indexOf('/js') !== -1 || src.indexOf('js.') !== -1) {
        try {
          return new URL('img/svg/sprite.svg?v=20260211b', src).toString();
        } catch (e) {
          // Ignore malformed script src values
        }
      }
    }
    return '/img/svg/sprite.svg?v=20260211b';
  }

  /** Resolve the sprite.svg base path from an existing <use> in the DOM */
  function getSpriteBase() {
    if (spriteBase) {return spriteBase;}
    var uses = document.querySelectorAll('svg use');
    for (var i = 0; i < uses.length; i += 1) {
      var href = getUseHref(uses[i]);
      if (href && href.indexOf('sprite.svg') !== -1) {
        spriteBase = href.split('#')[0];
        break;
      }
    }
    if (!spriteBase) {spriteBase = inferSpriteBaseFromScripts();}
    return spriteBase;
  }

  function resetSwipe() {
    swipeTracking = false;
    swipeStartX = 0;
    swipeStartY = 0;
  }

  function onTouchStart(e) {
    if (!el || !el.classList.contains('toast--visible')) {return;}
    if (!e.changedTouches || !e.changedTouches.length) {return;}
    swipeTracking = true;
    swipeStartX = e.changedTouches[0].clientX;
    swipeStartY = e.changedTouches[0].clientY;
  }

  function onTouchMove(e) {
    if (!swipeTracking || !e.changedTouches || !e.changedTouches.length) {return;}
    var deltaY = e.changedTouches[0].clientY - swipeStartY;
    var deltaX = e.changedTouches[0].clientX - swipeStartX;
    if (deltaY < 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
      e.preventDefault();
    }
  }

  function onTouchEnd(e) {
    if (!swipeTracking || !e.changedTouches || !e.changedTouches.length) {return;}
    var deltaY = e.changedTouches[0].clientY - swipeStartY;
    var deltaX = e.changedTouches[0].clientX - swipeStartX;
    resetSwipe();
    if (deltaY <= -SWIPE_DISMISS_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
      hide();
    }
  }

  function getOrCreate() {
    if (el) {return el;}
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');

    iconWrap = document.createElement('span');
    iconWrap.className = 'toast__icon';

    textWrap = document.createElement('span');
    textWrap.className = 'toast__text';

    titleEl = document.createElement('span');
    titleEl.className = 'toast__title';

    valueEl = document.createElement('span');
    valueEl.className = 'toast__value';

    textWrap.appendChild(titleEl);
    textWrap.appendChild(valueEl);
    el.appendChild(iconWrap);
    el.appendChild(textWrap);
    // The settings sheet is a top-layer popover; a plain z-indexed toast would
    // sit behind it (and its backdrop). Promote the toast to the top layer too
    // (manual = no light-dismiss, we auto-hide) where supported, so it always
    // shows above the sheet. Browsers without popover keep the z-index path —
    // there the sheet isn't a popover either, so nothing renders above it.
    if (typeof el.showPopover === 'function') {
      el.setAttribute('popover', 'manual');
    }
    document.body.appendChild(el);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', resetSwipe, { passive: true });
    return el;
  }

  function setIcon(iconId) {
    if (!iconWrap) {return;}
    iconWrap.innerHTML = '';
    if (!iconId) {
      iconWrap.style.display = 'none';
      el.classList.add('toast--no-icon');
      return;
    }
    iconWrap.style.display = '';
    el.classList.remove('toast--no-icon');
    var base = getSpriteBase();
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(ns, 'use');
    use.setAttribute('href', base + '#' + iconId);
    svg.appendChild(use);
    iconWrap.appendChild(svg);
  }

  function show(title, value, options) {
    var duration = (options && options.duration) || DEFAULT_DURATION;
    var iconId = (options && options.icon) || '';
    var toast = getOrCreate();

    // Reset any in-progress animation, and cancel a pending hide() teardown so
    // its stale animationend/fallback can't hidePopover() this element after we
    // reopen it below.
    clearTimeout(hideTimer);
    cancelPendingHide();
    toast.classList.remove('toast--hiding', 'toast--visible');

    // Reveal in the top layer BEFORE writing the text. A closed popover is
    // display:none, so a polite live-region update made while it's hidden is
    // skipped by screen readers; opening first puts the region in the a11y tree
    // so the confirmation is announced. Re-show even when already open: a
    // settings sheet closed and reopened after this toast would sit above it in
    // the top layer, so drop and re-add to re-promote it to the top.
    if (toast.hasAttribute('popover')) {
      try {
        if (toast.matches(':popover-open')) { toast.hidePopover(); }
        toast.showPopover();
      } catch (e) { /* unsupported / race */ }
    }

    titleEl.textContent = title || '';
    valueEl.textContent = value || '';
    setIcon(iconId);

    // Force reflow so the browser sees the class change
    void toast.offsetWidth;
    toast.classList.add('toast--visible');

    hideTimer = setTimeout(function () {
      hide();
    }, duration);
  }

  // Cancel a pending hide() teardown (its animationend listener + fallback
  // timer) so it can't run after a superseding show() has reopened the toast.
  function cancelPendingHide() {
    if (hideFallbackTimer) {
      clearTimeout(hideFallbackTimer);
      hideFallbackTimer = null;
    }
    if (el && hideListener) {
      el.removeEventListener('animationend', hideListener);
    }
    hideListener = null;
  }

  function hide() {
    if (!el) {return;}
    clearTimeout(hideTimer);
    cancelPendingHide();

    el.classList.remove('toast--visible');
    el.classList.add('toast--hiding');

    var afterHide = function () {
      cancelPendingHide();
      el.classList.remove('toast--hiding');
      // Drop it back out of the top layer once faded out.
      if (el.hasAttribute('popover') && el.matches(':popover-open')) {
        try { el.hidePopover(); } catch (e) { /* already closed */ }
      }
    };

    hideListener = afterHide;
    el.addEventListener('animationend', afterHide, { once: true });
    // Safety fallback
    hideFallbackTimer = setTimeout(afterHide, 400);
  }

  /**
   * Store a toast to be shown after the next page load.
   * Used for actions that trigger navigation (e.g. language switch).
   */
  function queue(title, value, iconId) {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify({
        title: title || '',
        value: value || '',
        icon: iconId || ''
      }));
    } catch (e) {
      // localStorage might be full or unavailable
    }
  }

  // Check for a pending toast left by a previous page
  function checkPendingToast() {
    var raw;
    try {
      raw = localStorage.getItem(PENDING_KEY);
      if (raw) {localStorage.removeItem(PENDING_KEY);}
    } catch (e) {
      return;
    }
    if (raw) {
      try {
        var data = JSON.parse(raw);
        var title = data.title || '';
        var icon = data.icon || '';
        // If a category is specified, read the title and icon from the current page's i18n
        if (data.category) {
          var catEl = document.querySelector('[data-toast-category="' + data.category + '"]');
          if (catEl) {
            title = catEl.getAttribute('data-toast-label') || title;
            icon = catEl.getAttribute('data-toast-icon') || icon;
          }
        }
        setTimeout(function () {
          show(title, data.value, { icon: icon });
        }, 300);
      } catch (e) {
        // Ignore malformed data
      }
    }
  }

  // Run when DOM is ready (or immediately if already parsed)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkPendingToast);
  } else {
    checkPendingToast();
  }

  // Also handle bfcache restoration (back/forward navigation)
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {checkPendingToast();}
  });

  window.Toast = { show: show, hide: hide, queue: queue };
})();
