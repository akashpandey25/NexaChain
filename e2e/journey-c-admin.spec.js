const { test, expect } = require('@playwright/test');
const { createTestAdminFixture, cleanupTestData, closeDbConnection } = require('./testHelpers');

test.describe('User Journey C — Administrative Review Workflow & Security Guards', () => {
  let adminFixture;
  const timestamp = Date.now();
  const investor = {
    name: 'Morgan Review Candidate',
    email: `morgan.applicant.${timestamp}@nexachain.test`,
    mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'Password123!'
  };

  test.beforeAll(async () => {
    adminFixture = await createTestAdminFixture();
  });

  test.afterAll(async () => {
    await cleanupTestData();
    await closeDbConnection();
  });

  test('1. Enforces role security: ordinary users are blocked from Admin Approvals', async ({ page }) => {
    // Register ordinary user
    await page.goto('/register');
    await page.locator('#register-name').fill(investor.name);
    await page.locator('#register-email').fill(investor.email);
    await page.locator('#register-mobile').fill(investor.mobile);
    await page.locator('#register-password').fill(investor.password);
    await page.locator('#register-confirm-password').fill(investor.password);
    await page.getByRole('button', { name: /create nexachain account/i }).click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Verify "Admin Approvals" link is NOT rendered in the sidebar
    await expect(page.locator('aside').getByRole('link', { name: /admin approvals/i })).not.toBeVisible();

    // Attempt direct URL navigation to /admin/investments
    await page.goto('/admin/investments');
    // Guard redirects non-admin to /dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Submit an investment request for subsequent admin review
    await page.goto('/investments');
    await page.getByRole('button', { name: /create investment/i }).click();
    await page.locator('#investment-amount').fill('20000');
    await page.getByRole('button', { name: /submit investment request/i }).click();
    await expect(page.getByText(/submitted successfully/i)).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Log out ordinary user so admin can sign in
    await page.getByRole('button', { name: 'Log out' }).first().click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('2. Admin logs in, inspects the pending request, and rejects with an auditable reason', async ({ page }) => {
    // 1. Log in as dedicated test admin
    await page.goto('/login');
    await page.locator('#login-email').fill(adminFixture.email);
    await page.locator('#login-password').fill(adminFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Verify "Admin Approvals" link is visible for admin role
    const adminLink = page.locator('aside').getByRole('link', { name: /admin approvals/i });
    await expect(adminLink).toBeVisible();
    await adminLink.click();
    await expect(page).toHaveURL(/.*\/admin\/investments/);
    await expect(page.getByRole('heading', { name: /administrative approvals/i })).toBeVisible();

    // 3. Verify pending requests table lists investor's application
    await expect(page.getByText(investor.name)).toBeVisible();
    await expect(page.getByText(/₹20,000\.00/i).first()).toBeVisible();

    // 4. Test Inspect modal
    await page.getByRole('button', { name: /inspect/i }).first().click();
    const inspectModal = page.getByRole('dialog', { name: /investment request specifications/i });
    await expect(inspectModal).toBeVisible();
    await expect(inspectModal.getByText(investor.name)).toBeVisible();
    await expect(inspectModal.getByText(investor.email)).toBeVisible();
    await expect(inspectModal.getByText(/starter plan/i).first()).toBeVisible();

    // Close inspect modal using Escape key
    await page.keyboard.press('Escape');
    await expect(inspectModal).not.toBeVisible();

    // 5. Test Rejection flow
    await page.getByRole('button', { name: /reject/i }).first().click();
    const rejectModal = page.getByRole('dialog', { name: /reject investment request/i });
    await expect(rejectModal).toBeVisible();

    // Enter rejection explanation
    const rejectionReason = 'Applicant identity verification document mismatch. Capital allocation deferred.';
    await rejectModal.locator('textarea').fill(rejectionReason);

    // Confirm rejection
    await rejectModal.getByRole('button', { name: /confirm rejection/i }).click();

    // Verify success feedback
    await expect(page.getByText(/rejected successfully/i)).toBeVisible();
    await expect(rejectModal).not.toBeVisible();

    // Verify request is removed from pending table
    await expect(page.getByText(investor.name)).not.toBeVisible();

    // Admin logs out
    await page.getByRole('button', { name: 'Log out' }).first().click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('3. Investor verifies the rejection decision and audit reason on the contract details view', async ({ page }) => {
    // Log back in as investor
    await page.goto('/login');
    await page.locator('#login-email').fill(investor.email);
    await page.locator('#login-password').fill(investor.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Go to investments
    await page.goto('/investments');

    // Filter by Cancelled
    await page.getByRole('button', { name: /cancelled/i }).first().click();
    await expect(page.getByText(/cancelled/i).first()).toBeVisible();

    // Open detail page
    await page.getByRole('link', { name: /details/i }).first().click();
    await expect(page).toHaveURL(/.*\/investments\/[a-f0-9]{24}/);

    // Verify rejection banner and reason
    await expect(page.getByText(/contract cancelled \/ rejected/i)).toBeVisible();
    await expect(page.getByText(/applicant identity verification document mismatch/i).first()).toBeVisible();
    await expect(page.getByText(/decision recorded on/i)).toBeVisible();

    // Investor logs out
    await page.getByRole('button', { name: 'Log out' }).first().click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('4. Verifies production fail-safe lockout when attempting activation with flag disabled', async ({ page }) => {
    // Register another candidate and submit request
    const candidateEmail = `candidate2.${timestamp}@nexachain.test`;
    await page.goto('/register');
    await page.locator('#register-name').fill('Candidate Two');
    await page.locator('#register-email').fill(candidateEmail);
    await page.locator('#register-mobile').fill(`98${Math.floor(10000000 + Math.random() * 90000000)}`);
    await page.locator('#register-password').fill('Password123!');
    await page.locator('#register-confirm-password').fill('Password123!');
    await page.getByRole('button', { name: /create nexachain account/i }).click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto('/investments');
    await page.getByRole('button', { name: /create investment/i }).click();
    await page.locator('#investment-amount').fill('10000');
    await page.getByRole('button', { name: /submit investment request/i }).click();
    await expect(page.getByText(/submitted successfully/i)).toBeVisible();

    // Candidate Two logs out
    await page.getByRole('button', { name: 'Log out' }).first().click();
    await expect(page).toHaveURL(/.*\/login/);

    // Log in as admin
    await page.locator('#login-email').fill(adminFixture.email);
    await page.locator('#login-password').fill(adminFixture.password);
    await page.locator('button[type="submit"]').click();
    await expect(page).not.toHaveURL(/.*\/login/);

    await page.goto('/admin/investments');
    await expect(page.getByText('Candidate Two')).toBeVisible();

    // Click Activate
    await page.getByRole('button', { name: /activate/i }).first().click();
    const activateModal = page.getByRole('dialog', { name: /confirm contract activation/i });
    await expect(activateModal).toBeVisible();

    // Click Confirm Activation
    await activateModal.getByRole('button', { name: /confirm activation/i }).click();

    // Because INVESTMENT_ACTIVATION_ENABLED=false in production, policy lockout must appear
    await expect(activateModal.getByText(/disabled by policy/i).first()).toBeVisible();

    // Close modal
    await activateModal.getByRole('button', { name: /cancel|close/i }).first().click();
    await expect(activateModal).not.toBeVisible();
  });
});
