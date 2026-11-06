CREATE TABLE wishlist_acquisitions (
 id TEXT PRIMARY KEY NOT NULL,
 wishlist_id TEXT NOT NULL REFERENCES wishlist_items(id),
 copy_id TEXT NOT NULL UNIQUE REFERENCES copies(id),
 acquired_at TEXT NOT NULL,
 reopened_at TEXT
);
CREATE UNIQUE INDEX wishlist_acquisition_active ON wishlist_acquisitions(wishlist_id) WHERE reopened_at IS NULL;
INSERT INTO schema_migrations VALUES(5,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
PRAGMA user_version=5;
