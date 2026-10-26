import { test, expect } from '@playwright/test';
import { ParaBank } from '../pages/parabank.js';
test('customer registration', async ({ page }) => { await new ParaBank(page).register(); });
test('logout and login retain access', async ({ page }) => {
  const bank = new ParaBank(page); await bank.register();
  await page.getByRole('link', { name: 'Log Out', exact: true }).click(); await bank.login();
  await expect(page.locator('#rightPanel h1')).toHaveText('Accounts Overview');
  await expect(page.locator('#accountTable tbody tr a').first()).toHaveText(/^\d+$/);
});
test('required registration fields', async ({ page }) => {
  const bank = new ParaBank(page); await bank.home(); await page.getByRole('link', { name: 'Register', exact: true }).click(); await bank.submit();
  await expect(page.locator('[id="customer.firstName.errors"]')).toHaveText('First name is required.');
  await expect(page.locator('[id="customer.username.errors"]')).toHaveText('Username is required.');
});
test('password mismatch is rejected', async ({ page }) => {
  const bank = new ParaBank(page); await bank.form(true); await bank.submit();
  await expect(page.locator('[id="repeatedPassword.errors"]')).toHaveText('Passwords did not match.');
});
test('unknown customer cannot log in', async ({ page }) => {
  const bank = new ParaBank(page); await bank.home(); await bank.login();
  await expect(page.locator('#rightPanel .error')).toHaveText('The username and password could not be verified.');
});
test('open a savings account and inspect its type', async ({ page }) => {
  const bank = new ParaBank(page); await bank.register(); await bank.openSavings();
});
