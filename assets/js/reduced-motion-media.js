/**
 * reduced-motion-media — pause autoplaying <video> and SMIL SVG animations when
 * the visitor prefers reduced motion (the OS query or the site's manual
 * data-effect-reduced-motion toggle).
 *
 * The global reduced-motion CSS only shortens CSS animations/transitions; it
 * can't pause native video playback or SVG SMIL (`<animate>` etc.). This handles
 * those: the works case's demo video and the animated logomark. Embedded hero
 * iframes drive their own reduced-motion via postMessage (see hero-embed.js);
 * this covers media in the host document only.
 */
(function () {
  "use strict";

  var root = document.documentElement;

  function reduced() {
    return (
      root.getAttribute("data-effect-reduced-motion") === "on" ||
      (window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    );
  }

  function apply() {
    var r = reduced();

    Array.prototype.forEach.call(
      document.querySelectorAll("video[autoplay]"),
      function (v) {
        if (r) {
          v.pause();
        } else {
          var p = v.play();
          if (p && typeof p.catch === "function") {
            p.catch(function () {});
          }
        }
      }
    );

    Array.prototype.forEach.call(
      document.querySelectorAll("svg"),
      function (s) {
        if (!s.querySelector("animate, animateTransform, animateMotion")) {
          return;
        }
        try {
          if (r) {
            s.pauseAnimations();
          } else {
            s.unpauseAnimations();
          }
        } catch (e) {}
      }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }

  new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      if (muts[i].attributeName === "data-effect-reduced-motion") {
        apply();
        break;
      }
    }
  }).observe(root, {
    attributes: true,
    attributeFilter: ["data-effect-reduced-motion"],
  });

  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.addEventListener) {
      mq.addEventListener("change", apply);
    }
  }

  // Terminal in-place nav swaps #main, bringing in fresh media; expose an
  // (idempotent) re-apply so terminal-nav.js can call it after a swap.
  window.ReducedMotionMedia = { refresh: apply };
})();
