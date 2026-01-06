/**
 * Focus Mode System - Query Parameter Based
 *
 * Handles "focus mode" for both client and employer contexts using URL parameters.
 * This provides a stateless, shareable, and SEO-friendly solution.
 *
 * URL Parameters:
 * - ?view=client&ref=company-name - Client focus mode
 * - ?view=employer - Employer focus mode
 *
 * Features:
 * - Automatic parameter propagation to internal links
 * - Breadcrumb management
 * - Security: XSS prevention via textContent
 * - No localStorage/sessionStorage required
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    PARAM_VIEW: 'view',
    PARAM_REF: 'ref',
    VIEW_CLIENT: 'client',
    VIEW_EMPLOYER: 'employer',
    LAYOUT_ID: 'layout',
    CLASS_CLIENTPAGE: 'clientpage',
    CLASS_EMPLOYERPAGE: 'employerpage'
  };

  /**
   * Get URL parameters safely
   */
  function getUrlParams() {
    try {
      return new URLSearchParams(window.location.search);
    } catch (error) {
      console.error('Focus mode: Error parsing URL parameters', error);
      return new URLSearchParams();
    }
  }

  /**
   * Get current view context (client, employer, or null)
   */
  function getViewContext() {
    const params = getUrlParams();
    const view = params.get(CONFIG.PARAM_VIEW);

    // Backward compatibility: check for old ?source=client parameter
    const legacySource = params.get('source');

    // Also detect from URL path
    const path = window.location.pathname;
    const isClientPath = path.includes('/clients/');
    const isEmployerPath = path.includes('/employer') || path.includes('/arbetsgivare');

    // Check for client context (new param, legacy param, or path)
    if (view === CONFIG.VIEW_CLIENT || legacySource === 'client' || isClientPath) {
      return {
        type: CONFIG.VIEW_CLIENT,
        ref: params.get(CONFIG.PARAM_REF) || extractRefFromPath(path, 'clients')
      };
    }

    if (view === CONFIG.VIEW_EMPLOYER || isEmployerPath) {
      return {
        type: CONFIG.VIEW_EMPLOYER,
        ref: null
      };
    }

    return null;
  }

  /**
   * Extract reference name from path (e.g., /clients/deg17/ -> deg17)
   */
  function extractRefFromPath(path, segment) {
    const regex = new RegExp(`/${segment}/([^/]+)`);
    const match = path.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Apply focus mode CSS class to layout
   */
  function applyFocusMode(context) {
    const layout = document.getElementById(CONFIG.LAYOUT_ID);
    if (!layout) {
      console.warn('Focus mode: Layout element not found');
      return;
    }

    if (context.type === CONFIG.VIEW_CLIENT) {
      layout.classList.add(CONFIG.CLASS_CLIENTPAGE);
      console.log('Focus mode: Client mode activated', context.ref || '');
    } else if (context.type === CONFIG.VIEW_EMPLOYER) {
      layout.classList.add(CONFIG.CLASS_EMPLOYERPAGE);
      console.log('Focus mode: Employer mode activated');
    }
  }

  /**
   * Build query string for focus mode
   */
  function buildFocusParams(context) {
    const params = new URLSearchParams();
    params.set(CONFIG.PARAM_VIEW, context.type);
    if (context.ref) {
      params.set(CONFIG.PARAM_REF, context.ref);
    }
    return params.toString();
  }

  /**
   * Propagate focus mode parameters to internal links
   */
  function propagateToLinks(context) {
    const focusParams = buildFocusParams(context);

    // Find all internal links (href starts with / or is relative)
    const links = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');

    links.forEach(link => {
      try {
        const href = link.getAttribute('href');

        // Skip anchor links and already processed links
        if (!href || href.startsWith('#') || link.hasAttribute('data-focus-processed')) {
          return;
        }

        // Parse the URL
        const url = new URL(href, window.location.origin);

        // Add focus parameters
        const params = new URLSearchParams(url.search);
        params.set(CONFIG.PARAM_VIEW, context.type);
        if (context.ref) {
          params.set(CONFIG.PARAM_REF, context.ref);
        }

        // Update the link
        url.search = params.toString();
        link.setAttribute('href', url.pathname + url.search + url.hash);
        link.setAttribute('data-focus-processed', 'true');
      } catch (error) {
        // Skip links that can't be parsed (external, mailto, etc.)
      }
    });
  }

  /**
   * Update breadcrumbs for client/employer context
   */
  function updateBreadcrumbs(context) {
    if (context.type === CONFIG.VIEW_CLIENT && context.ref) {
      updateClientBreadcrumb(context.ref);
    }
    // Employer breadcrumbs are handled in template
  }

  /**
   * Update client breadcrumb with safe text handling
   */
  function updateClientBreadcrumb(clientRef) {
    const breadcrumbElement =
      document.querySelector('[data-js="application-breadcrumb-back"]') ||
      document.getElementById('client-breadcrumb-back');
    if (!breadcrumbElement) return;

    // Clear existing content safely
    while (breadcrumbElement.firstChild) {
      breadcrumbElement.removeChild(breadcrumbElement.firstChild);
    }

    // Create link element
    const link = document.createElement('a');

    // Build client page URL
    const clientPath = `/clients/${encodeURIComponent(clientRef)}/`;
    link.setAttribute('href', clientPath);

    // Set text content safely (prevents XSS)
    const clientName = decodeURIComponent(clientRef).replace(/-/g, ' ');
    link.textContent = clientName;

    // Append to breadcrumb
    breadcrumbElement.appendChild(link);
  }

  /**
   * Update "back to client" links in table of contents
   */
  function updateTableOfContents(context) {
    if (context.type !== CONFIG.VIEW_CLIENT || !context.ref) return;

    const clientPath = `/clients/${encodeURIComponent(context.ref)}/`;
    const tocLinks = {
      'application-toc-letter': `${clientPath}#letter`,
      'application-toc-portfolio': `${clientPath}#portfolio`,
      'application-toc-cv': `${clientPath}#cv`,
      'application-toc-download': `${clientPath}#download`,
      'application-toc-contact': `${clientPath}#contact`
    };

    Object.entries(tocLinks).forEach(([key, href]) => {
      const element = document.querySelector(`[data-js="${key}"]`);
      if (element) {
        element.setAttribute('href', href);
      }
    });
  }

  /**
   * Initialize focus mode
   */
  function init() {
    const context = getViewContext();

    if (!context) {
      console.log('Focus mode: Standard mode (no focus context)');
      return;
    }

    // Apply CSS class
    applyFocusMode(context);

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        propagateToLinks(context);
        updateBreadcrumbs(context);
        updateTableOfContents(context);
      });
    } else {
      propagateToLinks(context);
      updateBreadcrumbs(context);
      updateTableOfContents(context);
    }
  }

  // Auto-initialize
  init();

  // Export for potential external use
  window.FocusMode = {
    getContext: getViewContext,
    refresh: init
  };
})();
