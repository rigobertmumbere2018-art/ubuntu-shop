-- Migration 0001: Initial Schema for Ubuntu Shop

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name_fr TEXT NOT NULL,
    name_en TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    category_id TEXT NOT NULL,
    support_fr TEXT,
    support_en TEXT,
    description_fr TEXT NOT NULL,
    description_en TEXT NOT NULL,
    price_min_usd REAL NOT NULL,
    price_max_usd REAL NOT NULL,
    deposit_min_usd REAL NOT NULL,
    dimensions TEXT,
    personalization_options TEXT,
    availability TEXT DEFAULT 'available',
    stock INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,
    total_usd REAL NOT NULL,
    total_cdf REAL NOT NULL,
    deposit_required_usd REAL NOT NULL,
    deposit_paid_usd REAL NOT NULL DEFAULT 0,
    balance_due_usd REAL NOT NULL,
    payment_status TEXT DEFAULT 'unpaid',
    production_status TEXT DEFAULT 'pending',
    delivery_mode TEXT NOT NULL,
    delivery_address TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price_usd REAL NOT NULL,
    total_price_usd REAL NOT NULL,
    deposit_rule_snapshot TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    amount_usd REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    verified_by TEXT,
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS exchange_rates (
    id TEXT PRIMARY KEY,
    currency_from TEXT NOT NULL,
    currency_to TEXT NOT NULL,
    rate REAL NOT NULL,
    updated_by TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
