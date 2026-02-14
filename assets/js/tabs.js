/**
 * Tabs component
 * Generic tab switching for containers with data-js="tabs".
 */

(function () {
  const tabContainers = Array.from(document.querySelectorAll('[data-js]')).filter((node) => {
    const value = node.getAttribute('data-js') || '';
    return value.split(/\s+/).includes('tabs');
  });

  if (tabContainers.length === 0) {
    return;
  }

  tabContainers.forEach((tabsContainer) => {
    const tabButtons = Array.from(tabsContainer.querySelectorAll('.tab-button[data-tab]')).filter((button) => {
      const owner = button.closest('[data-js]');
      const value = owner ? owner.getAttribute('data-js') || '' : '';
      return owner === tabsContainer && value.split(/\s+/).includes('tabs');
    });
    const tabPanels = Array.from(tabsContainer.querySelectorAll('.tab-panel[data-panel]')).filter((panel) => {
      const owner = panel.closest('[data-js]');
      const value = owner ? owner.getAttribute('data-js') || '' : '';
      return owner === tabsContainer && value.split(/\s+/).includes('tabs');
    });

    if (tabButtons.length === 0 || tabPanels.length === 0) {
      return;
    }

    const storageKey = tabsContainer.getAttribute('data-tabs-storage-key');

    function switchTab(tabName) {
      tabButtons.forEach((button) => {
        const isActive = button.dataset.tab === tabName;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      tabPanels.forEach((panel) => {
        const isActive = panel.dataset.panel === tabName;
        panel.classList.toggle('is-active', isActive);
      });

      if (storageKey) {
        try {
          localStorage.setItem(storageKey, tabName);
        } catch (e) {
          // Ignore storage errors.
        }
      }
    }

    tabButtons.forEach((button) => {
      // Ensure tabs never trigger form submit/default navigation behavior.
      if (!button.hasAttribute('type')) {
        button.setAttribute('type', 'button');
      }

      button.addEventListener('click', (event) => {
        event.preventDefault();
        switchTab(button.dataset.tab);
      });
    });

    if (storageKey) {
      try {
        const savedTab = localStorage.getItem(storageKey);
        const exists = Array.from(tabButtons).some((button) => button.dataset.tab === savedTab);
        if (savedTab && exists) {
          switchTab(savedTab);
        }
      } catch (e) {
        // Ignore storage errors.
      }
    }
  });
})();
