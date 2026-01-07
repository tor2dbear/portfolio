/**
 * Smooth Scroll for Anchor Links
 * Handles smooth scrolling to page sections with proper cross-page support
 */

(function() {
  'use strict';

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

            // Smooth scroll to the target
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });

            // Update URL without triggering scroll
            if (window.history.pushState) {
              window.history.pushState(null, null, '#' + hash);
            } else {
              // Fallback for older browsers
              window.location.hash = hash;
            }

            // Update focus for accessibility
            target.setAttribute('tabindex', '-1');
            target.focus();
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
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Update focus for accessibility
          target.setAttribute('tabindex', '-1');
          target.focus();
        }, 100);
      }
    }
  });
})();
