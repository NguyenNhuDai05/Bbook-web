# BBook landing redesign

Local implementation, 26 October 2026. No deployment, commit or push is included.

## Direction and structure

Premium beauty campaign with alternating audience stories. The approved user reference determines the rose palette, serif headlines, floral photography and real app mockups. Live HTML carries all product copy and controls.

1. Hero: headline and Google Play/QR on the left; editorial portrait and real app screens on the right.
2. Customer: illustration on the left; portfolio, services, booking and following benefits on the right.
3. Makeup Artist: copy and real app download CTA on the left; brush portrait on the right.
4. Product: three existing screenshots, accessible image viewer, booking sequence.
5. Download: actual Play listing, official Vietnamese badge and an encoded QR.
6. FAQ: native keyboard-operable details elements, current Android availability.
7. Footer: navigation, support and existing legal URLs.

No reviews, user counts, download counts or verification claims were invented. The source contains three real screenshots only; separate discovery, calendar and sharing captures remain unavailable. No AI app UI replaces them.

## Tokens and responsive layout

- Ivory `#fff8f8`, blush `#fbe6ed`, rose `#c82264`, burgundy `#4b1328`, text `#30232b`, muted `#66545f`.
- Playfair Display for headlines; Be Vietnam Pro for Vietnamese body text. Google Fonts uses swap and preconnect.
- Container max-width 1280px, responsive gutters 48/32/20/16px.
- Breakpoints 1190, 980, 700 and 360px; adjustments above 1600px.
- Mobile uses separately cropped images and one hero phone, with headline and download CTA first. Customer and MUA stories become vertical. No fixed text heights.
- Gradients and masks blend photo boundaries into the shared blush background. No heavy parallax, autoplay or animation dependency.
- Keyboard focus, skip link, native dialog focus containment/restoration and reduced motion rules are retained. Content no longer starts hidden behind reveal animations.
- Consent defaults and event behavior remain unchanged; its panel is in document flow after the footer so it cannot obscure the app CTA.

## Asset provenance

All campaign portraits come from the user's supplied `5aff22c4-6a7c-4dc8-b09e-6ee532449df9.png`, 1024×1536. No newly generated model or stock image is used. The sheet is exported into individual WebP bands and crops, never stretched over the whole website. The original source remains in Downloads.

| Asset under assets/images/ | Source rectangle (left, top, right, bottom) |
| --- | --- |
| campaign-hero-v1.webp | 0, 0, 1024, 375 |
| campaign-hero-mobile-v1.webp | 640, 0, 1024, 375 |
| campaign-customer-mobile-v1.webp | 0, 384, 440, 638; used as an independent visual block |
| campaign-artist-mobile-v1.webp | 420, 650, 1024, 884; used in desktop and mobile composition |
| campaign-features-v1.webp | 0, 893, 1024, 1065 |
| campaign-download-v1.webp | 0, 1073, 1024, 1302 |
| campaign-download-mobile-v1.webp | 0, 1073, 440, 1302 |
| campaign-flowers-v1.webp | 0, 1313, 1024, 1536 |

Eight campaign exports total 202,408 bytes. Hero desktop is 47,364 bytes; mobile is 28,522 bytes. Explicit image dimensions, responsive picture sources, hero fetch priority and below-fold lazy loading avoid unnecessary requests and layout instability. These are file-size measurements, not measured Core Web Vitals.

`campaign-social-v1.jpg` exports the hero band as a JPEG for Open Graph previews. It is only referenced in metadata, not downloaded as an extra hero image.

`bbook-wordmark-mask.webp` is a lossless resized export of the existing transparent `b.png` artwork. Header/footer render its alpha with a rose/burgundy CSS gradient, without a background tile; no new logo is generated. `bbook-icon.png` crops the master logo's B symbol for a legible small favicon. The original assets remain available for legacy/legal/sharing references. Google Play badge is downloaded from Google's official badge endpoint:
https://play.google.com/intl/en_us/badges/static/images/badges/vi_badge_web_generic.png

`google-play-qr.svg` is generated offline using the existing ReportLab QR encoder, error correction L and four-module quiet zone. It encodes exactly:
https://play.google.com/store/apps/details?id=com.bbook.app

