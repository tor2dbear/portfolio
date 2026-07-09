(function () {
  var overlay = document.createElement("div");
  overlay.id = "lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Image viewer");
  overlay.innerHTML =
    '<button class="lightbox__close" aria-label="Close">' +
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
    "</button>" +
    '<picture class="lightbox__picture"><img class="lightbox__img" src="" alt="" /></picture>' +
    '<div class="lightbox__nav" hidden>' +
    '<button class="lightbox__nav-btn lightbox__nav-btn--prev" aria-label="Previous image">‹</button>' +
    '<span class="lightbox__counter" aria-live="polite"></span>' +
    '<button class="lightbox__nav-btn lightbox__nav-btn--next" aria-label="Next image">›</button>' +
    "</div>";
  document.body.appendChild(overlay);

  var img = overlay.querySelector(".lightbox__img");
  var closeBtn = overlay.querySelector(".lightbox__close");
  var nav = overlay.querySelector(".lightbox__nav");
  var prevBtn = overlay.querySelector(".lightbox__nav-btn--prev");
  var nextBtn = overlay.querySelector(".lightbox__nav-btn--next");
  var counter = overlay.querySelector(".lightbox__counter");
  var previousFocus = null;

  // The page's figures form one gallery, in DOM order. Collected at open time
  // so dynamically shown/hidden figures are always current.
  var gallery = [];
  var galleryIndex = -1;

  function figureAlt(figure) {
    var image = figure.querySelector("img");
    return image ? image.alt : "";
  }

  function show(index) {
    if (index < 0 || index >= gallery.length) {
      return;
    }
    galleryIndex = index;
    var figure = gallery[index];
    img.src = figure.dataset.lightbox;
    img.alt = figureAlt(figure);
    var multiple = gallery.length > 1;
    nav.hidden = !multiple;
    if (multiple) {
      counter.textContent = index + 1 + " / " + gallery.length;
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === gallery.length - 1;
    }
  }

  function open(figure) {
    previousFocus = document.activeElement;
    gallery = Array.prototype.slice.call(
      document.querySelectorAll("figure[data-lightbox]")
    );
    var index = gallery.indexOf(figure);
    show(index === -1 ? 0 : index);
    overlay.classList.add("is-open");
    document.documentElement.classList.add("lightbox-open");
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove("is-open");
    document.documentElement.classList.remove("lightbox-open");
    img.src = "";
    if (previousFocus) {
      previousFocus.focus();
    }
  }

  document.addEventListener("click", function (e) {
    var figure = e.target.closest("figure[data-lightbox]");
    if (figure) {
      e.preventDefault();
      open(figure);
    }
  });

  // Figures are click targets only by default; give them keyboard access so
  // the image is reachable when the terminal layout collapses it to a text
  // token (and, incidentally, in every other layout too).
  function makeFiguresFocusable() {
    document
      .querySelectorAll("figure[data-lightbox]")
      .forEach(function (figure) {
        figure.setAttribute("tabindex", "0");
        figure.setAttribute("role", "button");
        if (!figure.hasAttribute("aria-label")) {
          figure.setAttribute("aria-label", figureAlt(figure) || "Open image");
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", makeFiguresFocusable);
  } else {
    makeFiguresFocusable();
  }

  // Terminal in-place navigation swaps #main, bringing in fresh figures that
  // need tabindex/role to stay keyboard-reachable. Expose the (idempotent)
  // focusability init so terminal-nav.js can re-run it after a swap. Everything
  // else in this module is bound once to `document`/the overlay and the gallery
  // is collected at open time, so swapped-in figures are already covered.
  window.TerminalLightbox = { refresh: makeFiguresFocusable };

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") {
      return;
    }
    var figure = e.target.closest && e.target.closest("figure[data-lightbox]");
    if (figure) {
      e.preventDefault();
      open(figure);
    }
  });

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) {
      close();
    }
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", function () {
    show(galleryIndex - 1);
  });
  nextBtn.addEventListener("click", function () {
    show(galleryIndex + 1);
  });

  document.addEventListener("keydown", function (e) {
    if (!overlay.classList.contains("is-open")) {
      return;
    }
    if (e.key === "Escape") {
      // Consume the event so the terminal layout's exit-on-Escape handler,
      // which may run after us on this same keydown, doesn't also fire.
      e.preventDefault();
      close();
    }
    if (e.key === "ArrowLeft") {
      show(galleryIndex - 1);
    }
    if (e.key === "ArrowRight") {
      show(galleryIndex + 1);
    }
  });
})();
