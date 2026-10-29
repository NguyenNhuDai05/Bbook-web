import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCommerceClient, verifiedCheckoutDestination } from '../commerce/contract.mjs';

test('web order sends product and terms through an injected authenticated transport without a client price or owner', async () => {
  const calls = [];
  const client = createCommerceClient({ request: async (...args) => { calls.push(args); return { checkoutAvailable: false }; } });
  await client.createOrder({ productId: 'bbook_customer_ai_lifetime_v1', idempotencyKey: 'stable-order-key', termsVersion: 'bbook-web-v2', amount: 1, userId: 'other' });
  assert.deepEqual(calls[0][1].body, { productId: 'bbook_customer_ai_lifetime_v1', termsVersion: 'bbook-web-v2' });
  assert.equal(calls[0][1].headers['Idempotency-Key'], 'stable-order-key');
});
test('checkout remains unavailable without server permission and rejects hostile destinations', () => {
  const base = { checkoutAvailable: true, state: 'PaymentPending' };
  assert.throws(() => verifiedCheckoutDestination({ checkoutAvailable: false }));
  for (const checkoutUrl of ['javascript:alert(1)', 'https://pay.payos.vn.evil.test/x', 'https://user@pay.payos.vn/x', 'http://pay.payos.vn/x'])
    assert.throws(() => verifiedCheckoutDestination({ ...base, checkoutUrl }));
  assert.equal(verifiedCheckoutDestination({ ...base, checkoutUrl: 'https://pay.payos.vn/web/synthetic' }), 'https://pay.payos.vn/web/synthetic');
});
test('return URL text cannot act as payment proof or be used as an arbitrary endpoint', async () => {
  const calls = [];
  const client = createCommerceClient({ request: async (...args) => { calls.push(args); return { state: 'PaymentPending' }; } });
  await assert.rejects(() => client.readOrder('123?status=PAID'));
  const result = await client.readOrder('00000000-0000-0000-0000-000000000001');
  assert.equal(result.state, 'PaymentPending'); assert.equal(calls[0][1].method, 'GET');
});
test('draft module has no entry point in the landing page and is excluded from production packaging', async () => {
  for (const name of ['../index.html', '../app.js', './build.mjs']) {
    const source = await readFile(new URL(name, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /commerce\/contract|commerce\/index|bbook_mua_activation_v1|bbook_visibility_30d_v1/);
  }
});
