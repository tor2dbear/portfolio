const { test, expect } = require('@playwright/test');

/**
 * Visual regression tests for responsive design
 * Tests different viewport sizes and common breakpoints
 */

// Common viewport sizes to test
const viewports = {
  mobile: { width: 375, height: 667, name: 'mobile' },
  mobileLandscape: { width: 667, height: 375, name: 'mobile-landscape' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  tabletLandscape: { width: 1024, height: 768, name: 'tablet-landscape' },
  desktop: { width: 1280, height: 720, name: 'desktop' },
  desktopLarge: { width: 1920, height: 1080, name: 'desktop-large' },
};

// Pages to test across viewports
const pages = [
  { url: '/', name: 'homepage' },
  { url: '/about/', name: 'about' },
  { url: '/contact/', name: 'contact' },
  { url: '/works/', name: 'works' },
];

test.describe('Responsive Design Visual Tests', () => {
  // Test each page at different viewports
  for (const pageConfig of pages) {
    test.describe(`${pageConfig.name} page`, () => {
      for (const [key, viewport] of Object.entries(viewports)) {
        test(`should render correctly at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
          // Set viewport size
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });

          // Navigate to page
          await page.goto(pageConfig.url);
          await page.waitForLoadState('networkidle');

          // Wait for any animations to complete
          await page.waitForTimeout(300);

          // Take screenshot
          await expect(page).toHaveScreenshot(
            `${pageConfig.name}-${viewport.name}.png`,
            {
              fullPage: true,
              animations: 'disabled',
            }
          );
        });
      }
    });
  }

  test.describe('Mobile menu behavior', () => {
    test('mobile menu should display correctly when opened', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find and click the menu toggle (adjust selector based on your implementation)
      const menuToggle = page.locator('#menuLink, .menu-toggle, [data-menu-toggle]');

      if (await menuToggle.count() > 0) {
        // Screenshot before opening menu
        await expect(page).toHaveScreenshot('mobile-menu-closed.png', {
          fullPage: true,
          animations: 'disabled',
        });

        // Open menu
        await menuToggle.click();
        await page.waitForTimeout(500); // Wait for menu animation

        // Screenshot with menu open
        await expect(page).toHaveScreenshot('mobile-menu-open.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });

    test('menu should adapt correctly at tablet breakpoint', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const menu = page.locator('#menu, .menu, nav');
      if (await menu.count() > 0) {
        await expect(menu).toHaveScreenshot('menu-tablet.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Content layout at different breakpoints', () => {
    test('content should reflow correctly on narrow screens', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Check that content doesn't overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = 320;

      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

      await expect(page).toHaveScreenshot('content-narrow-screen.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('multi-column layout should work on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto('/works/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot('works-desktop-layout.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Images and media', () => {
    test('images should scale correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Wait for images to load
      await page.waitForLoadState('load');
      await page.waitForTimeout(500);

      // Check that no images overflow the viewport
      const overflowingImages = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.filter(img => img.offsetWidth > window.innerWidth).length;
      });

      expect(overflowingImages).toBe(0);

      await expect(page).toHaveScreenshot('images-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });
});
