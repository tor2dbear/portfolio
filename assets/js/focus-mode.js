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
        ref:
          params.get(CONFIG.PARAM_REF) ||
          extractRefFromPath(path, 'clients') ||
          extractRefFromReferrer('clients')
      };
    }

    if (view === CONFIG.VIEW_EMPLOYER || isEmployerPath) {
      return {
        type: CONFIG.VIEW_EMPLOYER,
        ref:
          params.get(CONFIG.PARAM_REF) ||
          extractRefFromPath(path, 'employers') ||
          extractRefFromReferrer('employers')
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
   * Extract reference name from document referrer
   */
  function extractRefFromReferrer(segment) {
    try {
      if (!document.referrer) return null;
      const referrerUrl = new URL(document.referrer);
      if (referrerUrl.origin !== window.location.origin) return null;
      return extractRefFromPath(referrerUrl.pathname, segment);
    } catch (_error) {
      return null;
    }
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
   * Update top menu contact button for focus mode
   */
  function updateContactButton(context) {
    if (!context || !context.ref) return;
    const contactButton = document.querySelector('.top-menu__item--contact .top-menu__link--button');
    if (!contactButton) return;

    const path = window.location.pathname;
    const langPrefix = path.startsWith('/sv/') ? '/sv' : '';
    const baseSegment = context.type === CONFIG.VIEW_EMPLOYER ? 'employers' : 'clients';
    const targetPath = `${langPrefix}/${baseSegment}/${encodeURIComponent(context.ref)}/`;
    const params = buildFocusParams(context);
    const isRootContext = path.startsWith(targetPath);

    if (isRootContext) {
      contactButton.setAttribute('href', `${targetPath}?${params}#contact`);
    } else {
      contactButton.setAttribute('href', `${targetPath}?${params}`);
    }

    const label = contactButton.querySelector('.top-menu__label--long');
    const iconDefault = contactButton.querySelector('[data-focus-icon="contact-default"]');
    const iconProfile = contactButton.querySelector('[data-focus-icon="contact-profile"]');

    if (label) {
      if (isRootContext) {
        label.textContent =
          label.getAttribute('data-focus-label') ||
          label.getAttribute('data-focus-label-default') ||
          label.textContent;
      } else {
        const template = label.getAttribute('data-focus-label-template');
        const rawName = decodeURIComponent(context.ref).replace(/-/g, ' ');
        const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        label.textContent = template ? template.replace('%s', name) : label.textContent;
      }
    }

    if (isRootContext) {
      contactButton.classList.remove('is-focus-subpage');
    } else {
      contactButton.classList.add('is-focus-subpage');
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
    // Find all internal links (relative, root-relative, or same-origin absolute)
    const links = document.querySelectorAll('a[href]');

    links.forEach(link => {
      try {
        const href = link.getAttribute('href');

        // Skip anchor links and already processed links
        if (
          !href ||
          href.startsWith('#') ||
          link.hasAttribute('data-focus-processed') ||
          link.hasAttribute('data-focus-ignore') ||
          link.closest('[data-focus-ignore="true"]')
        ) {
          return;
        }

        // Parse the URL (handles relative + absolute)
        const url = new URL(href, window.location.origin);

        // Only rewrite same-origin links
        if (url.origin !== window.location.origin) {
          return;
        }

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
      } catch (_error) {
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
    if (context.type === CONFIG.VIEW_EMPLOYER && context.ref) {
      updateEmployerBreadcrumb(context.ref);
    }
  }

  /**
   * Update client breadcrumb with safe text handling
   */
  function updateClientBreadcrumb(clientRef) {
    const breadcrumbElements = document.querySelectorAll(
      '[data-js="application-breadcrumb-back"]'
    );
    const fallbackElement = document.getElementById('client-breadcrumb-back');
    const elements = breadcrumbElements.length
      ? Array.from(breadcrumbElements)
      : fallbackElement
      ? [fallbackElement]
      : [];
    if (!elements.length) return;

    // Build client page URL
    const clientPath = `/clients/${encodeURIComponent(clientRef)}/`;
    const clientName = decodeURIComponent(clientRef).replace(/-/g, ' ');

    elements.forEach((breadcrumbElement) => {
      while (breadcrumbElement.firstChild) {
        breadcrumbElement.removeChild(breadcrumbElement.firstChild);
      }

      const link = document.createElement('a');
      link.setAttribute('href', clientPath);
      link.setAttribute('class', 'application-breadcrumb__link');
      link.textContent = clientName;
      breadcrumbElement.appendChild(link);
    });
  }

  /**
   * Update employer breadcrumb with safe text handling
   */
  function updateEmployerBreadcrumb(employerRef) {
    const breadcrumbElements = document.querySelectorAll(
      '[data-js="application-breadcrumb-back-employer"]'
    );
    const fallbackElement = document.getElementById('employer-breadcrumb-back');
    const elements = breadcrumbElements.length
      ? Array.from(breadcrumbElements)
      : fallbackElement
      ? [fallbackElement]
      : [];
    if (!elements.length) return;

    const employerPath = `/employers/${encodeURIComponent(employerRef)}/`;
    const employerName = decodeURIComponent(employerRef).replace(/-/g, ' ');

    elements.forEach((breadcrumbElement) => {
      while (breadcrumbElement.firstChild) {
        breadcrumbElement.removeChild(breadcrumbElement.firstChild);
      }

      const link = document.createElement('a');
      link.setAttribute('href', employerPath);
      link.setAttribute('class', 'application-breadcrumb__link');
      link.textContent = employerName;
      breadcrumbElement.appendChild(link);
    });
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
   * Filter related items by active client/employer ref
   */
  function filterRelatedItems(context) {
    if (!context || !context.ref) return;

    if (context.type === CONFIG.VIEW_CLIENT) {
      const items = document.querySelectorAll('.related-items__item.show-on-client');
      const title = document.querySelector('.related-items__title.show-on-client');
      let visibleCount = 0;
      items.forEach((item) => {
        const clients = (item.getAttribute('data-clients') || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
        const matches = clients.includes(context.ref);
        item.style.display = matches ? '' : 'none';
        if (matches) visibleCount += 1;
      });
      if (title) {
        title.style.display = visibleCount > 0 ? '' : 'none';
      }
    }

    if (context.type === CONFIG.VIEW_EMPLOYER) {
      const items = document.querySelectorAll('.related-items__item.show-on-employer');
      const title = document.querySelector('.related-items__title.show-on-employer');
      let visibleCount = 0;
      items.forEach((item) => {
        const employers = (item.getAttribute('data-employers') || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
        const matches = employers.includes(context.ref);
        item.style.display = matches ? '' : 'none';
        if (matches) visibleCount += 1;
      });
      if (title) {
        title.style.display = visibleCount > 0 ? '' : 'none';
      }
    }
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
    filterRelatedItems(context);
    updateContactButton(context);
      });
    } else {
      propagateToLinks(context);
      updateBreadcrumbs(context);
      updateTableOfContents(context);
      filterRelatedItems(context);
      updateContactButton(context);
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
