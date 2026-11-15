-- Store the required product deposit as a percentage of the selected product price.
ALTER TABLE products ADD COLUMN deposit_percent REAL NOT NULL DEFAULT 0 CHECK(deposit_percent >= 0 AND deposit_percent <= 100);
