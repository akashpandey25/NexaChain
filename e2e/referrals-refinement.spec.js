const { test, expect } = require('@playwright/test');
const { createTestUserFixture, cleanupTestData, closeDbConnection } = require('./testHelpers');
const path = require('path');
const mongoose = require(path.resolve(__dirname, '../backend/node_modules/mongoose'));
const bcrypt = require(path.resolve(__dirname, '../backend/node_modules/bcryptjs'));

test.describe('Phase 4.4 Referral Network, Tree & Commission Transparency Verification', () => {
  let sponsorFixture;
  let direct1User;
  let direct2User;
  let level2User;
  let investmentId;

  test.beforeAll(async () => {
    // 1. Create root sponsor user
    sponsorFixture = await createTestUserFixture({
      name: 'Alex Sponsor Prime',
      walletBalancePaise: 2500000 // ₹25,000.00
    });

    const db = mongoose.connection.db;
    const sponsorId = new mongoose.Types.ObjectId(sponsorFixture._id);
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const timestamp = Date.now();

    // 2. Create Level 1 Direct Referral 1 (Active)
    const direct1Res = await db.collection('users').insertOne({
      name: 'Beatrix Direct Alpha',
      email: `beatrix.alpha.${timestamp}@nexachain.test`,
      mobileNumber: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: passwordHash,
      role: 'user',
      referralCode: `DIR${Math.floor(10000 + Math.random() * 90000)}`,
      referredBy: sponsorId,
      walletBalancePaise: 5000000,
      totalRoiEarnedPaise: 0,
      totalLevelIncomeEarnedPaise: 0,
      isActive: true,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });
    direct1User = { _id: direct1Res.insertedId, name: 'Beatrix Direct Alpha' };

    // 3. Create Level 1 Direct Referral 2 (Inactive)
    const direct2Res = await db.collection('users').insertOne({
      name: 'Charles Direct Beta',
      email: `charles.beta.${timestamp}@nexachain.test`,
      mobileNumber: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: passwordHash,
      role: 'user',
      referralCode: `DIR${Math.floor(10000 + Math.random() * 90000)}`,
      referredBy: sponsorId,
      walletBalancePaise: 0,
      totalRoiEarnedPaise: 0,
      totalLevelIncomeEarnedPaise: 0,
      isActive: false,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });
    direct2User = { _id: direct2Res.insertedId, name: 'Charles Direct Beta' };

    // 4. Create Level 2 Referral (Referred by direct1)
    const level2Res = await db.collection('users').insertOne({
      name: 'Diana Downline Level2',
      email: `diana.downline.${timestamp}@nexachain.test`,
      mobileNumber: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: passwordHash,
      role: 'user',
      referralCode: `LVL${Math.floor(10000 + Math.random() * 90000)}`,
      referredBy: direct1User._id,
      walletBalancePaise: 1000000,
      totalRoiEarnedPaise: 0,
      totalLevelIncomeEarnedPaise: 0,
      isActive: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });
    level2User = { _id: level2Res.insertedId, name: 'Diana Downline Level2' };

    // 5. Create Investment for direct1 to anchor referral income
    const invRes = await db.collection('investments').insertOne({
      user: direct1User._id,
      planName: 'Enterprise Growth',
      principalAmountPaise: 10000000, // ₹1,00,000.00
      roiPercentage: 1.5,
      status: 'active',
      totalRoiEarnedPaise: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    investmentId = invRes.insertedId;

    // 6. Seed Referral Income records in 'referral_incomes' collection
    await db.collection('referral_incomes').insertMany([
      {
        beneficiary: sponsorId,
        sourceUser: direct1User._id,
        sourceInvestment: investmentId,
        level: 1,
        percentageApplied: 5.0,
        amountPaise: 500000, // ₹5,000.00
        status: 'processed',
        transactionKey: `TXN_REF_${timestamp}_1`,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        beneficiary: sponsorId,
        sourceUser: level2User._id,
        sourceInvestment: investmentId,
        level: 2,
        percentageApplied: 2.5,
        amountPaise: 250000, // ₹2,500.00
        status: 'pending',
        transactionKey: `TXN_REF_${timestamp}_2`,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ]);

    // Update sponsor's totalLevelIncomeEarnedPaise
    await db.collection('users').updateOne(
      { _id: sponsorId },
      { $set: { totalLevelIncomeEarnedPaise: 500000 } }
    );
  });

  test.afterAll(async () => {
    await cleanupTestData();
    await closeDbConnection();
  });

  test('1. Verifies desktop referral page, overview KPIs, share card, and direct referrals table (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/login');
    await page.locator('#login-email').fill(sponsorFixture.email);
    await page.locator('#login-password').fill(sponsorFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/referrals');
    await expect(page.getByRole('heading', { name: /referral management/i })).toBeVisible();

    // 1. KPI Overview Cards
    await expect(page.getByText('DIRECT REFERRALS', { exact: true })).toBeVisible();
    await expect(page.getByText('ACTIVE PARTICIPANTS', { exact: true })).toBeVisible();
    await expect(page.getByText('REFERRAL INCOME', { exact: true })).toBeVisible();
    await expect(page.getByText('DOWNLINE NETWORK', { exact: true })).toBeVisible();

    // Direct referrals count: 2
    await expect(page.getByText('2 registered')).toBeVisible();
    // Active referrals count: 1
    await expect(page.getByText('1 active')).toBeVisible();

    // 2. Referral Code & Sharing Card
    await expect(page.getByText(sponsorFixture.referralCode, { exact: true })).toBeVisible();
    await expect(page.getByText(new RegExp(`register\\?ref=${sponsorFixture.referralCode}`))).toBeVisible();

    // Test code copy action
    const copyCodeBtn = page.getByRole('button', { name: 'Copy Code', exact: true });
    await copyCodeBtn.click();
    await expect(page.getByText(/copied!/i)).toBeVisible();

    // Test link copy action
    const copyLinkBtn = page.getByRole('button', { name: 'Copy Link', exact: true });
    await copyLinkBtn.click();
    await expect(page.getByText(/link copied!/i)).toBeVisible();

    // 3. Direct Referrals Table verification
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('table').getByText('Beatrix Direct Alpha')).toBeVisible();
    await expect(page.getByRole('table').getByText('Charles Direct Beta')).toBeVisible();

    // Check status badges
    await expect(page.getByRole('table').getByText('ACTIVE', { exact: true })).toBeVisible();
    await expect(page.getByRole('table').getByText('INACTIVE', { exact: true })).toBeVisible();

    // Check items per page selector
    const limitSelect = page.getByLabel(/items per page/i);
    await expect(limitSelect).toBeVisible();

    // Check footer governance notice
    await expect(page.getByText(/affiliate governance notice/i)).toBeVisible();

    // Capture desktop screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/referrals-desktop-1440.png'),
      fullPage: true
    });
  });

  test('2. Verifies referral tree visualization, level badges, and traversal depth controls (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/login');
    await page.locator('#login-email').fill(sponsorFixture.email);
    await page.locator('#login-password').fill(sponsorFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/referrals');

    // Switch to Referral Tree tab
    await page.getByRole('button', { name: /referral tree/i }).click();

    // Verify metadata strip
    await expect(page.getByText(/network size/i)).toBeVisible();
    await expect(page.getByText(/traversed depth/i)).toBeVisible();
    await expect(page.getByText('Direct Branches', { exact: true })).toBeVisible();

    // Verify root node: Alex Sponsor Prime (Root (You))
    await expect(page.getByRole('main').getByText('Alex Sponsor Prime')).toBeVisible();
    await expect(page.getByText('Root (You)')).toBeVisible();

    // Verify level 1 children
    await expect(page.getByText('Beatrix Direct Alpha')).toBeVisible();
    await expect(page.getByText('Charles Direct Beta')).toBeVisible();
    await expect(page.getByText('Level 1').first()).toBeVisible();

    // Verify level 2 child
    await expect(page.getByText('Diana Downline Level2')).toBeVisible();
    await expect(page.getByText('Level 2')).toBeVisible();

    // Test traversal depth selector
    const depthSelect = page.getByLabel(/traversal depth/i);
    await depthSelect.selectOption('10');
    expect(await depthSelect.inputValue()).toBe('10');

    // Capture tree screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/referrals-tree-1440.png'),
      fullPage: true
    });
  });

  test('3. Verifies commission income policy notice, summary KPIs, ledger table and status filters (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/login');
    await page.locator('#login-email').fill(sponsorFixture.email);
    await page.locator('#login-password').fill(sponsorFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/referrals');

    // Switch to Commission Income tab
    await page.getByRole('button', { name: /commission income/i }).click();

    // 1. Verify policy banner
    await expect(page.getByText('Referral Commission Processing Inactive by Policy')).toBeVisible();
    await expect(page.getByText(/IS_ENABLED: false/i)).toBeVisible();

    // 2. Verify summary KPI strip
    await expect(page.getByText('PROCESSED COMMISSIONS')).toBeVisible();
    await expect(page.getByText('PENDING VALIDATION')).toBeVisible();
    await expect(page.getByText('TOTAL ACCRUED')).toBeVisible();
    await expect(page.getByText('₹5,000.00', { exact: true }).first()).toBeVisible(); // Processed
    await expect(page.getByText('₹2,500.00', { exact: true }).first()).toBeVisible(); // Pending

    // 3. Verify ledger table
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('table').getByText('Beatrix Direct Alpha')).toBeVisible();
    await expect(page.getByRole('table').getByText('+₹5,000.00')).toBeVisible();
    await expect(page.getByRole('table').getByText('Diana Downline Level2')).toBeVisible();
    await expect(page.getByRole('table').getByText('+₹2,500.00')).toBeVisible();

    // 4. Test status filters
    await page.getByRole('button', { name: /processed/i }).first().click();
    await expect(page.getByRole('table').getByText('Beatrix Direct Alpha')).toBeVisible();
    await expect(page.getByRole('table').getByText('Diana Downline Level2')).not.toBeVisible();

    await page.getByRole('button', { name: /pending/i }).first().click();
    await expect(page.getByRole('table').getByText('Diana Downline Level2')).toBeVisible();
    await expect(page.getByRole('table').getByText('Beatrix Direct Alpha')).not.toBeVisible();

    await page.getByRole('button', { name: /all records/i }).click();
    await expect(page.getByRole('table').getByText('Beatrix Direct Alpha')).toBeVisible();

    // Capture income screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/referrals-income-1440.png'),
      fullPage: true
    });
  });

  test('4. Verifies responsive adaptation on Tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/login');
    await page.locator('#login-email').fill(sponsorFixture.email);
    await page.locator('#login-password').fill(sponsorFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/referrals');
    await expect(page.getByRole('heading', { name: /referral management/i })).toBeVisible();

    // Verify document does not exceed viewport width
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(768);

    // Capture tablet screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/referrals-tablet-768.png'),
      fullPage: true
    });
  });

  test('5. Verifies mobile cards, zero document overflow, and tree containment on Mobile (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/login');
    await page.locator('#login-email').fill(sponsorFixture.email);
    await page.locator('#login-password').fill(sponsorFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/referrals');
    await expect(page.getByRole('heading', { name: /referral management/i })).toBeVisible();

    // Direct table should be hidden, mobile cards rendered
    await expect(page.getByRole('table')).not.toBeVisible();
    const mobileCards = page.locator('.md\\:hidden');
    await expect(mobileCards.getByText('Beatrix Direct Alpha')).toBeVisible();

    // Check no horizontal scrollbar on document
    let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);

    // Switch to Referral Tree tab
    await page.getByRole('button', { name: /referral tree/i }).click();
    await expect(page.getByRole('main').getByText('Alex Sponsor Prime')).toBeVisible();

    // Tree should be contained inside overflow container, document should still not overflow 390
    scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);

    // Capture mobile screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/referrals-mobile-390.png'),
      fullPage: true
    });
  });
});
