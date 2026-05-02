(function () {
  var overlay = document.createElement('div');
  overlay.id = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Image viewer');
  overlay.innerHTML =
    '<button class="lightbox__close" aria-label="Close">' +
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
    '</button>' +
    '<img class="lightbox__img" src="" alt="" />';
  document.body.appendChild(overlay);

  var img = overlay.querySelector('.lightbox__img');
  var closeBtn = overlay.querySelector('.lightbox__close');
  var previousFocus = null;

  function open(src, alt) {
    previousFocus = document.activeElement;
    img.src = src;
    img.alt = alt || '';
    overlay.classList.add('is-open');
    document.documentElement.classList.add('lightbox-open');
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove('is-open');
    document.documentElement.classList.remove('lightbox-open');
    img.src = '';
    if (previousFocus) previousFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var figure = e.target.closest('figure[data-lightbox]');
    if (figure) {
      e.preventDefault();
      open(figure.dataset.lightbox, figure.querySelector('img') ? figure.querySelector('img').alt : '');
    }
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });
})();
