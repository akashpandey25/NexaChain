const { test, expect } = require('@playwright/test');
const { createTestUserFixture, cleanupTestData, closeDbConnection } = require('./testHelpers');
const path = require('path');
const mongoose = require(path.resolve(__dirname, '../backend/node_modules/mongoose'));

test.describe('Phase 4.1 Dashboard Refinement & Verification', () => {
  let userFixture;
  let userObjectId;

  test.beforeAll(async () => {
    userFixture = await createTestUserFixture({
      name: 'Morgan FinTech Auditor',
      walletBalancePaise: 7500000 // ₹75,000.00
    });

    userObjectId = new mongoose.Types.ObjectId(userFixture._id);
    const db = mongoose.connection.db;

    // Seed realistic investments
    const inv1Res = await db.collection('investments').insertOne({
      user: userObjectId,
      planName: 'Starter Growth',
      principalAmountPaise: 5000000, // ₹50,000.00
      roiPercentage: 1.5,
      status: 'active',
      totalRoiEarnedPaise: 150000, // ₹1,500.00
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });

    await db.collection('investments').insertOne({
      user: userObjectId,
      planName: 'Elite Capital',
      principalAmountPaise: 10000000, // ₹100,000.00
      roiPercentage: 2.0,
      status: 'pending',
      totalRoiEarnedPaise: 0,
      startDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Seed realistic daily ROI history records
    const today = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setUTCHours(0, 0, 0, 0);

      await db.collection('roihistories').insertOne({
        user: userObjectId,
        investment: inv1Res.insertedId,
        businessDate: d,
        amountPaise: 75000, // ₹750.00 / day
        status: 'processed',
        createdAt: d,
        updatedAt: d
      });
    }
  });

  test.afterAll(async () => {
    await cleanupTestData();
    await closeDbConnection();
  });

  test('1. Verifies refined dashboard layout, metrics, charts, and captures Desktop (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 1. Heading and Authoritative Context
    await expect(page.getByRole('heading', { name: /portfolio overview/i })).toBeVisible();
    await expect(page.getByText(/cron engine: active \(00:00 ist\)/i)).toBeVisible();
    await expect(page.getByText(/integer paise precision/i)).toBeVisible();

    // 2. Verified KPI StatCards
    const main = page.locator('main');
    await expect(main.getByText('TOTAL INVESTED', { exact: true })).toBeVisible();
    await expect(main.getByText('ACTIVE PRINCIPAL', { exact: true })).toBeVisible();
    await expect(main.getByText('TOTAL ROI YIELD', { exact: true })).toBeVisible();
    await expect(main.getByText('AVAILABLE BALANCE', { exact: true })).toBeVisible();

    // Check financial numbers have tabular font
    const tabularNums = main.locator('.tabular-nums');
    expect(await tabularNums.count()).toBeGreaterThanOrEqual(4);

    // 3. Referral Network banner
    await expect(page.getByText('Multi-Level Referral Network')).toBeVisible();
    await expect(page.getByText('COMMISSION EARNED')).toBeVisible();
    await expect(page.getByText('DIRECT AFFILIATES')).toBeVisible();

    // 4. Charts rendered
    await expect(page.getByText('ROI Yield History & Growth')).toBeVisible();
    await expect(page.getByText('Portfolio Allocation')).toBeVisible();

    // 5. Recent Activity Table with canonical status badges and detail links
    await expect(page.getByText('Recent Activity & History')).toBeVisible();
    await expect(page.getByText('Investment Request: Elite Capital')).toBeVisible();
    await expect(page.getByRole('table').getByText('Pending Review')).toBeVisible();
    await expect(page.getByText('Active Contract: Starter Growth')).toBeVisible();

    // 6. Bottom quick navigation cards
    await expect(page.getByText('Manage Investments')).toBeVisible();
    await expect(page.getByText('Daily ROI Ledger')).toBeVisible();
    await expect(page.getByText('Referral Program')).toBeVisible();

    // Capture refined desktop screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/dashboard-refined-1440.png'),
      fullPage: true
    });
  });

  test('2. Verifies refined dashboard responsive adaptation on Tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await expect(page.getByRole('heading', { name: /portfolio overview/i })).toBeVisible();

    // Verify no horizontal overflow on tablet
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // Capture refined tablet screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/dashboard-refined-768.png'),
      fullPage: true
    });
  });

  test('3. Verifies refined dashboard mobile density and drawer on Mobile (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await expect(page.getByRole('heading', { name: /portfolio overview/i })).toBeVisible();

    // Verify no horizontal page overflow on mobile
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // Verify mobile drawer focus management
    const menuBtn = page.getByRole('button', { name: /open sidebar menu/i });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    const drawer = page.getByRole('dialog', { name: 'Mobile Navigation' });
    await expect(drawer).toBeVisible();

    // Verify close button received focus
    const closeBtn = page.getByRole('button', { name: /close navigation menu/i });
    await expect(closeBtn).toBeFocused();

    // Press Escape to dismiss drawer
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();

    // Verify focus returned to the trigger button
    await expect(menuBtn).toBeFocused();

    // Capture refined mobile screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/dashboard-refined-390.png'),
      fullPage: true
    });
  });
});
