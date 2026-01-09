/**
 * Smooth Scroll for Anchor Links
 * Handles smooth scrolling to page sections with proper cross-page support
 */

(function() {
  'use strict';

  function getScrollPaddingTop() {
    const styles = getComputedStyle(document.documentElement);
    const paddingTop = parseFloat(styles.scrollPaddingTop);
    return Number.isFinite(paddingTop) ? paddingTop : 0;
  }

  function scrollToTarget(target, behavior) {
    const offset = getScrollPaddingTop();
    const paddingTop = parseFloat(getComputedStyle(target).paddingTop) || 0;
    const targetTop =
      target.getBoundingClientRect().top + window.pageYOffset + paddingTop - offset;
    window.scrollTo({ top: targetTop, behavior: behavior || 'smooth' });
  }

  function alignTargetAfter(target) {
    setTimeout(() => {
      const offset = getScrollPaddingTop();
      const targetTop = target.getBoundingClientRect().top + window.pageYOffset - offset;
      const delta = Math.abs(window.pageYOffset - targetTop);
      if (delta > 2) {
        scrollToTarget(target, 'auto');
      }
    }, 200);
  }

  // Smooth scroll for anchor links
  document.addEventListener('DOMContentLoaded', function() {
    // Select all links with anchors
    const anchorLinks = document.querySelectorAll('a[href*="#"]');

    anchorLinks.forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');

        // Skip if no href or if it's just "#"
        if (!href || href === '#') return;

        try {
          // Parse the URL
          const url = new URL(href, window.location.href);

          // Check if it's a same-page link
          const isSamePage = url.pathname === window.location.pathname ||
                             href.startsWith('#');

          if (!isSamePage) {
            // Let the browser handle cross-page navigation
            return;
          }

          // Extract the hash
          const hash = href.includes('#') ? href.split('#')[1] : null;
          if (!hash) return;

          // Find the target element
          const target = document.getElementById(hash);
          if (target) {
            e.preventDefault();

            // Update URL first so :target styles (e.g., scroll-margin) apply
            if (window.history.pushState) {
              if (window.location.hash !== '#' + hash) {
                window.history.pushState(null, null, '#' + hash);
              }
            } else {
              // Fallback for older browsers
              window.location.hash = hash;
            }

            scrollToTarget(target, 'smooth');

            // Update focus for accessibility
            target.setAttribute('tabindex', '-1');
            try {
              target.focus({ preventScroll: true });
            } catch (_error) {
              // Skip focus to avoid jump when preventScroll isn't supported.
            }

            // Keep click behavior smooth without forcing a second jump.
          }
        } catch (error) {
          // If URL parsing fails, let browser handle it
          console.warn('Smooth scroll: URL parsing failed', error);
        }
      });
    });

    // Handle direct hash navigation (e.g., visiting site.com/#about directly)
    if (window.location.hash) {
      const hash = window.location.hash.slice(1);
      const target = document.getElementById(hash);

      if (target) {
        // Small delay to let the page finish loading
        setTimeout(() => {
          scrollToTarget(target, 'smooth');

          // Update focus for accessibility
          target.setAttribute('tabindex', '-1');
          try {
            target.focus({ preventScroll: true });
          } catch (_error) {
            // Skip focus to avoid jump when preventScroll isn't supported.
          }

          alignTargetAfter(target);
        }, 100);
      }
    }
  });
})();
