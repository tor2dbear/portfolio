/**
 * Reveal elements on scroll with a subtle fade + slide.
 * Opt-in via the `.reveal` class.
 */
(function () {
  "use strict";

  const REVEAL_SELECTOR = ".reveal";
  const REVEALED_CLASS = "is-revealed";
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

  /**
   * The About CV sections fade in individually (driven by the container's
   * .is-revealed state in CSS). Their stagger must follow *visual* order — a
   * top-to-bottom, left-to-right wipe — but the multi-column balance puts
   * sections in different positions at each width, so the order can't be
   * expressed in CSS. Measure positions here and write a per-section
   * --reveal-delay. Recomputed on resize (harmless once already revealed).
   */
  const CV_STAGGER_STEP = 70; // ms between sections
  const CV_STAGGER_MAX = 420; // cap so long CVs don't drag on
  const orderCvStagger = () => {
    document.querySelectorAll(".about-cv").forEach((cv) => {
      const sections = Array.from(cv.querySelectorAll(".about-cv__section"));
      if (!sections.length) {
        return;
      }
      const measured = sections.map((el) => {
        const rect = el.getBoundingClientRect();
        return { el, top: rect.top, left: rect.left };
      });
      // Top-to-bottom wipe: order by vertical position (bucketed so sections
      // sharing a row tie by left→right). A section near the top fades early
      // whichever column it landed in — so top-right doesn't come last.
      measured.sort((a, b) => {
        const rowA = Math.round(a.top / 20);
        const rowB = Math.round(b.top / 20);
        return rowA - rowB || a.left - b.left;
      });
      measured.forEach((item, index) => {
        const delay = Math.min(index * CV_STAGGER_STEP, CV_STAGGER_MAX);
        item.el.style.setProperty("--reveal-delay", `${delay}ms`);
      });
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    // Order CV fades before any reveal can fire so the first reveal is staggered.
    orderCvStagger();
    let cvResizeRaf = 0;
    window.addEventListener("resize", () => {
      if (cvResizeRaf) {
        window.cancelAnimationFrame(cvResizeRaf);
      }
      cvResizeRaf = window.requestAnimationFrame(orderCvStagger);
    });
    // Late reflows (web fonts, images) can re-balance the columns before the
    // CV scrolls into view — recompute once things settle.
    window.addEventListener("load", orderCvStagger);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(orderCvStagger);
    }

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
          // Immediate reveal elements skip image waiting for faster LCP
          if (entry.target.classList.contains("reveal--immediate")) {
            revealElement(entry.target);
          } else if (entry.target.classList.contains("reveal--no-wait")) {
            revealElement(entry.target);
          } else {
            revealWhenReady(entry.target);
          }
          obs.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.15,
      }
    );

    const isInViewport = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.top <= window.innerHeight && rect.bottom >= 0;
    };

    const isStaggerEligible = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.height > 0;
    };

    const hasCustomDelay = (element) =>
      element.classList.contains("reveal--delay") ||
      element.classList.contains("reveal--delay-2") ||
      element.classList.contains("reveal--immediate") ||
      element.style.getPropertyValue("--reveal-delay");

    const prefersNoStagger =
      window.matchMedia &&
      window.matchMedia("(max-width: 43.125em)").matches;
    const inViewElements = elements.filter(isInViewport);
    let staggerIndex = 0;
    const postStaggerIndexByContainer = new WeakMap();

    inViewElements.forEach((element) => {
      if (!prefersNoStagger && !hasCustomDelay(element)) {
        const postContainer = element.closest(".post-content");
        if (postContainer) {
          const currentPostIndex = postStaggerIndexByContainer.get(postContainer) || 0;
          const postDelay = Math.min(currentPostIndex * 60, 320);
          element.style.setProperty("--reveal-delay", `${postDelay}ms`);
          if (isStaggerEligible(element)) {
            postStaggerIndexByContainer.set(postContainer, currentPostIndex + 1);
          }
        } else {
          const delay = Math.min(staggerIndex * 80, 320);
          element.style.setProperty("--reveal-delay", `${delay}ms`);
          if (isStaggerEligible(element)) {
            staggerIndex += 1;
          }
        }
      }
      // Immediate reveal elements skip image waiting for faster LCP
      if (element.classList.contains("reveal--immediate")) {
        revealElement(element);
      } else if (element.classList.contains("reveal--no-wait")) {
        revealElement(element);
      } else {
        revealWhenReady(element);
      }
    });

    elements.forEach((element) => {
      if (inViewElements.includes(element)) {
        return;
      }
      observer.observe(element);
    });
  });
})();
