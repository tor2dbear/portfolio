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
  var spriteBase = '';
  var swipeStartX = 0;
  var swipeStartY = 0;
  var swipeTracking = false;

  function getUseHref(use) {
    return use.getAttribute('href') ||
      use.getAttribute('xlink:href') ||
      use.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ||
      '';
  }

  /** Resolve the sprite.svg base path from an existing <use> in the DOM */
  function getSpriteBase() {
    if (spriteBase) return spriteBase;
    var uses = document.querySelectorAll('svg use');
    for (var i = 0; i < uses.length; i += 1) {
      var href = getUseHref(uses[i]);
      if (href && href.indexOf('sprite.svg') !== -1) {
        spriteBase = href.split('#')[0];
        break;
      }
    }
    if (!spriteBase) spriteBase = '/img/svg/sprite.svg?v=20260211b';
    return spriteBase;
  }

  function resetSwipe() {
    swipeTracking = false;
    swipeStartX = 0;
    swipeStartY = 0;
  }

  function onTouchStart(e) {
    if (!el || !el.classList.contains('toast--visible')) return;
    if (!e.changedTouches || !e.changedTouches.length) return;
    swipeTracking = true;
    swipeStartX = e.changedTouches[0].clientX;
    swipeStartY = e.changedTouches[0].clientY;
  }

  function onTouchMove(e) {
    if (!swipeTracking || !e.changedTouches || !e.changedTouches.length) return;
    var deltaY = e.changedTouches[0].clientY - swipeStartY;
    var deltaX = e.changedTouches[0].clientX - swipeStartX;
    if (deltaY < 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
      e.preventDefault();
    }
  }

  function onTouchEnd(e) {
    if (!swipeTracking || !e.changedTouches || !e.changedTouches.length) return;
    var deltaY = e.changedTouches[0].clientY - swipeStartY;
    var deltaX = e.changedTouches[0].clientX - swipeStartX;
    resetSwipe();
    if (deltaY <= -SWIPE_DISMISS_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
      hide();
    }
  }

  function getOrCreate() {
    if (el) return el;
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
    document.body.appendChild(el);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', resetSwipe, { passive: true });
    return el;
  }

  function setIcon(iconId) {
    if (!iconWrap) return;
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

    // Reset any in-progress animation
    clearTimeout(hideTimer);
    toast.classList.remove('toast--hiding', 'toast--visible');

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

  function hide() {
    if (!el) return;
    clearTimeout(hideTimer);

    el.classList.remove('toast--visible');
    el.classList.add('toast--hiding');

    var afterHide = function () {
      el.classList.remove('toast--hiding');
    };

    el.addEventListener('animationend', afterHide, { once: true });
    // Safety fallback
    setTimeout(afterHide, 400);
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
      if (raw) localStorage.removeItem(PENDING_KEY);
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
    if (e.persisted) checkPendingToast();
  });

  window.Toast = { show: show, hide: hide, queue: queue };
})();
