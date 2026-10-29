# Commerce draft contract — local only

`contract.mjs` is not imported by the landing page or copied by `scripts/build.mjs`.
No commerce endpoints exist in production from this change. No network transport,
login page, checkout page or payment trigger has been implemented here.

The future web BFF must establish an authenticated BBook session, derive MUA identity
from it, enforce CSRF/rate limits/ownership and map DTOs without provider references.
Do not use URL user IDs, Origin or a client platform header to prove ownership or to
claim that a purchase was independently initiated outside Android.

Proposed, currently unimplemented endpoints:

- POST `/api/web/mua/commerce/orders`: productId + termsVersion, Idempotency-Key header.
- GET `/api/web/mua/commerce/orders/{id}`: owner-only result read, no fulfillment side effect.
- Catalog, eligibility, history and session endpoints must also be specified before UI work.

Price and expiry come from the backend. Redirect result parameters never establish
payment. A future authenticated pending order may return checkoutAvailable + a hosted
PayOS URL; validate destination and require a deliberate website purchase action.
Never load or reuse this draft in Android WebViews or purchase deep links.

Main analysis and blockers: `D:/EXE/BeautyBook/docs/MUA-MONETIZATION-PAYOS-DECISION.md`.
Run local contract checks with `node --test scripts/commerce-contract.test.mjs`.
