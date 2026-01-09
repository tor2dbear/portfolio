/**
 * UI Library Tabs
 * Handles tab switching and accordion behavior for the UI library page
 */

(function () {
  const tabsContainer = document.querySelector('[data-js="ui-library-tabs"]');

  if (!tabsContainer) {
    return;
  }

  const tabButtons = tabsContainer.querySelectorAll('.tab-button');
  const tabPanels = tabsContainer.querySelectorAll('.tab-panel');

  /**
   * Switch to a specific tab
   * @param {string} tabName - The data-tab value to switch to
   */
  function switchTab(tabName) {
    // Update buttons
    tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === tabName;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Update panels
    tabPanels.forEach((panel) => {
      const isActive = panel.dataset.panel === tabName;
      panel.classList.toggle('is-active', isActive);
    });

    // Optional: Save to localStorage
    try {
      localStorage.setItem('ui-library-active-tab', tabName);
    } catch (e) {
      // Silent fail if localStorage is not available
    }
  }

  /**
   * Restore previously active tab from localStorage
   */
  function restoreActiveTab() {
    try {
      const savedTab = localStorage.getItem('ui-library-active-tab');
      if (savedTab) {
        switchTab(savedTab);
      }
    } catch (e) {
      // Silent fail if localStorage is not available
    }
  }

  // Add click handlers to tab buttons
  tabButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      const tabName = button.dataset.tab;
      switchTab(tabName);
    });
  });

  // Restore active tab on page load
  restoreActiveTab();
})();
