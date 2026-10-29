// Draft web integration contract only. Not imported by app.js, not copied to dist,
// and no production endpoint implements it in this phase. All transport is injected.
export function createCommerceClient({ request } = {}) {
  if (typeof request !== 'function') throw new Error('An authenticated transport is required.');
  return Object.freeze({
    async createOrder({ productId, idempotencyKey, termsVersion }) {
      if (!['bbook_customer_ai_lifetime_v1', 'bbook_visibility_30d_v1'].includes(productId)) throw new Error('Unknown product.');
      if (typeof idempotencyKey !== 'string' || !idempotencyKey.trim() || idempotencyKey.length > 80) throw new Error('Invalid idempotency key.');
      if (termsVersion !== 'bbook-web-v2') throw new Error('Terms must be accepted.');
      // No amount, account ID, provider, return URL or credential from the browser.
      return request('/api/web/mua/commerce/orders', {
        method: 'POST', headers: { 'Idempotency-Key': idempotencyKey },
        body: { productId, termsVersion },
      });
    },
    async readOrder(id) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('Invalid order ID.');
      // The result page only reads authenticated server status; URL query parameters
      // such as status=PAID or cancel=false are never interpreted as payment evidence.
      return request(`/api/web/mua/commerce/orders/${id}`, { method: 'GET' });
    },
  });
}

export function verifiedCheckoutDestination(serverOrder) {
  if (serverOrder?.checkoutAvailable !== true || serverOrder?.state !== 'PaymentPending') throw new Error('Checkout is unavailable.');
  const url = new URL(serverOrder.checkoutUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'pay.payos.vn' || url.port || url.username || url.password) throw new Error('Invalid checkout destination.');
  return url.href;
}
