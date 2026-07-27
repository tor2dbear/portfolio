/**
 * hero-embed — mirror the site's manual theme (data-mode on <html>) into every
 * embedded hero animation iframe (.hero-embed__frame), so a work's motion hero
 * tracks the visitor's chosen light/dark mode both on the work page (via the
 * hero-embed shortcode) and in every summary card that renders it live.
 *
 * The lightbox's own embed is excluded — lightbox.js drives that one, since it
 * is created and re-sourced dynamically as the viewer opens/steps the gallery.
 */
(function () {
  "use strict";

  function frames() {
    return Array.prototype.slice
      .call(document.querySelectorAll("iframe.hero-embed__frame"))
      .filter(function (f) {
        return !f.classList.contains("lightbox__embed");
      });
  }

  function mode() {
    return document.documentElement.getAttribute("data-mode") === "dark"
      ? "dark"
      : "light";
  }

  function post(f) {
    try {
      f.contentWindow.postMessage({ theme: mode() }, "*");
    } catch (e) {}
  }

  function wire(f) {
    if (f.dataset.heroWired) {
      return;
    }
    f.dataset.heroWired = "1";
    f.addEventListener("load", function () {
      post(f);
    });
    // The embed may already be loaded by the time this defers in; post now too.
    if (f.contentWindow) {
      post(f);
    }
  }

  // Desktop lock: scale each fixed-design-width embed (.embed-lock) so its
  // desktop layout fits the container at any screen size (see embed-full).
  function scaleLocks() {
    Array.prototype.forEach.call(
      document.querySelectorAll(".embed-lock > .hero-embed__frame"),
      function (f) {
        var wrap = f.parentElement;
        var designW = parseFloat(f.dataset.embedW) || 1280;
        var w = wrap.clientWidth;
        if (w > 0) {
          f.style.transform = "scale(" + w / designW + ")";
        }
      }
    );
  }

  var hasRO = typeof window.ResizeObserver !== "undefined";
  var ro = hasRO
    ? new window.ResizeObserver(function () {
        scaleLocks();
      })
    : null;

  function observeLocks() {
    if (!ro) {
      return;
    }
    Array.prototype.forEach.call(
      document.querySelectorAll(".embed-lock"),
      function (wrap) {
        ro.observe(wrap);
      }
    );
  }

  function wireAll() {
    frames().forEach(wire);
    scaleLocks();
    observeLocks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireAll);
  } else {
    wireAll();
  }

  // Fallback for browsers without ResizeObserver (and a cheap safety net).
  window.addEventListener("resize", scaleLocks);
  window.addEventListener("load", scaleLocks);

  // Re-post to every embed whenever the site theme flips.
  new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      if (muts[i].attributeName === "data-mode") {
        frames().forEach(post);
        break;
      }
    }
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mode"],
  });

  // Terminal in-place nav swaps #main, bringing in fresh cards; expose an
  // (idempotent) re-wire so terminal-nav.js can call it after a swap.
  window.HeroEmbed = { refresh: wireAll };
})();
