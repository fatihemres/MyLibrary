CREATE TABLE wishlist_items (
 id TEXT PRIMARY KEY NOT NULL, edition_id TEXT REFERENCES editions(id),
 title TEXT NOT NULL CHECK(length(trim(title))>0), author TEXT NOT NULL,
 isbn10 TEXT NOT NULL, isbn13 TEXT NOT NULL,
 preference TEXT NOT NULL CHECK(preference IN ('Any','Specific')), edition_description TEXT NOT NULL,
 priority TEXT NOT NULL CHECK(priority IN ('Low','Medium','High','Urgent')),
 status TEXT NOT NULL CHECK(status IN ('Wishing','On Order','Pre-Order','Cancelled')),
 target_minor INTEGER CHECK(target_minor IS NULL OR (typeof(target_minor)='integer' AND target_minor>=0)), currency TEXT NOT NULL,
 notes TEXT NOT NULL, archived_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE wishlist_retailers (
 id TEXT PRIMARY KEY NOT NULL, wishlist_id TEXT NOT NULL REFERENCES wishlist_items(id),
 name TEXT NOT NULL, url TEXT NOT NULL,
 offer_minor INTEGER CHECK(offer_minor IS NULL OR (typeof(offer_minor)='integer' AND offer_minor>=0)), currency TEXT NOT NULL,
 notes TEXT NOT NULL, position INTEGER NOT NULL CHECK(position>=0), UNIQUE(wishlist_id,position)
);
CREATE TABLE wishlist_status_history (
 id TEXT PRIMARY KEY NOT NULL, wishlist_id TEXT NOT NULL REFERENCES wishlist_items(id),
 status TEXT NOT NULL CHECK(status IN ('Wishing','On Order','Pre-Order','Cancelled')),
 created_at TEXT NOT NULL
);
CREATE INDEX wishlist_edition ON wishlist_items(edition_id);
CREATE INDEX wishlist_isbn ON wishlist_items(isbn13);
CREATE INDEX wishlist_history_item ON wishlist_status_history(wishlist_id);
CREATE VIRTUAL TABLE wishlist_search USING fts5(wishlist_id UNINDEXED,body,tokenize='unicode61 remove_diacritics 2');
INSERT INTO schema_migrations VALUES(4,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
PRAGMA user_version=4;
