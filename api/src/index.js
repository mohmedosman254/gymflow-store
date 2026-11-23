const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const fail = (message, status = 400) => json({ error: message }, status);
function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean);
  const headers = new Headers({ "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Vary": "Origin" });
  if (allowed.includes(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}
function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  corsHeaders(request, env).forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { status: response.status, headers });
}
function validText(value, max) { return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max; }
function admin(request, env) { return Boolean(env.ADMIN_TOKEN && request.headers.get("Authorization") === "Bearer " + env.ADMIN_TOKEN); }

async function createOrder(request, env) {
  let body;
  try { body = await request.json(); } catch { return fail("Invalid JSON."); }
  if (!validText(body.customer_name, 120) || !validText(body.phone, 30) || !validText(body.governorate, 80) || !validText(body.address, 500)) return fail("Please provide name, phone, governorate and full address.");
  if (!["cod", "instapay", "etisalat_cash"].includes(body.payment_method)) return fail("Unsupported payment method.");
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) return fail("The order must contain between 1 and 30 products.");
  const ids = [...new Set(body.items.map(item => String(item.product_id || "")))];
  if (ids.length !== body.items.length || ids.some(id => !/^[a-zA-Z0-9_-]{1,64}$/.test(id))) return fail("Invalid or duplicate product.");
  const placeholders = ids.map(() => "?").join(",");
  const rows = await env.DB.prepare("SELECT id, name_ar, name_en, price_egp, stock FROM products WHERE is_active = 1 AND id IN (" + placeholders + ")").bind(...ids).all();
  const byId = new Map((rows.results || []).map(row => [row.id, row]));
  if (byId.size !== ids.length) return fail("One or more products are unavailable.", 409);
  let subtotal = 0;
  const items = [];
  for (const item of body.items) {
    const product = byId.get(String(item.product_id));
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return fail("Invalid product quantity.");
    if (quantity > product.stock) return fail("Insufficient stock for " + product.name_ar + ".", 409);
    subtotal += product.price_egp * quantity;
    items.push({ product, quantity });
  }
  const shippingFee = Math.max(0, Number.parseInt(env.SHIPPING_FEE_EGP || "0", 10) || 0);
  const orderId = "GF-" + crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const now = new Date().toISOString();
  const statements = [env.DB.prepare("INSERT INTO orders (id, customer_name, phone, alternate_phone, governorate, address, payment_method, subtotal_egp, shipping_fee_egp, total_egp, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)").bind(orderId, body.customer_name.trim(), body.phone.trim(), validText(body.alternate_phone, 30) ? body.alternate_phone.trim() : null, body.governorate.trim(), body.address.trim(), body.payment_method, subtotal, shippingFee, subtotal + shippingFee, now)];
  for (const item of items) statements.push(env.DB.prepare("INSERT INTO order_items (order_id, product_id, product_name_ar, product_name_en, unit_price_egp, quantity) VALUES (?, ?, ?, ?, ?, ?)").bind(orderId, item.product.id, item.product.name_ar, item.product.name_en, item.product.price_egp, item.quantity));
  await env.DB.batch(statements);
  return json({ ok: true, order_id: orderId, subtotal_egp: subtotal, shipping_fee_egp: shippingFee, total_egp: subtotal + shippingFee }, 201);
}
async function adminProducts(request, env, method, id) {
  if (method === "GET") {
    const result = await env.DB.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
    return json({ products: result.results || [] });
  }
  let body;
  try { body = await request.json(); } catch { return fail("Invalid JSON."); }
  if (method === "POST") {
    if (!validText(body.id, 64) || !validText(body.name_ar, 120) || !validText(body.name_en, 120) || !validText(body.category, 60) || !Number.isInteger(Number(body.price_egp)) || Number(body.price_egp) < 0 || !Number.isInteger(Number(body.stock)) || Number(body.stock) < 0) return fail("Required product fields are missing or invalid.");
    await env.DB.prepare("INSERT INTO products (id, name_ar, name_en, category, description_ar, description_en, price_egp, image_url, stock, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(body.id.trim(), body.name_ar.trim(), body.name_en.trim(), body.category.trim(), String(body.description_ar || ""), String(body.description_en || ""), Number(body.price_egp), String(body.image_url || ""), Number(body.stock), body.is_active === false ? 0 : 1, new Date().toISOString()).run();
    return json({ ok: true }, 201);
  }
  if (method === "PUT" && id) {
    if (!validText(body.name_ar, 120) || !validText(body.name_en, 120) || !Number.isInteger(Number(body.price_egp)) || Number(body.price_egp) < 0 || !Number.isInteger(Number(body.stock)) || Number(body.stock) < 0) return fail("Product fields are invalid.");
    const result = await env.DB.prepare("UPDATE products SET name_ar = ?, name_en = ?, category = ?, description_ar = ?, description_en = ?, price_egp = ?, image_url = ?, stock = ?, is_active = ? WHERE id = ?").bind(body.name_ar.trim(), body.name_en.trim(), String(body.category || "other"), String(body.description_ar || ""), String(body.description_en || ""), Number(body.price_egp), String(body.image_url || ""), Number(body.stock), body.is_active === false ? 0 : 1, id).run();
    if (!result.meta.changes) return fail("Product not found.", 404);
    return json({ ok: true });
  }
  if (method === "DELETE" && id) {
    const result = await env.DB.prepare("UPDATE products SET is_active = 0 WHERE id = ?").bind(id).run();
    if (!result.meta.changes) return fail("Product not found.", 404);
    return json({ ok: true });
  }
  return fail("Method not allowed.", 405);
}
async function adminOrders(env) {
  const result = await env.DB.prepare("SELECT o.*, (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.id) AS item_count FROM orders o ORDER BY created_at DESC LIMIT 200").all();
  return json({ orders: result.results || [] });
}
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), request, env);
    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
    try {
      let response;
      if (request.method === "GET" && path === "/api/health") response = json({ ok: true, service: "GYMFLOW API" });
      else if (request.method === "GET" && path === "/api/products") {
        const result = await env.DB.prepare("SELECT id, name_ar, name_en, category, description_ar, description_en, price_egp, image_url, stock FROM products WHERE is_active = 1 ORDER BY created_at DESC").all();
        response = json({ products: result.results || [] });
      } else if (request.method === "POST" && path === "/api/orders") response = await createOrder(request, env);
      else if (path.startsWith("/api/admin/") && !admin(request, env)) response = fail("Unauthorized.", 401);
      else if (request.method === "GET" && path === "/api/admin/orders") response = await adminOrders(env);
      else if (path === "/api/admin/products") response = await adminProducts(request, env, request.method, null);
      else if (path.startsWith("/api/admin/products/")) response = await adminProducts(request, env, request.method, decodeURIComponent(path.slice("/api/admin/products/".length)));
      else response = fail("Not found.", 404);
      return withCors(response, request, env);
    } catch (error) {
      return withCors(fail("Server error.", 500), request, env);
    }
  }
};
