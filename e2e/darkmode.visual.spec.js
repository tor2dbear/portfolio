const { test, expect } = require('@playwright/test');

/**
 * Visual regression tests for dark mode
 * Tests that dark mode styling is applied correctly and looks good
 */

test.describe('Dark Mode Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('homepage should look correct in dark mode', async ({ page }) => {
    // Enable dark mode
    await page.evaluate(() => {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    });

    // Wait for dark mode styles to apply
    await page.waitForTimeout(300);

    // Take full page screenshot in dark mode
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('dark mode toggle should work correctly', async ({ page }) => {
    // Find the dark mode toggle button (adjust selector based on your implementation)
    const darkModeToggle = page.locator('[data-darkmode-toggle], .dark-mode-toggle, #dark-mode-toggle');

    if (await darkModeToggle.count() > 0) {
      // Take screenshot before toggle
      await expect(page).toHaveScreenshot('before-dark-mode-toggle.png', {
        fullPage: false,
        clip: { x: 0, y: 0, width: 1280, height: 400 },
        animations: 'disabled',
      });

      // Click the toggle
      await darkModeToggle.click();
      await page.waitForTimeout(500); // Wait for transition

      // Take screenshot after toggle
      await expect(page).toHaveScreenshot('after-dark-mode-toggle.png', {
        fullPage: false,
        clip: { x: 0, y: 0, width: 1280, height: 400 },
        animations: 'disabled',
      });
    }
  });

  test('dark mode should persist after navigation', async ({ page }) => {
    // Enable dark mode
    await page.evaluate(() => {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    });
    await page.waitForTimeout(300);

    // Navigate to another page (adjust URL based on your site structure)
    await page.goto('/about/');
    await page.waitForLoadState('networkidle');

    // Check if dark mode is still active
    const isDarkMode = await page.evaluate(() => {
      return document.body.classList.contains('dark-mode');
    });

    expect(isDarkMode).toBe(true);

    // Take screenshot to verify dark mode on different page
    await expect(page).toHaveScreenshot('about-page-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('dark mode should style all key components correctly', async ({ page }) => {
    await page.evaluate(() => {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    });
    await page.waitForTimeout(300);

    // Test header in dark mode
    const header = page.locator('header');
    if (await header.count() > 0) {
      await expect(header).toHaveScreenshot('header-dark.png', {
        animations: 'disabled',
      });
    }

    // Test menu in dark mode
    const menu = page.locator('#menu');
    if (await menu.count() > 0) {
      await expect(menu).toHaveScreenshot('menu-dark.png', {
        animations: 'disabled',
      });
    }

    // Test footer in dark mode
    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      await expect(footer).toHaveScreenshot('footer-dark.png', {
        animations: 'disabled',
      });
    }
  });

  test('dark mode should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Enable dark mode
    await page.evaluate(() => {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    });
    await page.waitForTimeout(300);

    // Take screenshot
    await expect(page).toHaveScreenshot('homepage-dark-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
