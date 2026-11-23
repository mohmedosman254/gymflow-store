# GYMFLOW — Sports & Gymnastics Storefront

Arabic-first (RTL), responsive storefront prototype for the Egyptian sports and gymnastics market.

## Included
- Responsive landing page and mobile navigation.
- Arabic / English language switch (RTL/LTR).
- Product category filtering and search.
- Interactive demo cart with quantity controls.
- Explicit demo-catalog notices: no unverified prices, stock, claims, or customer testimonials.
- Accessible labels, reduced-motion-friendly browser defaults, and basic SEO metadata.

## Preview locally
Open `index.html` in a browser, or run a static server from this folder:

```powershell
py -m http.server 5500
```

Then visit `http://localhost:5500`.

## Publish with GitHub Pages
A workflow is included at `.github/workflows/deploy.yml`. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source. The workflow will publish the site after a push to `main`.

## Important: before accepting real orders
This repository is currently a frontend prototype. It does **not** include a production backend, inventory database, admin dashboard, payment processing, customer data storage, or real order submission.

Before launch:
1. Replace the sample products in `app.js` with the real approved catalog, photos, prices in EGP, descriptions, stock and variants.
2. Add the actual business WhatsApp number, support email and verified social profile links.
3. Build a secure backend and admin dashboard for products, inventory, orders and customer support.
4. Configure delivery fees and coverage, COD and payment providers, order notifications and tracking.
5. Add privacy policy, terms, shipping, returns and contact pages.
6. Test on real phones, browsers, accessibility tools and a staging environment.

**Security:** never put API keys, payment secrets, private tokens, or database credentials in frontend JavaScript or commit them to this repository.


## Backend foundation (in progress)
A Cloudflare Workers + D1 API foundation is available in [`api/`](api/README.md). It includes a product catalog endpoint, server-calculated order totals, order storage, and token-protected admin API routes. It is not deployed or connected to the storefront yet. Follow `api/README.md` to provision D1 and configure Worker secrets. Do not accept real customer orders until the backend, storefront integration, admin interface, shipping, payment instructions, and launch safeguards are complete.
