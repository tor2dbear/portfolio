/**
 * UI Library Tabs
 * Handles UI-library specific behavior (ordering, token hydration, demos).
 */

(function () {
  const tabsContainer = document.querySelector('[data-ui-library-tabs]');

  if (!tabsContainer) {
    return;
  }

  const tabPanels = tabsContainer.querySelectorAll('.tab-panel');

  /**
   * Sort direct child details elements by stable data-sort key.
   * @param {Element|null} container
   */
  function sortDetailsByKey(container) {
    if (!container) {
      return;
    }

    const detailsList = Array.from(container.children).filter((child) => child.matches('details'));
    if (detailsList.length < 2) {
      return;
    }

    detailsList
      .sort((a, b) => {
        const keyA = (a.dataset.sort || '').toLowerCase();
        const keyB = (b.dataset.sort || '').toLowerCase();
        return keyA.localeCompare(keyB, 'en');
      })
      .forEach((details) => {
        container.appendChild(details);
      });
  }

  /**
   * Apply deterministic accordion ordering for UI Library.
   */
  function sortUiLibraryAccordions() {
    tabPanels.forEach((panel) => sortDetailsByKey(panel));

    // Tokens tab: nested accordions for scales and semantic groups.
    tabsContainer.querySelectorAll('#panel-tokens .token-section').forEach((section) => {
      sortDetailsByKey(section);
    });
  }

  // Keep section order deterministic across languages using English sort keys.
  sortUiLibraryAccordions();

  // Toggle demo controls used in UI Library examples.
  const toggleDemos = tabsContainer.querySelectorAll('[data-js="ui-library-toggle-demo"]');
  toggleDemos.forEach((toggleButton) => {
    toggleButton.addEventListener('click', () => {
      const isPressed = toggleButton.getAttribute('aria-pressed') === 'true';
      toggleButton.setAttribute('aria-pressed', isPressed ? 'false' : 'true');
    });
  });

  /**
   * Fill token value placeholders from computed custom properties.
   */
  function hydrateTokenValues() {
    const rootStyles = window.getComputedStyle(document.documentElement);
    const valueNodes = tabsContainer.querySelectorAll('[data-token-value]');
    valueNodes.forEach((node) => {
      const tokenName = node.getAttribute('data-token-value');
      if (!tokenName) {
        return;
      }

      const value = rootStyles.getPropertyValue(tokenName).trim();
      if (!value) {
        return;
      }

      node.textContent = value;
    });
  }

  /**
   * Restart all motion demos under the current tab container.
   */
  function replayMotionDemos() {
    const animatedNodes = tabsContainer.querySelectorAll('.motion-demo-dot, .motion-distance-chip');
    animatedNodes.forEach((node) => {
      node.classList.add('is-restarting');
      // Force a reflow so animation restarts reliably.
      void node.offsetWidth;
      node.classList.remove('is-restarting');
    });
  }

  const motionReplayButtons = tabsContainer.querySelectorAll('[data-js="motion-replay"]');
  motionReplayButtons.forEach((button) => {
    button.addEventListener('click', () => {
      replayMotionDemos();
    });
  });

  hydrateTokenValues();
})();