## Verification commands

```powershell
npm run check
npm test
npm run build
# Existing ESLint installation was reused; no package was installed in this repo.
node D:/EXE/bbeauty-app/node_modules/eslint/bin/eslint.js app.js analytics.js apk-counter.js scripts/*.mjs eslint.config.mjs
```

TypeScript and React checks are not applicable: this repository is plain HTML/CSS/JavaScript. A small ESLint flat config is included; ESLint is not a runtime dependency.

Regression tests cover landing asset URLs and MIME types, anchors, Play URLs, consent/events, APK exclusion, share redirects, social redirects, legal aliases and Android association JSON. Routing configuration, signing fingerprint, backend and mobile source are outside this change.

Visual QA uses the available CUA browser Playwright API and explicit viewport capability. Dedicated Playwright MCP/Chrome DevTools MCP tools are unavailable. Screenshot raster dimensions may be scaled by the browser panel; viewport dimensions are checked from the rendered DOM. Full-page proofs assemble actual scroll captures using their recorded offsets because direct full-page capture was unreliable in this browser session.

Core Web Vitals under a controlled mobile network and real-device testing remain unmeasured. Source imagery is 1024px wide, so higher-resolution originals would improve sharpness on large desktop screens without changing the layout.

## Final local QA results

| Viewport | Horizontal overflow | Hero Play CTA visible in first screen |
| --- | --- | --- |
| 360×800 | None | Yes |
| 390×844 | None | Yes |
| 430×932 | None | Yes |
| 768×1024 | None | Yes |
| 1024×768 | None | Yes |
| 1440×900 | None | Yes |
| 1920×1080 | None | Yes |

Refinement addressed a 4px overflow from the full-bleed customer image at 360px, tablet mockup/text proximity, mobile phones covering the face, oversized MUA portrait, abrupt background boundaries, the old oversized logo download, and the consent overlay covering the CTA. Tablet and mobile use one hero phone. Desktop keeps two where there is room.

Browser checks passed: menu open/close and Escape, focus restoration, screenshot dialog and Escape, FAQ by pointer and Enter, skip-link keyboard focus, privacy settings/reject choice. Both Vietnamese fonts loaded. After scrolling all sections on 390/768/1440, no broken image or console warning/error was observed.

Technical results: syntax check passed; ESLint passed with zero errors/warnings; 16/16 Node tests passed; production build passed; git diff whitespace check passed. TypeScript is not applicable. Legal HTML/text and association JSON have no content diff; the existing build's mobile-policy synchronization was also checked to preserve identical bytes.

Routes verified locally: `/`, `/mua/{guid}`, `/posts/{guid}`, `/.well-known/assetlinks.json`, `/privacy`, `/privacy/`, `/privacy.html`, `/delete-account`, `/delete-account/`, `/delete-account.html`, `/fb`, `/tt`, `/threads`. Old APK paths still return 404. No deployed-route claim is made because deployment is excluded.

Changed existing source: `index.html`, `styles.css`, `app.js`, `analytics.js`, `scripts/serve.mjs`, `scripts/profile-sharing.test.mjs`. Added: 13 image/badge/QR assets, `scripts/landing.test.mjs`, `eslint.config.mjs`, this report. No package dependency, backend, mobile feature, routing configuration, signing certificate, commit or push was changed.

Full-page visual proofs (assembled from recorded browser scroll captures):

- [Desktop 1440](D:/EXE/artifacts/bbook-redesign/final-1440-full.png)
- [Tablet 768](D:/EXE/artifacts/bbook-redesign/final-768-full.png)
- [Mobile 390](D:/EXE/artifacts/bbook-redesign/final-390-full.png)
- [Seven viewport measurements](D:/EXE/artifacts/bbook-redesign/responsive-results.json)

The three missing feature captures (discovery, calendar/booking, sharing) and controlled-network performance testing are the remaining optional additions. The delivered page uses the three available real captures throughout.

Follow-up refinements: removed the three visible illustration labels and their unused CSS. Replaced the pink boxed header/footer logo with the existing transparent wordmark styled in rose and burgundy. Responsive brand widths remain 174/151/139/123px, with accessible link names retained.
