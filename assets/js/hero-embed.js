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

  function reduce() {
    return (
      document.documentElement.getAttribute("data-effect-reduced-motion") ===
        "on" ||
      (window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    );
  }

  function post(f) {
    try {
      f.contentWindow.postMessage({ theme: mode(), reduce: reduce() }, "*");
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

  function wireAll() {
    frames().forEach(wire);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireAll);
  } else {
    wireAll();
  }

  // Re-post to every embed whenever the site theme or reduced-motion setting
  // flips (manual toggles on <html>)...
  new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var a = muts[i].attributeName;
      if (a === "data-mode" || a === "data-effect-reduced-motion") {
        frames().forEach(post);
        break;
      }
    }
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mode", "data-effect-reduced-motion"],
  });

  // ...and whenever the OS reduced-motion preference itself changes.
  if (window.matchMedia) {
    var rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (rmq.addEventListener) {
      rmq.addEventListener("change", function () {
        frames().forEach(post);
      });
    }
  }

  // Terminal in-place nav swaps #main, bringing in fresh cards; expose an
  // (idempotent) re-wire so terminal-nav.js can call it after a swap.
  window.HeroEmbed = { refresh: wireAll };
})();
