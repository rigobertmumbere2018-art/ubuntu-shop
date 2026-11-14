CREATE TABLE IF NOT EXISTS admin_signup_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(reviewed_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_admin_signup_requests_status ON admin_signup_requests(status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_signup_requests_pending_email ON admin_signup_requests(lower(email)) WHERE status='pending';
