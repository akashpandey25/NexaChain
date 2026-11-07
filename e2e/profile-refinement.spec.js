const { test, expect } = require('@playwright/test');
const { createTestUserFixture, cleanupTestData, closeDbConnection } = require('./testHelpers');
const path = require('path');

test.describe('Phase 4.5 Account Profile & Security Refinement Verification', () => {
  let userFixture;

  test.beforeAll(async () => {
    userFixture = await createTestUserFixture({
      name: 'Elena Rostova',
      mobileNumber: '+919876543210',
      walletBalancePaise: 15000000 // ₹1,50,000.00
    });
  });

  test.afterAll(async () => {
    await cleanupTestData();
    await closeDbConnection();
  });

  test('1. Verifies desktop profile hierarchy, verified credentials, technical specifications, and security governance (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /account profile/i })).toBeVisible();

    // 1. Account Overview Header Card
    await expect(page.getByRole('heading', { name: 'Elena Rostova' })).toBeVisible();
    await expect(page.getByText('ER', { exact: true })).toBeVisible();
    await expect(page.getByText('INVESTOR', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('ACTIVE', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(userFixture.email).first()).toBeVisible();
    await expect(page.getByText('+919876543210').first()).toBeVisible();

    // 2. Personal Information Section (Read-Only)
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible();
    await expect(page.getByText('Registered · Read-Only')).toBeVisible();
    await expect(page.getByText('Registered Email', { exact: true })).toBeVisible();
    await expect(page.getByText('Registered Mobile', { exact: true })).toBeVisible();
    await expect(page.getByText('Registration Date', { exact: true }).first()).toBeVisible();

    // 3. Account Specifications Section
    await expect(page.getByRole('heading', { name: 'Account Specifications' })).toBeVisible();
    await expect(page.getByText('Immutable Identity')).toBeVisible();
    await expect(page.getByText('User Identifier')).toBeVisible();
    await expect(page.getByText('Authorization Role')).toBeVisible();
    await expect(page.getByText('Sponsor Mapping')).toBeVisible();

    // 4. Affiliate Referral Tools
    await expect(page.getByRole('heading', { name: 'Affiliate Referral Tools' })).toBeVisible();
    await expect(page.getByText(userFixture.referralCode, { exact: true }).first()).toBeVisible();

    // Test Referral Code copy button
    const copyCodeBtn = page.getByRole('button', { name: 'Copy Code', exact: true });
    await copyCodeBtn.click();
    await expect(page.getByText('Copied!')).toBeVisible();

    // Test Referral Link copy button
    const copyLinkBtn = page.getByRole('button', { name: 'Copy Link', exact: true });
    await copyLinkBtn.click();
    await expect(page.getByText('Link Copied!')).toBeVisible();

    // Verify link to Referrals page
    const referralsLink = page.getByRole('link', { name: /open referral management/i });
    await expect(referralsLink).toBeVisible();

    // 5. Authentication & Session Security
    await expect(page.getByRole('heading', { name: 'Authentication & Session Security' })).toBeVisible();
    await expect(page.getByText('JWT Bearer (HTTP Header)')).toBeVisible();
    await expect(page.getByText('Purged on Sign Out')).toBeVisible();
    await expect(page.getByText('Server-Enforced RBAC')).toBeVisible();
    await expect(page.getByText('Profile Immutability Policy')).toBeVisible();

    // 6. Active Session Termination Section
    await expect(page.getByRole('heading', { name: 'Terminate Active Session' })).toBeVisible();

    // Capture desktop screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/profile-desktop-1440.png'),
      fullPage: true
    });
  });

  test('2. Verifies referral URL parameter (?ref=CODE) is consumed and pre-fills the registration form', async ({ browser }) => {
    // Open an unauthenticated context to access /register without authenticated redirect
    const unauthedContext = await browser.newContext();
    const regPage = await unauthedContext.newPage();

    // Navigate to register with the generated referral code
    await regPage.goto(`/register?ref=${userFixture.referralCode}`);
    await expect(regPage.getByRole('heading', { name: /create account/i })).toBeVisible();

    // Verify referral code input is prefilled with uppercase code
    const referralInput = regPage.locator('#register-referral-code');
    await expect(referralInput).toBeVisible();
    expect(await referralInput.inputValue()).toBe(userFixture.referralCode);

    await unauthedContext.close();
  });

  test('3. Verifies responsive adaptation on Tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /account profile/i })).toBeVisible();

    // Verify document does not exceed viewport width
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(768);

    // Capture tablet screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/profile-tablet-768.png'),
      fullPage: true
    });
  });

  test('4. Verifies mobile layout, text wrapping, and zero horizontal overflow on Mobile (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /account profile/i })).toBeVisible();

    // Check no horizontal scrollbar on document
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);

    // Verify user name and credentials visible
    await expect(page.getByRole('heading', { name: 'Elena Rostova' })).toBeVisible();
    await expect(page.getByText('ACTIVE', { exact: true }).first()).toBeVisible();

    // Capture mobile screenshot
    await page.screenshot({
      path: path.resolve(__dirname, '../docs/screenshots/profile-mobile-390.png'),
      fullPage: true
    });
  });

  test('5. Verifies safe session termination and protected route redirection upon sign out', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/login');
    await page.locator('#login-email').fill(userFixture.email);
    await page.locator('#login-password').fill(userFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/profile');

    // Click Sign Out button in termination card
    const signOutBtn = page.getByRole('button', { name: /sign out of nexachain/i });
    await signOutBtn.click();

    // Verify redirection to login page
    await expect(page).toHaveURL(/.*\/login/);

    // Verify protected route /profile redirects to /login
    await page.goto('/profile');
    await expect(page).toHaveURL(/.*\/login/);
  });
});

