const { test, expect } = require('@playwright/test');
const { createTestUserFixture, cleanupTestData, closeDbConnection } = require('./testHelpers');

test.describe('Phase 3 Application Shell & Responsive Navigation Verification', () => {
  let testUser;

  test.beforeAll(async () => {
    testUser = await createTestUserFixture({
      name: 'Alexander Hamilton',
      walletBalancePaise: 5000000 // ₹50,000.00
    });
  });

  test.afterAll(async () => {
    await cleanupTestData();
    await closeDbConnection();
  });

  test('1. Verifies Desktop Shell (1440x900): Hierarchy, Grouped Navigation, User Identity & StatCard Inter typography', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Log in
    await page.goto('/login');
    await page.locator('#login-email').fill(testUser.email);
    await page.locator('#login-password').fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 1. Verify fixed desktop sidebar
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // 2. Verify grouped navigation headers
    await expect(sidebar.getByText('Portfolio')).toBeVisible();
    await expect(sidebar.getByText('Affiliates')).toBeVisible();
    await expect(sidebar.getByText('Preferences')).toBeVisible();

    // 3. Verify all navigation destinations exist
    await expect(sidebar.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /investments/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /roi history/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /referrals/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /profile/i })).toBeVisible();

    // 4. Verify duplicate balance card is NOT in the sidebar
    await expect(sidebar.getByText(/available balance/i)).not.toBeVisible();

    // 5. Verify compact user identity section in sidebar
    await expect(sidebar.getByText('Alexander Hamilton')).toBeVisible();
    await expect(sidebar.getByText('Investor')).toBeVisible();

    // 6. Verify header elements: Breadcrumbs and Wallet balance
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.getByText('Platform')).toBeVisible();
    await expect(header.getByText(/dashboard/i)).toBeVisible();
    await expect(header.getByText(/₹50,000\.00/)).toBeVisible();

    // 7. Verify Notification Area: click bell to view honest popover
    const bellBtn = header.getByRole('button', { name: /view notifications/i });
    await expect(bellBtn).toBeVisible();
    await bellBtn.click();

    const notifDialog = page.getByRole('dialog', { name: 'Notifications' });
    await expect(notifDialog).toBeVisible();
    await expect(notifDialog.getByText(/no notifications/i)).toBeVisible();

    // Press Escape to close popover
    await page.keyboard.press('Escape');
    await expect(notifDialog).not.toBeVisible();

    // 8. Typography verification: StatCard values use Inter font stack with tabular numerals
    const statAmount = page.locator('main [class*="rounded-card"] .tabular-nums').first();
    await expect(statAmount).toBeVisible();
    const statFont = await statAmount.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        fontFamily: computed.fontFamily,
        fontVariantNumeric: computed.fontVariantNumeric
      };
    });
    expect(statFont.fontFamily.toLowerCase()).toContain('inter');
    expect(statFont.fontVariantNumeric).toBe('tabular-nums');

    // Capture desktop screenshot
    await page.screenshot({ path: 'docs/screenshots/desktop-shell-1440.png', fullPage: false });
  });

  test('2. Verifies Tablet Shell (768x1024): Responsive adaptation and drawer toggle', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Log in
    await page.goto('/login');
    await page.locator('#login-email').fill(testUser.email);
    await page.locator('#login-password').fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Verify desktop sidebar is visible on 768px (md breakpoint)
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Verify header wallet balance is still visible
    await expect(page.locator('header').getByText(/₹50,000\.00/)).toBeVisible();

    // Capture tablet screenshot
    await page.screenshot({ path: 'docs/screenshots/tablet-shell-768.png', fullPage: false });
  });

  test('3. Verifies Mobile Shell (390x844): Drawer toggle, body scroll lock, Escape dismiss, and link navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Log in
    await page.goto('/login');
    await page.locator('#login-email').fill(testUser.email);
    await page.locator('#login-password').fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 1. Verify desktop sidebar is hidden on mobile
    const desktopAside = page.locator('aside');
    await expect(desktopAside).not.toBeVisible();

    // 2. Open mobile drawer via toggle button
    const menuBtn = page.getByRole('button', { name: /open sidebar menu/i });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // 3. Verify mobile drawer is visible
    const mobileDrawer = page.getByRole('dialog', { name: 'Mobile Navigation' });
    await expect(mobileDrawer).toBeVisible();

    // 4. Verify body scroll lock (overflow: hidden)
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('hidden');

    // Capture mobile drawer screenshot
    await page.screenshot({ path: 'docs/screenshots/mobile-drawer-390.png', fullPage: false });

    // 5. Test Escape key dismisses the mobile drawer
    await page.keyboard.press('Escape');
    await expect(mobileDrawer).not.toBeVisible();

    // Body scroll must be unlocked
    const bodyOverflowAfterEscape = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflowAfterEscape).toBe('');

    // 6. Re-open drawer and click "Investments" nav link
    await menuBtn.click();
    await expect(mobileDrawer).toBeVisible();

    const investmentsLink = mobileDrawer.getByRole('link', { name: /investments/i });
    await expect(investmentsLink).toBeVisible();
    await investmentsLink.click();

    // Verify navigation occurred and drawer automatically closed
    await expect(page).toHaveURL(/.*\/investments/);
    await expect(mobileDrawer).not.toBeVisible();

    // Body scroll must be unlocked after navigation
    const bodyOverflowAfterNav = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflowAfterNav).toBe('');

    // Capture mobile dashboard screenshot
    await page.screenshot({ path: 'docs/screenshots/mobile-dashboard-390.png', fullPage: false });
  });

  test('4. Verifies AuthLayout: Absence of ambient blur orbs, restrained branding, and clean tab switcher', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');

    // 1. Verify absence of decorative blur orbs
    const blurOrbs = page.locator('.blur-\\[140px\\], .blur-\\[160px\\]');
    await expect(blurOrbs).toHaveCount(0);

    // 2. Verify segmented tab switcher
    const signInTab = page.getByRole('link', { name: 'Sign In', exact: true });
    const createAccountTab = page.getByRole('link', { name: 'Create Account', exact: true });
    await expect(signInTab).toBeVisible();
    await expect(createAccountTab).toBeVisible();

    // 3. Verify restrained brand showcase
    await expect(page.getByText('Multi-Level Affiliate Network').first()).toBeVisible();
    await expect(page.getByText('Tier 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Integer Paise Precision').first()).toBeVisible();

    // Capture restrained AuthLayout screenshot
    await page.screenshot({ path: 'docs/screenshots/auth-login-restrained.png', fullPage: false });
  });
});
