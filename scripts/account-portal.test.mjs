import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createClient, checkoutUrl, money, date, labels } from '../mua/client.mjs';

function fixture(role = 'Customer') {
  return { role, name: '<unsafe name>', email: 'test@example.invalid', csrf: 'test-csrf', reviewStatus: 'Approved', checkoutEnabled: true, termsVersion: 'bbook-web-v2', ai: { purchased: false }, products: [{ id: role === 'Customer' ? 'bbook_customer_ai_lifetime_v1' : 'bbook_visibility_30d_v1', name: role === 'Customer' ? 'AI quét mặt trọn đời' : 'BBook Visibility 30 ngày', amountVnd: role === 'Customer' ? 20000 : 75000 }], orders: [], facebook: [] };
}
async function portal(data, search = '') {
  const nodes = new Map();
  const node = id => { if (!nodes.has(id)) nodes.set(id, { innerHTML: '', textContent: '', hidden: false, disabled: false, checked: false, dataset: {}, addEventListener() {}, querySelectorAll: () => [], scrollIntoView() {}, showModal() {}, close() {} }); return nodes.get(id); };
  const calls = []; const order = { id: '00000000-0000-0000-0000-000000000001', productId: data.products[0].id, amountVnd: data.products[0].amountVnd, state: 'PaymentPending', checkoutAvailable: false };
  const api = { setCsrf() {}, async call(path) { calls.push(path); if (path === '/config') return { enabled: true }; if (path === '/me') return data; return order; } };
  const storage = new Map();
  const context = vm.createContext({ createClient: () => api, checkoutUrl, money, date, labels, URLSearchParams, crypto: { randomUUID: () => 'stable-key' }, window: { BBOOK_COMMERCE_CONFIG: {}, prompt: () => null }, location: { search, assign() {} }, document: { hidden: false, getElementById: node, querySelectorAll: () => [], addEventListener() {} }, sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }, setTimeout: () => 1, clearTimeout() {} });
  const source = (await readFile(new URL('../mua/portal.mjs', import.meta.url), 'utf8')).replace(/^import .*\n/, '').replace(/\nstart\(\);\s*$/, '\nvar ready = start();');
  vm.runInContext(source, context); await context.ready;
  return { nodes, context, calls, order };
}
test('Customer portal offers lifetime AI and hides MUA promotion delivery', async () => {
  const ui = await portal(fixture());
  assert.match(ui.nodes.get('products').innerHTML, /20\.000/);
  assert.match(ui.nodes.get('products').innerHTML, /vĩnh viễn/);
  assert.doesNotMatch(ui.nodes.get('products').innerHTML, /activation_v1|100\.000/);
  assert.equal(ui.nodes.get('facebook-heading').hidden, true);
  ui.context.purchase('bbook_customer_ai_lifetime_v1');
  assert.match(ui.nodes.get('consent-copy').textContent, /AI quét mặt vĩnh viễn/);
  assert.equal(ui.nodes.get('confirm-purchase').disabled, true);
});
test('MUA portal retains 75k, its delivery tasks and explicit portfolio consent', async () => {
  const ui = await portal(fixture('MUA'));
  assert.match(ui.nodes.get('products').innerHTML, /75\.000/);
  assert.match(ui.nodes.get('products').innerHTML, /30 ngày/);
  assert.equal(ui.nodes.get('facebook-heading').hidden, false);
  ui.context.purchase('bbook_visibility_30d_v1');
  assert.match(ui.nodes.get('consent-copy').textContent, /portfolio/);
});
test('a PAID return parameter cannot grant AI when the server still reports pending', async () => {
  const ui = await portal(fixture(), '?order=00000000-0000-0000-0000-000000000001&status=PAID');
  assert.match(ui.nodes.get('status-grid').innerHTML, /Chưa đăng ký/);
  assert.match(ui.nodes.get('order-detail').innerHTML, /Chờ thanh toán/);
  assert.ok(ui.calls.some(path => path.startsWith('/orders/')));
});
test('browser transport keeps credentials and CSRF and rejects untrusted checkout targets', async () => {
  let sent;
  const client = createClient('https://api.bbookmakeup.com', async (url, options) => { sent = { url, options }; return { status: 200, ok: true, json: async () => ({ id: 'saved' }) }; });
  client.setCsrf('test-csrf');
  await client.call('/orders', 'POST', { productId: 'bbook_customer_ai_lifetime_v1' }, 'stable-key');
  assert.equal(sent.options.credentials, 'include'); assert.equal(sent.options.headers['X-BBook-CSRF'], 'test-csrf');
  assert.equal(sent.options.headers['Idempotency-Key'], 'stable-key');
  for (const url of ['http://pay.payos.vn/', 'https://pay.payos.vn.evil.test/', 'https://user@pay.payos.vn/']) assert.throws(() => checkoutUrl(url));
});
