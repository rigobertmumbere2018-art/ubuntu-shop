-- 0002: add supporting commerce tables while keeping order/payment writes disabled until admin setup.
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE,
  csrf_hash TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);
CREATE TABLE IF NOT EXISTS product_media (
  id TEXT PRIMARY KEY, product_id TEXT NOT NULL, object_key TEXT NOT NULL,
  alt_fr TEXT NOT NULL, alt_en TEXT, sort_order INTEGER NOT NULL DEFAULT 0,
  is_cover INTEGER NOT NULL DEFAULT 0 CHECK(is_cover IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_product_media_product ON product_media(product_id,sort_order);
CREATE TABLE IF NOT EXISTS order_events (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL, actor_user_id TEXT,
  event_type TEXT NOT NULL, details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(actor_user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id,created_at);
CREATE TABLE IF NOT EXISTS payment_proofs (
  id TEXT PRIMARY KEY, payment_id TEXT NOT NULL, object_key TEXT NOT NULL,
  original_name TEXT NOT NULL, mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reviewed_by TEXT, reviewed_at TEXT, review_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY(reviewed_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON payment_proofs(status);
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY, receipt_number TEXT NOT NULL UNIQUE,
  payment_id TEXT NOT NULL UNIQUE, issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(payment_id) REFERENCES payments(id)
);
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY, invoice_number TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL UNIQUE, subtotal_cents INTEGER NOT NULL CHECK(subtotal_cents>=0),
  total_cents INTEGER NOT NULL CHECK(total_cents>=0), issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id)
);
