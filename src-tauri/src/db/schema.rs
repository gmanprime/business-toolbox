use rusqlite::{Connection, Result};

/// Converts "DD/MM/YYYY" to "YYYY-MM-DD" for ISO SQL queries.
pub fn normalize_date_to_iso(date_str: &str) -> String {
    let parts: Vec<&str> = date_str.split('/').collect();
    if parts.len() == 3 && parts[0].len() == 2 && parts[1].len() == 2 && parts[2].len() == 4 {
        format!("{}-{}-{}", parts[2], parts[1], parts[0])
    } else {
        date_str.to_string()
    }
}

pub fn initialize_schema(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,           -- 'fs', 'z', 'x', 'other'
            mrc TEXT NOT NULL,                -- e.g. 'HEK0105410'
            fs_no TEXT,                       -- string formatted e.g. '00000001'
            fs_number INTEGER,                -- numeric for range queries (1..=426)
            date TEXT NOT NULL,               -- 'DD/MM/YYYY'
            time TEXT NOT NULL,               -- 'HH:MM'
            date_iso TEXT NOT NULL,           -- 'YYYY-MM-DD'
            txbl1 REAL NOT NULL DEFAULT 0.0,
            tax1 REAL NOT NULL DEFAULT 0.0,
            total REAL NOT NULL DEFAULT 0.0,
            item_count INTEGER NOT NULL DEFAULT 0,
            is_void INTEGER NOT NULL DEFAULT 0,
            raw_content TEXT NOT NULL,
            hash_primary TEXT NOT NULL,
            hash_secondary TEXT NOT NULL,
            imported_at TEXT NOT NULL,
            CONSTRAINT uq_receipt_hashes UNIQUE (hash_primary, hash_secondary)
        );

        CREATE TABLE IF NOT EXISTS receipt_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_id INTEGER NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
            line_number INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            vat REAL NOT NULL,
            total_incl_tax REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS plu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_no INTEGER NOT NULL,
            date TEXT NOT NULL,
            date_iso TEXT NOT NULL,
            item_name TEXT NOT NULL,
            price REAL NOT NULL,
            qty REAL NOT NULL,
            amount REAL NOT NULL,
            hash_primary TEXT NOT NULL,
            hash_secondary TEXT NOT NULL,
            imported_at TEXT NOT NULL,
            CONSTRAINT uq_plu_hashes UNIQUE (hash_primary, hash_secondary)
        );

        -- Indexes for high performance filtering and search
        CREATE INDEX IF NOT EXISTS idx_receipts_mrc_fs ON receipts(mrc, fs_number);
        CREATE INDEX IF NOT EXISTS idx_receipts_date_iso ON receipts(date_iso);
        CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);
        CREATE INDEX IF NOT EXISTS idx_receipts_is_void ON receipts(is_void);
        CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
        CREATE INDEX IF NOT EXISTS idx_receipt_items_name ON receipt_items(item_name);
        CREATE INDEX IF NOT EXISTS idx_plu_items_date_iso ON plu_items(date_iso);
        CREATE INDEX IF NOT EXISTS idx_plu_items_name ON plu_items(item_name);
        "#,
    )?;

    Ok(())
}
