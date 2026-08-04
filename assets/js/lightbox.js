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
    '<div class="lightbox__embed-wrap video-wrapper" hidden><iframe class="lightbox__embed hero-embed__frame" title="" scrolling="no" loading="lazy" tabindex="-1"></iframe></div>' +
    '<div class="lightbox__nav" hidden>' +
    '<button class="lightbox__nav-btn lightbox__nav-btn--prev" aria-label="Previous image">‹</button>' +
    '<span class="lightbox__counter" aria-live="polite"></span>' +
    '<button class="lightbox__nav-btn lightbox__nav-btn--next" aria-label="Next image">›</button>' +
    "</div>";
  document.body.appendChild(overlay);

  var img = overlay.querySelector(".lightbox__img");
  var picture = overlay.querySelector(".lightbox__picture");
  var embedWrap = overlay.querySelector(".lightbox__embed-wrap");
  var embed = overlay.querySelector(".lightbox__embed");
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

  function reduceMotion() {
    return (
      document.documentElement.getAttribute("data-effect-reduced-motion") ===
        "on" ||
      (window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    );
  }

  // Mirror the host's manual theme (data-mode on <html>) and reduced-motion
  // state into the embedded animation, exactly like the in-page hero-embed
  // shortcode does.
  function postEmbedTheme() {
    try {
      embed.contentWindow.postMessage(
        {
          theme:
            document.documentElement.getAttribute("data-mode") === "dark"
              ? "dark"
              : "light",
          reduce: reduceMotion(),
        },
        "*"
      );
    } catch (e) {}
  }
  embed.addEventListener("load", postEmbedTheme);

  // If the host theme or reduced-motion setting changes while the embed
  // lightbox is open, re-post so the enlarged animation tracks it (the general
  // observer in hero-embed.js excludes this dynamically-created frame).
  new MutationObserver(function () {
    if (overlay.classList.contains("is-open") && !embedWrap.hidden) {
      postEmbedTheme();
    }
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mode", "data-effect-reduced-motion"],
  });

  // OS reduced-motion / colour-scheme changes aren't attribute mutations, so
  // watch the media query too and re-post while the embed lightbox is open (the
  // child defers to the host once posted, so it needs this fresh state).
  if (window.matchMedia) {
    var rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (rmq.addEventListener) {
      rmq.addEventListener("change", function () {
        if (overlay.classList.contains("is-open") && !embedWrap.hidden) {
          postEmbedTheme();
        }
      });
    }
  }

  function show(index) {
    if (index < 0 || index >= gallery.length) {
      return;
    }
    galleryIndex = index;
    var figure = gallery[index];
    // A figure can open either a still image (default) or a live embed
    // (data-lightbox-type="embed", where data-lightbox is a same-origin page).
    if (figure.dataset.lightboxType === "embed") {
      picture.hidden = true;
      embed.title = figure.dataset.lightboxTitle || figureAlt(figure) || "";
      embedWrap.hidden = false;
      var src = figure.dataset.lightbox;
      if (embed.getAttribute("src") !== src) {
        embed.src = src; // load listener re-posts the theme
      } else {
        postEmbedTheme();
      }
    } else {
      embedWrap.hidden = true;
      embed.removeAttribute("src"); // stop any running animation
      picture.hidden = false;
      img.src = figure.dataset.lightbox;
      img.alt = figureAlt(figure);
    }
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

  // Open a single image by URL, with no gallery — used by the terminal layout
  // when a cat'd post's `[image N]` token (whose figure isn't in the DOM) is
  // clicked. No prev/next, since there's no on-page gallery to step through.
  function openSrc(src, alt, opts) {
    if (!src) {
      return;
    }
    opts = opts || {};
    previousFocus = document.activeElement;
    gallery = [];
    galleryIndex = -1;
    // A terminal token can point at a live embed (data-lightbox-type="embed",
    // a same-origin page) rather than a still image; route it through the iframe
    // branch so it isn't loaded as a broken <img>.
    if (opts.embed) {
      picture.hidden = true;
      embed.title = opts.title || alt || "";
      embedWrap.hidden = false;
      if (embed.getAttribute("src") !== src) {
        embed.src = src; // load listener posts the theme + reduced-motion
      } else {
        postEmbedTheme();
      }
    } else {
      embedWrap.hidden = true;
      embed.removeAttribute("src");
      picture.hidden = false;
      img.src = src;
      img.alt = alt || "";
    }
    nav.hidden = true;
    overlay.classList.add("is-open");
    document.documentElement.classList.add("lightbox-open");
    closeBtn.focus();
  }

  // The overlay's focusable controls, in tab order. The close button is always
  // present; prev/next only when a multi-image gallery is showing, and only
  // while enabled (they disable at the gallery ends). The embed iframe is
  // tabindex="-1", so it's intentionally excluded.
  function overlayFocusables() {
    var list = [closeBtn];
    if (!nav.hidden) {
      if (!prevBtn.disabled) {
        list.push(prevBtn);
      }
      if (!nextBtn.disabled) {
        list.push(nextBtn);
      }
    }
    return list;
  }

  // Keep Tab inside the modal — aria-modal="true" promises the rest of the page
  // is inert, so focus must not escape to the content behind the overlay. Wrap
  // from last→first (Tab) and first→last (Shift+Tab), and pull focus back in if
  // it has somehow landed outside while the overlay is open.
  function trapFocus(e) {
    var focusables = overlayFocusables();
    if (!focusables.length) {
      e.preventDefault();
      return;
    }
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    // Index of the active element WITHIN the focusable set — not just
    // overlay.contains(). An element that's in the overlay but absent from the
    // set (focus outside, or a control that just became disabled while focused —
    // e.g. Next after it reaches the last image, which stays activeElement while
    // disabled) counts as -1 and is treated as a boundary, so the next Tab wraps
    // back in instead of traversing past the last live control into the page.
    var index = focusables.indexOf(document.activeElement);
    if (e.shiftKey) {
      if (index <= 0) {
        e.preventDefault();
        last.focus();
      }
    } else if (index === -1 || index === focusables.length - 1) {
      e.preventDefault();
      first.focus();
    }
  }

  function close() {
    overlay.classList.remove("is-open");
    document.documentElement.classList.remove("lightbox-open");
    img.src = "";
    embed.removeAttribute("src"); // stop the animation and free the frame
    embedWrap.hidden = true;
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
  window.TerminalLightbox = { refresh: makeFiguresFocusable, openSrc: openSrc };

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
    if (e.key === "Tab") {
      trapFocus(e);
    }
    if (e.key === "ArrowLeft") {
      show(galleryIndex - 1);
    }
    if (e.key === "ArrowRight") {
      show(galleryIndex + 1);
    }
  });
})();
