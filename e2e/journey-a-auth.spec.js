const { test, expect } = require('@playwright/test');
const { cleanupTestData, closeDbConnection } = require('./testHelpers');

test.describe('User Journey A — Authentication & Session Management', () => {
  const timestamp = Date.now();
  const validUser = {
    name: 'Alex E2E Investor',
    email: `alex.investor.${timestamp}@nexachain.test`,
    mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'SecurePassword123!'
  };

  test.afterAll(async () => {
    await cleanupTestData();
    await closeDbConnection();
  });

  test('1. Validates form fields and displays clear error messages on invalid input', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();

    // Attempt to submit empty form
    await page.getByRole('button', { name: /create nexachain account/i }).click();

    // Verify client validation messages
    await expect(page.getByText(/full name is required/i)).toBeVisible();
    await expect(page.getByText(/email address is required/i)).toBeVisible();
    await expect(page.getByText(/mobile number is required/i)).toBeVisible();
    await expect(page.locator('#register-password-error')).toBeVisible();
    await expect(page.locator('#register-confirm-password-error')).toBeVisible();

    // Enter invalid mobile number
    await page.locator('#register-mobile').fill('12345');
    await page.getByRole('button', { name: /create nexachain account/i }).click();
    await expect(page.getByText(/valid 10-digit indian mobile number/i)).toBeVisible();

    // Enter mismatched passwords
    await page.locator('#register-password').fill('Password123!');
    await page.locator('#register-confirm-password').fill('Mismatch123!');
    await page.getByRole('button', { name: /create nexachain account/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('2. Successfully registers a new user and authenticates into the dashboard', async ({ page }) => {
    await page.goto('/register');

    await page.locator('#register-name').fill(validUser.name);
    await page.locator('#register-email').fill(validUser.email);
    await page.locator('#register-mobile').fill(validUser.mobile);
    await page.locator('#register-password').fill(validUser.password);
    await page.locator('#register-confirm-password').fill(validUser.password);

    // Verify password strength indicator updates
    await expect(page.getByText(/strong password|good/i)).toBeVisible();

    // Submit registration
    await page.getByRole('button', { name: /create nexachain account/i }).click();

    // Verify navigation to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByRole('heading', { name: /portfolio overview/i })).toBeVisible();

    // Verify initial wallet balance is displayed as ₹0.00 (not undefined or missing)
    await expect(page.locator('header').getByText(/₹0\.00/)).toBeVisible();

    // Verify Cron engine status badge is active
    await expect(page.getByText(/cron engine: active \(00:00 ist\)/i)).toBeVisible();
  });

  test('3. Enforces protected route behavior and navigates between authorized views', async ({ page }) => {
    // Log in using the registered user
    await page.goto('/login');
    await page.locator('#login-email').fill(validUser.email);
    await page.locator('#login-password').fill(validUser.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Navigate to Investments view
    await page.locator('aside').getByRole('link', { name: /investments/i }).click();
    await expect(page).toHaveURL(/.*\/investments/);
    await expect(page.getByRole('heading', { name: /investment portfolio/i })).toBeVisible();

    // Navigate to Referrals view
    await page.locator('aside').getByRole('link', { name: /referrals/i }).click();
    await expect(page).toHaveURL(/.*\/referrals/);
    await expect(page.getByRole('heading', { name: /referral management/i })).toBeVisible();

    // Navigate to ROI History view
    await page.locator('aside').getByRole('link', { name: /roi history/i }).click();
    await expect(page).toHaveURL(/.*\/roi-history/);
    await expect(page.getByRole('heading', { name: /roi history & analytics/i })).toBeVisible();

    // Navigate to Profile view
    await page.locator('aside').getByRole('link', { name: /profile/i }).click();
    await expect(page).toHaveURL(/.*\/profile/);
    await expect(page.getByRole('heading', { name: /account profile/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: validUser.name })).toBeVisible();
  });

  test('4. Logs out successfully and blocks subsequent access to protected routes', async ({ page }) => {
    // Log in first
    await page.goto('/login');
    await page.locator('#login-email').fill(validUser.email);
    await page.locator('#login-password').fill(validUser.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Click Sign Out
    await page.getByRole('button', { name: 'Log out' }).first().click();

    // Verify redirect to /login
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    // Attempt direct navigation to /dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);

    // Attempt direct navigation to /investments
    await page.goto('/investments');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('5. Rejects duplicate email registration with clear feedback', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/register');

    await page.locator('#register-name').fill('Duplicate Test User');
    await page.locator('#register-email').fill(validUser.email); // Same email already registered
    await page.locator('#register-mobile').fill(`98${Math.floor(10000000 + Math.random() * 90000000)}`);
    await page.locator('#register-password').fill('ValidPass123!');
    await page.locator('#register-confirm-password').fill('ValidPass123!');

    await page.getByRole('button', { name: /create nexachain account/i }).click();

    // Verify clear backend duplicate error
    await expect(page.getByText(/already in use|email address already exists/i).first()).toBeVisible();
  });
});
