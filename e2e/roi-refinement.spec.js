const { test, expect } = require('@playwright/test');
const { createTestUserFixture, cleanupTestData, closeDbConnection } = require('./testHelpers');
const path = require('path');
const mongoose = require(path.resolve(__dirname, '../backend/node_modules/mongoose'));

test.describe('Phase 4.3 ROI History & Ledger Refinement & Verification', () => {
  let userFixture;
  let userObjectId;
  let investmentId;

  test.beforeAll(async () => {
    userFixture = await createTestUserFixture({
      name: 'Alex Ledger Auditor',
      walletBalancePaise: 8500000 // ₹85,000.00
    });

    userObjectId = new mongoose.Types.ObjectId(userFixture._id);
    const db = mongoose.connection.db;

    // Seed active investment contract
    const invRes = await db.collection('investments').insertOne({
      user: userObjectId,
      planName: 'Enterprise Growth',
      principalAmountPaise: 5000000, // ₹50,000.00
      roiPercentage: 1.5,
      status: 'active',
      totalRoiEarnedPaise: 375000, // ₹3,750.00
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });
    investmentId = invRes.insertedId;

    // Seed 5 consecutive days of processed ROI ledger records
    const today = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setUTCHours(0, 0, 0, 0);

      const dateKey = d.toISOString().split('T')[0];

      await db.collection('roi_histories').insertOne({
        user: userObjectId,
        investment: investmentId,
        amountPaise: 75000, // ₹750.00 / day
        roiPercentageApplied: 1.5,
        businessDate: d,
        status: 'processed',
        transactionKey: `${investmentId}_${dateKey}`,
        createdAt: new Date(d.getTime() + 1000 * 60 * 5),
        updatedAt: new Date(d.getTime() + 1000 * 60 * 5)
      });
    }
  });

  test.afterAll(async () => {
    await cleanupTestData();
    await closeDbConnection();
  });

  test('1. Verifies refined ROI history layout, metrics, chart, table and captures Desktop (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/roi-history');
    await expect(page.getByRole('heading', { name: /roi history & analytics/i })).toBeVisible();

    // 1. KPI cards verification
    await expect(page.getByText('TOTAL CREDITED ROI')).toBeVisible();
    await expect(page.getByText('POSTED CREDITS')).toBeVisible();
    await expect(page.getByText('PENDING RUNS')).toBeVisible();
    await expect(page.getByText('LATEST DISTRIBUTION')).toBeVisible();

    // Verify credited amount: 5 days * ₹750 = ₹3,750.00
    await expect(page.getByText('₹3,750.00').first()).toBeVisible();

    // 2. Chart verification
    await expect(page.getByText('Historical Credited ROI Performance')).toBeVisible();

    // 3. Filter bar verification
    await expect(page.getByRole('button', { name: /processed/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /pending/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /failed/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /all statuses/i })).toBeVisible();

    // 4. Ledger table verification
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('table').getByText('Enterprise Growth').first()).toBeVisible();
    await expect(page.getByRole('table').getByText('+₹750.00').first()).toBeVisible();
    await expect(page.getByRole('table').getByText(/processed/i).first()).toBeVisible();

    // 5. Governance notice verification
    await expect(page.getByText(/Automated Daily ROI Distribution Notice/i)).toBeVisible();

    // Capture desktop screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/roi-desktop-1440.png'),
      fullPage: true
    });
  });

  test('2. Verifies responsive adaptation on Tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/roi-history');
    await expect(page.getByRole('heading', { name: /roi history & analytics/i })).toBeVisible();

    // Check no horizontal scrollbar on tablet
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(768);

    // Capture tablet screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/roi-tablet-768.png'),
      fullPage: true
    });
  });

  test('3. Verifies mobile card list layout on Mobile (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/roi-history');
    await expect(page.getByRole('heading', { name: /roi history & analytics/i })).toBeVisible();

    // Desktop table should be hidden on mobile
    await expect(page.getByRole('table')).not.toBeVisible();

    // Mobile card list should be rendered
    const mobileCards = page.locator('.md\\:hidden');
    await expect(mobileCards.getByText('Enterprise Growth').first()).toBeVisible();
    await expect(mobileCards.getByText('+₹750.00').first()).toBeVisible();

    // Check no horizontal overflow on mobile
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);

    // Capture mobile screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/roi-mobile-390.png'),
      fullPage: true
    });
  });

  test('4. Verifies filtering and empty state behavior', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/roi-history');

    // Filter by 'pending' - should show empty state since all records are processed
    await page.getByRole('button', { name: /pending/i }).first().click();
    await expect(page.getByText('No ROI Records Found for Selected Filters')).toBeVisible();

    // Click 'Clear Filters' button
    await page.getByRole('button', { name: /clear filters/i }).click();

    // Should return to displaying all records
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('table').getByText('Enterprise Growth').first()).toBeVisible();
  });
});

