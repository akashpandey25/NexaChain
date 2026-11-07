const { test, expect } = require('@playwright/test');
const { createTestUserFixture, cleanupTestData, closeDbConnection } = require('./testHelpers');
const path = require('path');
const mongoose = require(path.resolve(__dirname, '../backend/node_modules/mongoose'));

test.describe('Phase 4.2 Investments Refinement & Verification', () => {
  let userFixture;
  let userObjectId;
  let activeInvId;
  let pendingInvId;
  let cancelledInvId;

  test.beforeAll(async () => {
    userFixture = await createTestUserFixture({
      name: 'Taylor Portfolio Auditor',
      walletBalancePaise: 15000000 // ₹150,000.00
    });

    userObjectId = new mongoose.Types.ObjectId(userFixture._id);
    const db = mongoose.connection.db;

    // Seed 1: Active Investment
    const inv1Res = await db.collection('investments').insertOne({
      user: userObjectId,
      planName: 'Starter Growth',
      principalAmountPaise: 5000000, // ₹50,000.00
      roiPercentage: 1.5,
      status: 'active',
      totalRoiEarnedPaise: 225000, // ₹2,250.00
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });
    activeInvId = inv1Res.insertedId.toString();

    // Seed 2: Pending Investment
    const inv2Res = await db.collection('investments').insertOne({
      user: userObjectId,
      planName: 'Elite Capital',
      principalAmountPaise: 10000000, // ₹100,000.00
      roiPercentage: 2.0,
      status: 'pending',
      totalRoiEarnedPaise: 0,
      startDate: null,
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    pendingInvId = inv2Res.insertedId.toString();

    // Seed 3: Completed Investment
    await db.collection('investments').insertOne({
      user: userObjectId,
      planName: 'Pioneer Yield',
      principalAmountPaise: 2500000, // ₹25,000.00
      roiPercentage: 1.2,
      status: 'completed',
      totalRoiEarnedPaise: 300000, // ₹3,000.00
      startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    });

    // Seed 4: Cancelled Investment with Rejection Reason
    const inv4Res = await db.collection('investments').insertOne({
      user: userObjectId,
      planName: 'Starter Growth',
      principalAmountPaise: 2000000, // ₹20,000.00
      roiPercentage: 1.5,
      status: 'cancelled',
      totalRoiEarnedPaise: 0,
      startDate: null,
      endDate: null,
      rejectionReason: 'KYC identity mismatch during verification.',
      actionedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    cancelledInvId = inv4Res.insertedId.toString();
  });

  test.afterAll(async () => {
    await cleanupTestData();
    await closeDbConnection();
  });

  test('1. Verifies refined investments page layout, filters, metrics and captures Desktop (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/investments');
    await expect(page.getByRole('heading', { name: /investment portfolio/i })).toBeVisible();

    // 1. KPI cards verification
    await expect(page.getByText('Total Invested')).toBeVisible();
    await expect(page.getByText('Active Capital')).toBeVisible();
    await expect(page.getByText('Total ROI Earned')).toBeVisible();
    await expect(page.getByText('Portfolio Contracts')).toBeVisible();

    // 2. Filter bar verification
    await expect(page.getByRole('button', { name: /^all/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^active/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^pending/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^completed/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^cancelled/i })).toBeVisible();

    // 3. Table verification
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('table').getByText('Starter Growth').first()).toBeVisible();
    await expect(page.getByRole('table').getByText('Elite Capital').first()).toBeVisible();

    // 4. Lifecycle guide verification
    await expect(page.getByText('Investment Lifecycle & Status Guide')).toBeVisible();

    // Capture desktop portfolio screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/investments-desktop-1440.png'),
      fullPage: true
    });

    // 5. Open Create Investment modal
    await page.getByRole('button', { name: /create investment/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('heading', { name: /request new investment contract/i })).toBeVisible();
    await expect(page.getByText(/unfunded application & testing configuration notice/i)).toBeVisible();

    // Fill an amount to preview paise
    await page.locator('#investment-amount').fill('25000');
    await expect(page.getByText(/25,00,000 paise/i)).toBeVisible();

    // Capture modal screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/investments-modal-1440.png')
    });

    // Close modal via Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('2. Verifies responsive adaptation on Tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/investments');
    await expect(page.getByRole('heading', { name: /investment portfolio/i })).toBeVisible();

    // Check no horizontal scrollbar on tablet
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(768);

    // Capture tablet screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/investments-tablet-768.png'),
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

    await page.goto('/investments');
    await expect(page.getByRole('heading', { name: /investment portfolio/i })).toBeVisible();

    // Desktop table should be hidden on mobile
    await expect(page.getByRole('table')).not.toBeVisible();

    // Mobile card list should be rendered
    const mobileCards = page.locator('.md\\:hidden');
    await expect(mobileCards.getByText('Starter Growth').first()).toBeVisible();

    // Check no horizontal overflow on mobile
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);

    // Capture mobile screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/investments-mobile-390.png'),
      fullPage: true
    });
  });

  test('4. Verifies Investment Detail Page layout on Desktop and Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Navigate to active investment detail
    await page.goto(`/investments/${activeInvId}`);
    await expect(page.getByRole('heading', { name: /starter growth package/i })).toBeVisible();
    await expect(page.getByText('Principal Amount')).toBeVisible();
    await expect(page.getByText('Total ROI Generated')).toBeVisible();
    await expect(page.getByText('Daily Yield Rate')).toBeVisible();
    await expect(page.getByText('Contract Specifications & Dates')).toBeVisible();

    // Capture desktop detail view screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/investments-detail-desktop-1440.png'),
      fullPage: true
    });

    // Check cancelled investment detail view for rejection reason banner
    await page.goto(`/investments/${cancelledInvId}`);
    await expect(page.getByText(/contract cancelled \/ rejected/i)).toBeVisible();
    await expect(page.getByText(/KYC identity mismatch during verification/i).first()).toBeVisible();
    await expect(page.getByText(/decision recorded on/i)).toBeVisible();

    // Check pending investment detail view for awaiting review banner
    await page.goto(`/investments/${pendingInvId}`);
    await expect(page.getByText(/request awaiting administrative review/i)).toBeVisible();
    await expect(page.getByText(/pending administrative activation/i)).toBeVisible();

    // Mobile detail view check
    await page.setViewportSize({ width: 390, height: 844 });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);

    // Capture mobile detail screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/investments-detail-mobile-390.png'),
      fullPage: true
    });
  });
});
