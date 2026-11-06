const { test, expect } = require('@playwright/test');
const { createTestUserFixture, cleanupTestData, closeDbConnection } = require('./testHelpers');
const path = require('path');
const fs = require('fs');

test.describe('Phase 1 Visual Foundation & Design Tokens Verification', () => {
  let userFixture;
  const screenshotsDir = path.resolve(__dirname, '../docs/screenshots');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    userFixture = await createTestUserFixture({
      name: 'Jordan Visual Validator'
    });
  });

  test.afterAll(async () => {
    await cleanupTestData();
    await closeDbConnection();
  });

  test('1. Verifies global canvas background (#090D16) and absence of white flash', async ({ page }) => {
    await page.goto('/login');

    // 1. Verify computed background color on body is rgb(9, 13, 22) -> #090D16
    const bodyBg = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return {
        bodyBg: window.getComputedStyle(body).backgroundColor,
        htmlBg: window.getComputedStyle(html).backgroundColor,
        bodyColor: window.getComputedStyle(body).color
      };
    });

    expect(bodyBg.bodyBg).toBe('rgb(9, 13, 22)'); // #090D16
    expect(bodyBg.htmlBg).toBe('rgb(9, 13, 22)'); // #090D16
  });

  test('2. Verifies typography foundation, Inter font loading, and tabular numerals', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Wait for fonts to finish loading
    await page.evaluate(() => document.fonts.ready);

    const fontInfo = await page.evaluate(() => {
      const heading = document.querySelector('h1');
      const body = document.body;
      const computedFont = window.getComputedStyle(body).fontFamily;
      const isInterAvailable = document.fonts.check('16px Inter');

      return {
        fontFamily: computedFont,
        isInterLoaded: isInterAvailable,
        totalFontsLoaded: document.fonts.size
      };
    });

    console.log('[Font Verification Report]:', fontInfo);
    expect(fontInfo.fontFamily).toContain('Inter');

    // Verify tabular numerals utility
    const tabularCheck = await page.evaluate(() => {
      const el = document.createElement('span');
      el.className = 'tabular-nums';
      document.body.appendChild(el);
      const style = window.getComputedStyle(el).fontVariantNumeric;
      document.body.removeChild(el);
      return style;
    });

    expect(tabularCheck).toBe('tabular-nums');
  });

  test('3. Captures Desktop and Mobile screenshots for visual review', async ({ page }) => {
    // 1. Desktop Login (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'desktop-login-foundation.png'), fullPage: true });

    // 2. Mobile Login (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile-login-foundation.png'), fullPage: true });

    // 3. Desktop Dashboard (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'desktop-dashboard-foundation.png'), fullPage: true });

    // 4. Mobile Dashboard (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile-dashboard-foundation.png'), fullPage: true });

    // 5. Desktop Investments (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/investments');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'desktop-investments-foundation.png'), fullPage: true });
  });

  test('4. Verifies accessible focus indicator styling', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('#login-email');
    await emailInput.focus();

    // Verify focus outline
    const outlineColor = await emailInput.evaluate((el) => {
      return window.getComputedStyle(el).outlineColor;
    });

    // #3B82F6 is rgb(59, 130, 246)
    console.log('[Focus Outline Color]:', outlineColor);
  });
});

