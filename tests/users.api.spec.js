import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
test.describe('Demo Users API contract', () => {
  let client; let ids;
  test.beforeEach(async ({ playwright }) => {
    if (!process.env.DEMO_BASE_URL || !process.env.DEMO_API_KEY) throw Error('Use scripts/run.py --local-api or configure DEMO_BASE_URL and DEMO_API_KEY');
    client = await playwright.request.newContext({ baseURL: process.env.DEMO_BASE_URL, extraHTTPHeaders: { 'X-API-Key': process.env.DEMO_API_KEY } }); ids = [];
  });
  test.afterEach(async () => {
    if (!client) return;
    try { for (const id of ids) { const r = await client.delete('/users/' + id); expect([204,404]).toContain(r.status()); } } finally { await client.dispose(); }
  });
  async function create(extra = {}) {
    const payload = { name: 'Automation Example', email: randomUUID() + '@example.com', role: 'sales', active: true, ...extra };
    const r = await client.post('/users', { data: payload }); expect(r.status()).toBe(201);
    const user = await r.json(); ids.push(user.id); expect(r.headers().location).toBe('/users/' + user.id);
    expect(user).toMatchObject(payload); expect(user.id).toMatch(/^[0-9a-f-]{36}$/); return user;
  }
  test('CRUD, replacement defaults and partial update', async () => {
    const u = await create(); const path = '/users/' + u.id;
    expect((await client.get(path)).status()).toBe(200);
    const patch = await client.patch(path, { data: { active: false } }); expect(patch.status()).toBe(200); expect((await patch.json()).active).toBe(false);
    const replacement = { name: 'Replaced', email: randomUUID() + '@example.com' };
    const put = await client.put(path, { data: replacement }); expect(put.status()).toBe(200); expect(await put.json()).toMatchObject({ ...replacement, active: true, role: 'support' });
    expect((await client.delete(path)).status()).toBe(204); expect((await client.get(path)).status()).toBe(404);
  });
  test('duplicate email is a conflict', async () => { const u = await create(); expect((await client.post('/users', { data: { name: 'Duplicate', email: u.email } })).status()).toBe(409); });
  test('lifecycle conflicts and filtering', async () => {
    const u = await create(); const path = '/users/' + u.id;
    expect((await client.post(path + '/activate')).status()).toBe(409);
    const r = await client.post(path + '/deactivate'); expect(r.status()).toBe(200); expect((await r.json()).active).toBe(false);
    expect((await client.post(path + '/deactivate')).status()).toBe(409);
    const listing = await client.get('/users?role=sales&active=false&limit=100'); expect(listing.status()).toBe(200);
    const data = await listing.json(); expect(data.items.some(x => x.id === u.id)).toBe(true); expect(data.items.every(x => x.role === 'sales' && !x.active)).toBe(true);
    expect((await client.post(path + '/activate')).status()).toBe(200);
  });
  for (const body of [{ name: '', email: 'bad' }, { name: 'A', email: 'a@example.com', unknown: true }, { name: 'A', email: 'a@example.com', role: 'owner' }]) {
    test('invalid payload ' + JSON.stringify(body), async () => { expect((await client.post('/users', { data: body })).status()).toBe(422); });
  }
  test('null PATCH and invalid pagination', async () => { const u = await create(); expect((await client.patch('/users/' + u.id, { data: { name: null } })).status()).toBe(422); expect((await client.get('/users?limit=0')).status()).toBe(422); });
  test('health is public and user requests require a key', async ({ playwright }) => {
    const unauth = await playwright.request.newContext({ baseURL: process.env.DEMO_BASE_URL });
    try { expect(await (await unauth.get('/health')).json()).toEqual({ status: 'ok', storage: 'temporary' }); expect((await unauth.get('/users')).status()).toBe(401); } finally { await unauth.dispose(); }
    expect((await client.get('/users/' + randomUUID())).status()).toBe(404);
  });
});
