const { test, expect } = require('@playwright/test');

/**
 * EXAMPLE: How to write visual regression tests
 *
 * This file demonstrates common patterns for visual testing.
 * Copy and adapt these examples for your own tests.
 */

test.describe('Example Visual Tests', () => {

  // Example 1: Basic full-page screenshot
  test('basic full-page screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('example-fullpage.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  // Example 2: Screenshot a specific element
  test('screenshot specific element', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await expect(header).toHaveScreenshot('example-header.png', {
      animations: 'disabled',
    });
  });

  // Example 3: Test different viewport sizes
  test('responsive design test', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300); // Wait for any transitions

    await expect(page).toHaveScreenshot('example-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  // Example 4: Test user interactions
  test('test interactive state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot before interaction
    await expect(page).toHaveScreenshot('example-before-click.png', {
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 600 },
    });

    // Perform interaction
    const button = page.locator('button#someButton');
    if (await button.count() > 0) {
      await button.click();
      await page.waitForTimeout(500);

      // Screenshot after interaction
      await expect(page).toHaveScreenshot('example-after-click.png', {
        fullPage: false,
        clip: { x: 0, y: 0, width: 800, height: 600 },
      });
    }
  });

  // Example 5: Test with custom page state
  test('test with custom state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Modify page state with JavaScript
    await page.evaluate(() => {
      document.body.classList.add('custom-state');
      localStorage.setItem('testKey', 'testValue');
    });

    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('example-custom-state.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  // Example 6: Test multiple elements in a loop
  test('test multiple components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const components = [
      { selector: 'header', name: 'header' },
      { selector: 'nav', name: 'navigation' },
      { selector: 'footer', name: 'footer' },
    ];

    for (const component of components) {
      const element = page.locator(component.selector);
      if (await element.count() > 0) {
        await expect(element).toHaveScreenshot(
          `example-${component.name}.png`,
          { animations: 'disabled' }
        );
      }
    }
  });

  // Example 7: Test with specific conditions
  test('conditional screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if element exists before testing
    const menu = page.locator('#menu');
    const menuExists = await menu.count() > 0;

    if (menuExists) {
      // Only test if the element exists
      await expect(menu).toHaveScreenshot('example-conditional.png', {
        animations: 'disabled',
      });
    } else {
      // Skip or handle differently
      test.skip();
    }
  });

  // Example 8: Test hover states (use with caution - can be flaky)
  test('hover state test', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const link = page.locator('a').first();

    // Hover over element
    await link.hover();
    await page.waitForTimeout(200);

    await expect(link).toHaveScreenshot('example-hover.png', {
      animations: 'disabled',
    });
  });

  // Example 9: Test clipped area (useful for large pages)
  test('clipped screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Only capture a specific region
    await expect(page).toHaveScreenshot('example-clipped.png', {
      clip: {
        x: 0,
        y: 0,
        width: 800,
        height: 600
      },
      animations: 'disabled',
    });
  });

  // Example 10: Test with custom threshold (for minor acceptable differences)
  test('screenshot with threshold', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('example-threshold.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixels: 100, // Allow up to 100 pixels to differ
      // OR use maxDiffPixelRatio: 0.01 for 1% difference
    });
  });
});

/**
 * TIPS:
 *
 * 1. Always wait for networkidle or load state before screenshots
 * 2. Disable animations for consistent screenshots
 * 3. Use waitForTimeout sparingly - prefer waitForSelector
 * 4. Test actual user-facing changes, not implementation details
 * 5. Keep test names descriptive
 * 6. Group related tests in describe blocks
 * 7. Review all diffs before updating baselines
 * 8. Use .skip() to temporarily disable flaky tests while fixing
 * 9. Use test.only() during development to run single tests
 * 10. Consider using fixtures for common setup
 */
