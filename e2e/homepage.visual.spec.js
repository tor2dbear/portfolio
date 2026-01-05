const { test, expect } = require('@playwright/test');

/**
 * Visual regression tests for the homepage
 * These tests capture screenshots and compare them against baseline images
 * to detect unintended visual changes.
 */

test.describe('Homepage Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('homepage should look correct in light mode', async ({ page }) => {
    // Ensure light mode is active
    await page.evaluate(() => {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    });

    // Wait a bit for any transitions to complete
    await page.waitForTimeout(300);

    // Take screenshot and compare with baseline
    await expect(page).toHaveScreenshot('homepage-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('homepage header should be visible and styled correctly', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Take screenshot of just the header
    await expect(header).toHaveScreenshot('homepage-header.png', {
      animations: 'disabled',
    });
  });

  test('homepage navigation menu should display correctly', async ({ page }) => {
    const menu = page.locator('#menu');
    await expect(menu).toBeVisible();

    // Take screenshot of the menu
    await expect(menu).toHaveScreenshot('homepage-menu.png', {
      animations: 'disabled',
    });
  });

  test('homepage footer should be styled correctly', async ({ page }) => {
    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();
      await expect(footer).toHaveScreenshot('homepage-footer.png', {
        animations: 'disabled',
      });
    }
  });

  test('homepage should handle viewport resize correctly', async ({ page }) => {
    // Test at common breakpoint
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
