const { test, expect } = require('@playwright/test');
const { cleanupTestData, closeDbConnection } = require('./testHelpers');

test.describe('User Journey B — Investment Request Lifecycle & Funding Semantics', () => {
  const timestamp = Date.now();
  const investor = {
    name: 'Jordan Capital Allocator',
    email: `jordan.investor.${timestamp}@nexachain.test`,
    mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'InvestorPass123!'
  };

  test.afterAll(async () => {
    await cleanupTestData();
    await closeDbConnection();
  });

  test('1. Submits an investment request and verifies unfunded semantics and pending status', async ({ page }) => {
    // 1. Register fresh user
    await page.goto('/register');
    await page.locator('#register-name').fill(investor.name);
    await page.locator('#register-email').fill(investor.email);
    await page.locator('#register-mobile').fill(investor.mobile);
    await page.locator('#register-password').fill(investor.password);
    await page.locator('#register-confirm-password').fill(investor.password);
    await page.getByRole('button', { name: /create nexachain account/i }).click();
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Initial balance verification
    const initialWalletText = await page.locator('header').getByText(/₹0\.00/).innerText();
    expect(initialWalletText).toContain('₹0.00');

    // 2. Open Investments page
    await page.goto('/investments');
    await expect(page.getByRole('heading', { name: /investment portfolio/i })).toBeVisible();

    // 3. Open Create Investment modal
    await page.getByRole('button', { name: /create investment/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /request new investment contract/i })).toBeVisible();

    // Verify testing default and unfunded notice is clearly displayed
    await expect(page.getByText(/unfunded application & testing configuration notice/i)).toBeVisible();
    await expect(page.getByText(/no wallet balance is debited or transferred at this time/i)).toBeVisible();

    // 4. Verify server plans load dynamically
    await expect(page.getByText(/starter plan/i).first()).toBeVisible();

    // 5. Enter allocation amount
    await page.locator('#investment-amount').fill('15000');
    // Verify real-time paise preview
    await expect(page.getByText(/15,00,000 paise/i)).toBeVisible();

    // 6. Submit request
    await page.getByRole('button', { name: /submit investment request/i }).click();

    // Verify success feedback and modal close
    await expect(page.getByText(/submitted successfully/i)).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // 7. Verify the investment appears in the investments list with status 'pending'
    await expect(page.getByText(/pending/i).first()).toBeVisible();
    await expect(page.getByText(/₹15,000\.00/i).first()).toBeVisible();

    // 8. Open details page
    await page.getByRole('link', { name: /details/i }).first().click();
    await expect(page).toHaveURL(/.*\/investments\/[a-f0-9]{24}/);

    // Verify unfunded explanation and review notice
    await expect(page.getByText(/request awaiting administrative review/i)).toBeVisible();
    await expect(page.getByText(/this application is unfunded and no wallet balance was debited/i)).toBeVisible();

    // Verify dates explicitly communicate pending status
    await expect(page.getByText(/pending administrative activation/i)).toBeVisible();
    await expect(page.getByText(/scheduled upon contract activation/i)).toBeVisible();

    // 9. Verify wallet balance was NOT debited
    await expect(page.locator('header').getByText(/₹0\.00/)).toBeVisible();

    // 10. Check dashboard recent activity
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /portfolio overview/i })).toBeVisible();
    // Recent activity must label it as an Investment Request, not Deployed, and no minus sign
    await expect(page.getByText(/investment request: starter plan/i)).toBeVisible();
    await expect(page.getByText(/pending review/i)).toBeVisible();
  });
});
