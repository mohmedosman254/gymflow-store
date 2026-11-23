PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, name_ar TEXT NOT NULL, name_en TEXT NOT NULL, category TEXT NOT NULL,
  description_ar TEXT NOT NULL DEFAULT '', description_en TEXT NOT NULL DEFAULT '',
  price_egp INTEGER NOT NULL CHECK (price_egp >= 0), image_url TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0), is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, phone TEXT NOT NULL, alternate_phone TEXT,
  governorate TEXT NOT NULL, address TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'instapay', 'etisalat_cash')),
  subtotal_egp INTEGER NOT NULL CHECK (subtotal_egp >= 0), shipping_fee_egp INTEGER NOT NULL CHECK (shipping_fee_egp >= 0),
  total_egp INTEGER NOT NULL CHECK (total_egp >= 0), status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT NOT NULL,
  product_name_ar TEXT NOT NULL, product_name_en TEXT NOT NULL, unit_price_egp INTEGER NOT NULL CHECK (unit_price_egp >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
