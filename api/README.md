# GYMFLOW API foundation (Cloudflare Workers + D1)

This backend foundation is not live until a Cloudflare D1 database, Worker secrets, and deployment are configured.

## Included
- GET /api/products: public active-product catalog.
- POST /api/orders: customer order creation.
- Admin product list/create/update/deactivate endpoints.
- Admin order list endpoint.
- Server-side price calculation from D1, parameterized SQL, and basic input validation.

## 1. Create the D1 database
From the api folder:
\`\`\`powershell
npx wrangler d1 create gymflow-db
\`\`\`
Copy the returned database_id into wrangler.toml.

## 2. Apply the schema
\`\`\`powershell
npx wrangler d1 execute gymflow-db --remote --file=./schema.sql
\`\`\`

## 3. Configure secrets
Generate a long random admin token and set it as a Worker secret:
\`\`\`powershell
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put ALLOWED_ORIGINS
npx wrangler secret put SHIPPING_FEE_EGP
\`\`\`
For local development, create a .dev.vars file (never commit it):
\`\`\`
ADMIN_TOKEN=replace-with-a-long-random-secret
ALLOWED_ORIGINS=http://localhost:5500,https://mohmedosman254.github.io
SHIPPING_FEE_EGP=0
\`\`\`

## 4. Run and deploy
\`\`\`powershell
npx wrangler dev
npx wrangler deploy
\`\`\`

## API contract
- GET /api/health
- GET /api/products
- POST /api/orders with customer_name, phone, optional alternate_phone, governorate, address, payment_method (cod, instapay, etisalat_cash) and items (product_id, quantity).
- GET /api/admin/orders with Authorization: Bearer ADMIN_TOKEN.
- GET /api/admin/products with Authorization: Bearer ADMIN_TOKEN.
- POST /api/admin/products with Authorization: Bearer ADMIN_TOKEN.
- PUT /api/admin/products/:id with Authorization: Bearer ADMIN_TOKEN.
- DELETE /api/admin/products/:id with Authorization: Bearer ADMIN_TOKEN (deactivates rather than erases).

Order totals are calculated from database prices. Orders are saved as pending. This does not initiate digital payments, reserve stock, connect to a courier, or provide a browser-based admin interface. These integrations and protections must be completed before public launch.
