CREATE TABLE editions (
 id TEXT PRIMARY KEY, title TEXT NOT NULL CHECK(length(trim(title))>0), subtitle TEXT NOT NULL DEFAULT '',
 isbn10 TEXT NOT NULL DEFAULT '', isbn13 TEXT NOT NULL DEFAULT '', publisher_id TEXT REFERENCES publishers(id),
 series_id TEXT REFERENCES series(id), series_order REAL, publication_year INTEGER, pages INTEGER CHECK(pages IS NULL OR pages>=0),
 language TEXT NOT NULL DEFAULT '', cover TEXT NOT NULL DEFAULT '', extra TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(extra)),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE people(id TEXT PRIMARY KEY, name TEXT NOT NULL COLLATE NOCASE UNIQUE, extra TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(extra)));
CREATE TABLE contributors(edition_id TEXT NOT NULL REFERENCES editions(id), person_id TEXT NOT NULL REFERENCES people(id), role TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(edition_id,person_id,role));
CREATE TABLE publishers(id TEXT PRIMARY KEY,name TEXT NOT NULL COLLATE NOCASE UNIQUE,extra TEXT NOT NULL DEFAULT '{}');
CREATE TABLE series(id TEXT PRIMARY KEY,name TEXT NOT NULL COLLATE NOCASE UNIQUE,extra TEXT NOT NULL DEFAULT '{}');
CREATE TABLE acquisition_sources(id TEXT PRIMARY KEY,name TEXT NOT NULL COLLATE NOCASE UNIQUE,extra TEXT NOT NULL DEFAULT '{}');
CREATE TABLE terms(id TEXT PRIMARY KEY,name TEXT NOT NULL COLLATE NOCASE,kind TEXT NOT NULL CHECK(kind IN ('genre','subgenre','category','tag','collection')),UNIQUE(name,kind));
CREATE TABLE edition_terms(edition_id TEXT NOT NULL REFERENCES editions(id),term_id TEXT NOT NULL REFERENCES terms(id),PRIMARY KEY(edition_id,term_id));
CREATE TABLE locations(id TEXT PRIMARY KEY,name TEXT NOT NULL,parent_id TEXT REFERENCES locations(id),extra TEXT NOT NULL DEFAULT '{}',CHECK(parent_id IS NULL OR parent_id<>id));
CREATE TABLE copies(
 id TEXT PRIMARY KEY,edition_id TEXT NOT NULL REFERENCES editions(id),barcode TEXT NOT NULL DEFAULT '',location_id TEXT REFERENCES locations(id),
 source_id TEXT REFERENCES acquisition_sources(id),status TEXT NOT NULL DEFAULT 'Unread' CHECK(status IN ('Unread','Want to Read','Reading','Paused','Finished','Abandoned','Reference Only')),
 rating REAL CHECK(rating IS NULL OR (rating>=0 AND rating<=5 AND rating*2=CAST(rating*2 AS INTEGER))),
 favorite INTEGER NOT NULL DEFAULT 0 CHECK(favorite IN (0,1)),current_page INTEGER NOT NULL DEFAULT 0 CHECK(current_page>=0),
 acquisition_date TEXT NOT NULL DEFAULT '',condition TEXT NOT NULL DEFAULT 'Good',
 extra TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(extra)),deleted_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE TABLE loans(id TEXT PRIMARY KEY,copy_id TEXT NOT NULL REFERENCES copies(id),borrower TEXT NOT NULL CHECK(length(trim(borrower))>0),contact TEXT NOT NULL DEFAULT '',loan_date TEXT NOT NULL,due_date TEXT NOT NULL DEFAULT '',returned_date TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',CHECK(due_date='' OR due_date>=loan_date),CHECK(returned_date='' OR returned_date>=loan_date));
CREATE UNIQUE INDEX one_active_loan ON loans(copy_id) WHERE returned_date='';
CREATE TABLE entries(id TEXT PRIMARY KEY,copy_id TEXT NOT NULL REFERENCES copies(id),kind TEXT NOT NULL CHECK(kind IN ('note','quote','reading')),title TEXT NOT NULL DEFAULT '',content TEXT NOT NULL DEFAULT '',page INTEGER CHECK(page IS NULL OR page>=0),extra TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(extra)),created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE attachments(id TEXT PRIMARY KEY,copy_id TEXT NOT NULL REFERENCES copies(id),name TEXT NOT NULL,path TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE custom_fields(id TEXT PRIMARY KEY,name TEXT NOT NULL COLLATE NOCASE UNIQUE,kind TEXT NOT NULL CHECK(kind IN ('text','multiline','integer','decimal','date','checkbox','dropdown')),extra TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(extra)));
CREATE TABLE custom_values(copy_id TEXT NOT NULL REFERENCES copies(id),field_id TEXT NOT NULL REFERENCES custom_fields(id),value TEXT NOT NULL,PRIMARY KEY(copy_id,field_id));
CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE change_history(id INTEGER PRIMARY KEY,copy_id TEXT NOT NULL REFERENCES copies(id),action TEXT NOT NULL,snapshot TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX editions_title ON editions(title COLLATE NOCASE);
CREATE INDEX editions_isbn10 ON editions(isbn10);
CREATE INDEX editions_isbn13 ON editions(isbn13);
CREATE INDEX editions_series ON editions(series_id,series_order);
CREATE INDEX editions_publisher ON editions(publisher_id);
CREATE INDEX copies_edition ON copies(edition_id);
CREATE INDEX copies_location ON copies(location_id);
CREATE INDEX copies_status ON copies(status,deleted_at);
CREATE INDEX copies_barcode ON copies(barcode);
CREATE INDEX contributors_person ON contributors(person_id);
CREATE INDEX terms_reverse ON edition_terms(term_id);
CREATE INDEX entries_copy ON entries(copy_id,kind);
CREATE INDEX loans_copy ON loans(copy_id);
CREATE INDEX attachments_copy ON attachments(copy_id);
CREATE VIRTUAL TABLE book_search USING fts5(copy_id UNINDEXED,body,tokenize='unicode61 remove_diacritics 2');
PRAGMA user_version=1;
