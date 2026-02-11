/**
 * Toast — lightweight setting-change confirmations
 * Centred top of viewport, two-line layout (title + value), auto-dismiss.
 *
 * API:  window.Toast.show(title, value, options?)
 *       title    — category label  (e.g. "Läge")
 *       value    — selected option  (e.g. "Mörkt")
 *       options.duration — ms before auto-hide (default 2500)
 *
 * Pending-toast (survives navigation):
 *   localStorage.setItem('pending-toast', JSON.stringify({ title, value }))
 *   → shown and removed automatically on next page load.
 */
(function () {
  'use strict';

  var PENDING_KEY = 'pending-toast';
  var DEFAULT_DURATION = 2500;
  var el = null;
  var titleEl = null;
  var valueEl = null;
  var hideTimer = null;

  function getOrCreate() {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');

    titleEl = document.createElement('span');
    titleEl.className = 'toast__title';

    valueEl = document.createElement('span');
    valueEl.className = 'toast__value';

    el.appendChild(titleEl);
    el.appendChild(valueEl);
    document.body.appendChild(el);
    return el;
  }

  function show(title, value, options) {
    var duration = (options && options.duration) || DEFAULT_DURATION;
    var toast = getOrCreate();

    // Reset any in-progress animation
    clearTimeout(hideTimer);
    toast.classList.remove('toast--hiding', 'toast--visible');

    titleEl.textContent = title || '';
    valueEl.textContent = value || '';

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

    el.addEventListener('transitionend', afterHide, { once: true });
    // Safety fallback
    setTimeout(afterHide, 300);
  }

  /**
   * Store a toast to be shown after the next page load.
   * Used for actions that trigger navigation (e.g. language switch).
   */
  function queue(title, value) {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify({
        title: title || '',
        value: value || ''
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
        setTimeout(function () {
          show(data.title, data.value);
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
