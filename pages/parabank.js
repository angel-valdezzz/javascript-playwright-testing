import { expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
export class ParaBank {
  constructor(page) { this.page = page; this.username = 'qa' + randomUUID().replaceAll('-', ''); this.password = 'DemoPass42!'; }
  async home() { await this.page.goto((process.env.PARABANK_URL || 'https://parabank.parasoft.com/parabank') + '/index.htm'); }
  async form(mismatch = false) {
    await this.home(); await this.page.getByRole('link', { name: 'Register', exact: true }).click();
    const fields = {"customer.firstName": "Automation", "customer.lastName": "Example", "customer.address.street": "123 Fictional Street", "customer.address.city": "Demo City", "customer.address.state": "CA", "customer.address.zipCode": "90210", "customer.phoneNumber": "5551234567", "customer.ssn": "123456789"};
    for (const [id, value] of Object.entries(fields)) await this.page.locator('[id="' + id + '"]').fill(value);
    await this.page.locator('[id="customer.username"]').fill(this.username);
    await this.page.locator('[id="customer.password"]').fill(this.password);
    await this.page.locator('#repeatedPassword').fill(mismatch ? 'Different42!' : this.password);
  }
  async submit() { await this.page.locator('#customerForm input[type=submit]').click(); }
  async register() { await this.form(); await this.submit(); await expect(this.page.locator('#rightPanel h1')).toHaveText('Welcome ' + this.username); }
  async login(username = this.username, password = this.password) {
    await this.page.locator('input[name=username]').fill(username);
    await this.page.locator('input[name=password]').fill(password);
    await this.page.locator('#loginPanel input[type=submit]').click();
  }
  async openSavings() {
    await this.page.getByRole('link', { name: 'Open New Account', exact: true }).click();
    await expect(this.page.locator('#fromAccountId option').first()).toHaveAttribute('value', /\d+/);
    await this.page.locator('#type').selectOption('1');
    await this.page.locator('#openAccountForm input.button').click();
    await expect(this.page.locator('#newAccountId')).toHaveText(/^\d+$/);
    const id = await this.page.locator('#newAccountId').innerText();
    await this.page.locator('#newAccountId').click();
    await expect(this.page.locator('#accountId')).toHaveText(id);
    await expect(this.page.locator('#accountType')).toHaveText('SAVINGS');
  }
}
