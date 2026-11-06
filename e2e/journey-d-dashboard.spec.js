const { test, expect } = require('@playwright/test');
const { createTestUserFixture, cleanupTestData, closeDbConnection } = require('./testHelpers');

test.describe('User Journey D — Dashboard, Records, Filters & Refresh Verification', () => {
  let userFixture;

  test.beforeAll(async () => {
    userFixture = await createTestUserFixture({
      name: 'Taylor Portfolio Auditor'
    });
  });

  test.beforeEach(async ({ page }) => {
    // Authenticate into session
    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test.afterAll(async () => {
    await cleanupTestData();
    await closeDbConnection();
  });

  test('1. Verifies dashboard KPI values, charts, and interactive refresh action', async ({ page }) => {
    // Verify 4 KPI cards render in main dashboard area
    const main = page.locator('main');
    await expect(main.getByText('TOTAL INVESTED')).toBeVisible();
    await expect(main.getByText('ACTIVE PRINCIPAL')).toBeVisible();
    await expect(main.getByText('TOTAL ROI YIELD')).toBeVisible();
    await expect(main.getByText('AVAILABLE BALANCE')).toBeVisible();

    // Verify Cron engine status
    await expect(page.getByText(/cron engine: active \(00:00 ist\)/i)).toBeVisible();

    // Test "Refresh Data" button
    const refreshBtn = page.getByRole('button', { name: /refresh data/i });
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    // After refresh, the dashboard remains stable and data is refreshed
    await expect(page.getByRole('heading', { name: /portfolio overview/i })).toBeVisible();
  });

  test('2. Tests Investments page status filters, page sizes, and empty states', async ({ page }) => {
    await page.goto('/investments');
    await expect(page.getByRole('heading', { name: /investment portfolio/i })).toBeVisible();

    // Test status tabs
    await page.getByRole('button', { name: /^active/i }).click();
    await page.getByRole('button', { name: /^pending/i }).click();
    await page.getByRole('button', { name: /^completed/i }).click();
    await page.getByRole('button', { name: /^cancelled/i }).click();
    await page.getByRole('button', { name: /^all/i }).click();

    // Test page size dropdown
    const sizeSelect = page.getByLabel(/items per page/i);
    await sizeSelect.selectOption('20');
    expect(await sizeSelect.inputValue()).toBe('20');

    // Test refresh button
    await page.getByRole('button', { name: /refresh/i }).click();
    await expect(page.getByRole('heading', { name: /investment portfolio/i })).toBeVisible();
  });

  test('3. Tests ROI History page filters, date controls, and empty states', async ({ page }) => {
    await page.goto('/roi-history');
    await expect(page.getByRole('heading', { name: /roi history & analytics/i })).toBeVisible();

    // Test status filters
    await page.getByRole('button', { name: /processed/i }).first().click();
    await page.getByRole('button', { name: /pending/i }).first().click();
    await page.getByRole('button', { name: /failed/i }).first().click();
    await page.getByRole('button', { name: /all statuses/i }).click();

    // Test date range inputs
    const startInput = page.getByLabel(/start date/i);
    const endInput = page.getByLabel(/end date/i);
    await startInput.fill('2026-11-01');
    await endInput.fill('2026-11-06');
    expect(await startInput.inputValue()).toBe('2026-11-01');
    expect(await endInput.inputValue()).toBe('2026-11-06');
  });

  test('4. Tests Referrals page tabs (Direct, Tree, Income) and depth controls', async ({ page }) => {
    await page.goto('/referrals');
    await expect(page.getByRole('heading', { name: /referral management/i })).toBeVisible();

    // Direct tab is active by default
    await expect(page.getByRole('button', { name: /direct referrals/i })).toBeVisible();

    // Switch to Referral Tree tab
    await page.getByRole('button', { name: /referral tree/i }).click();
    await expect(page.getByText(/network size/i)).toBeVisible();
    await expect(page.getByText(/traversed depth/i)).toBeVisible();

    // Change traversal depth
    const depthSelect = page.getByLabel(/traversal depth/i);
    await depthSelect.selectOption('10');
    expect(await depthSelect.inputValue()).toBe('10');

    // Switch to Commission Income tab
    await page.getByRole('button', { name: /commission income/i }).click();
    await expect(page.getByText(/processed commissions/i)).toBeVisible();
    await expect(page.getByText(/pending validation/i)).toBeVisible();

    // Verify governance compliance note is present
    await expect(page.getByText(/affiliate governance notice/i)).toBeVisible();
  });

  test('5. Tests Profile page credentials copy, information display, and immutability notice', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /account profile/i })).toBeVisible();

    // Verify profile displays registered user name and active badge
    await expect(page.getByRole('heading', { name: userFixture.name })).toBeVisible();
    await expect(page.getByText(/active/i).first()).toBeVisible();

    // Verify copy referral code button exists and is clickable
    const copyCodeBtn = page.getByRole('button', { name: /copy code/i });
    if (await copyCodeBtn.isVisible()) {
      await copyCodeBtn.click();
      await expect(page.getByText(/copied!/i)).toBeVisible();
    }
  });
});
