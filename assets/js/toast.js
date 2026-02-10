/**
 * Toast — lightweight setting-change confirmations
 * Centred top of viewport, fade-in / auto-dismiss.
 *
 * API:  window.Toast.show(message, options?)
 *       options.duration — ms before auto-hide (default 2500)
 *
 * Pending-toast support:
 *   sessionStorage.setItem('pending-toast', 'message')
 *   → shown automatically on next page load (for page-navigation actions
 *     like language switching).
 */
(function () {
  'use strict';

  var PENDING_KEY = 'pending-toast';
  var DEFAULT_DURATION = 2500;
  var el = null;
  var hideTimer = null;

  function getOrCreate() {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
    return el;
  }

  function show(message, options) {
    var duration = (options && options.duration) || DEFAULT_DURATION;
    var toast = getOrCreate();

    // If already showing — reset
    clearTimeout(hideTimer);
    toast.classList.remove('toast--hiding');

    toast.textContent = message;

    // Force reflow so the browser recognises the class change
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

    // Safety fallback if transitionend doesn't fire
    setTimeout(afterHide, 300);
  }

  // Check for a pending toast left by a page-navigation action
  document.addEventListener('DOMContentLoaded', function () {
    var pending = sessionStorage.getItem(PENDING_KEY);
    if (pending) {
      sessionStorage.removeItem(PENDING_KEY);
      // Small delay so the page settles before showing
      setTimeout(function () {
        show(pending);
      }, 300);
    }
  });

  // Public API
  window.Toast = { show: show, hide: hide };
})();
