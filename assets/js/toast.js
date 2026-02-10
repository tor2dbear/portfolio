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
 *   sessionStorage.setItem('pending-toast', JSON.stringify({ title, value }))
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
    toast.classList.remove('toast--hiding');

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

  // Check for a pending toast left by a page-navigation action
  document.addEventListener('DOMContentLoaded', function () {
    var raw = sessionStorage.getItem(PENDING_KEY);
    if (raw) {
      sessionStorage.removeItem(PENDING_KEY);
      try {
        var data = JSON.parse(raw);
        setTimeout(function () {
          show(data.title, data.value);
        }, 300);
      } catch (e) {
        // Ignore malformed data
      }
    }
  });

  window.Toast = { show: show, hide: hide };
})();
