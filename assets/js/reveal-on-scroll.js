/**
 * Reveal elements on scroll with a subtle fade + slide.
 * Opt-in via the `.reveal` class.
 *
 * Each element is revealed individually as it scrolls into view (one shared
 * IntersectionObserver; revealed once, then unobserved). A subtle left→right
 * stagger is derived from the element's horizontal position *at the moment it
 * is revealed*, so elements entering together (a grid/column row) cascade
 * left→right while rows cascade top-to-bottom with the scroll. Measuring live
 * keeps it correct when the layout reflows (e.g. a grid going 2→3 columns) —
 * unlike a DOM-order stagger, which mis-timed multi-column content. Elements
 * with an explicit delay (reveal--delay / reveal--delay-2 / reveal--immediate
 * / inline --reveal-delay) keep their authored timing.
 */
(function () {
  "use strict";

  const REVEAL_SELECTOR = ".reveal";
  const REVEALED_CLASS = "is-revealed";
  const LR_STAGGER_MAX = 160; // ms spread across the viewport width

  const scheduleReveal = (callback) => {
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(callback);
      });
      return;
    }
    window.setTimeout(callback, 0);
  };

  const revealElement = (element) => {
    if (element.classList.contains(REVEALED_CLASS)) {
      return;
    }
    scheduleReveal(() => {
      element.classList.add(REVEALED_CLASS);
    });
  };

  const revealWhenReady = (element) => {
    const images = element.querySelectorAll("img");
    if (!images.length) {
      revealElement(element);
      return;
    }

    let remaining = 0;
    images.forEach((img) => {
      if (img.complete) {
        return;
      }
      remaining += 1;
      const done = () => {
        remaining -= 1;
        if (remaining <= 0) {
          revealElement(element);
        }
      };
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });

    if (remaining === 0) {
      revealElement(element);
    }
  };

  const hasCustomDelay = (element) =>
    element.classList.contains("reveal--delay") ||
    element.classList.contains("reveal--delay-2") ||
    element.classList.contains("reveal--immediate") ||
    element.style.getPropertyValue("--reveal-delay");

  // Subtle left→right stagger from the element's horizontal position at the
  // moment it is revealed. Full-width blocks sit near the left margin → ~0ms
  // (a plain fade); grid/column rows spread left→right. Skipped when the
  // element already carries an authored delay.
  const applyLeftRightStagger = (element) => {
    if (hasCustomDelay(element)) {
      return;
    }
    const viewport =
      window.innerWidth || document.documentElement.clientWidth || 0;
    if (!viewport) {
      return;
    }
    const left = element.getBoundingClientRect().left;
    if (!Number.isFinite(left)) {
      return;
    }
    const ratio = Math.min(Math.max(left / viewport, 0), 1);
    element.style.setProperty(
      "--reveal-delay",
      `${Math.round(ratio * LR_STAGGER_MAX)}ms`
    );
  };

  const triggerReveal = (element) => {
    applyLeftRightStagger(element);
    // Immediate / no-wait elements skip image waiting.
    if (
      element.classList.contains("reveal--immediate") ||
      element.classList.contains("reveal--no-wait")
    ) {
      revealElement(element);
    } else {
      revealWhenReady(element);
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    const postContentChildren = document.querySelectorAll(".post-content > *");
    postContentChildren.forEach((child) => {
      if (!child.classList.contains("reveal")) {
        child.classList.add("reveal");
      }
    });

    const applicationCvBlocks = document.querySelectorAll(
      ".application-page .about-cv.reveal"
    );
    if (applicationCvBlocks.length) {
      scheduleReveal(() => {
        applicationCvBlocks.forEach((block) => {
          revealElement(block);
        });
      });
    }

    const elements = Array.from(document.querySelectorAll(REVEAL_SELECTOR));
    if (!elements.length) {
      return;
    }

    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add(REVEALED_CLASS));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          triggerReveal(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );

    elements.forEach((element) => {
      // Fast-path immediate elements (e.g. the hero) so LCP isn't held for a
      // frame waiting on the observer's first callback.
      if (element.classList.contains("reveal--immediate")) {
        revealElement(element);
        return;
      }
      observer.observe(element);
    });
  });
})();
