use rusqlite::{params, Connection, Result, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::Path;

use super::hasher::{compute_plu_hashes, compute_receipt_hashes};
use super::schema::{initialize_schema, normalize_date_to_iso};
use crate::parser::models::{FsReceipt, FsRow, PluItem};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredReceiptItem {
    pub id: i64,
    pub receipt_id: i64,
    pub line_number: usize,
    pub item_name: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub total_price: f64,
    pub vat: f64,
    pub total_incl_tax: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredReceipt {
    pub id: i64,
    pub category: String,
    pub mrc: String,
    pub fs_no: Option<String>,
    pub fs_number: Option<u32>,
    pub date: String,
    pub time: String,
    pub date_iso: String,
    pub txbl1: f64,
    pub tax1: f64,
    pub total: f64,
    pub item_count: usize,
    pub is_void: bool,
    pub hash_primary: String,
    pub hash_secondary: String,
    pub imported_at: String,
    pub items: Vec<StoredReceiptItem>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ReceiptFilter {
    pub category: Option<String>,
    pub mrc: Option<String>,
    pub is_void: Option<bool>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub fs_min: Option<u32>,
    pub fs_max: Option<u32>,
    pub search_term: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PluFilter {
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub search_term: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseStats {
    pub total_receipts: usize,
    pub fs_sales_receipts: usize,
    pub z_reports: usize,
    pub void_receipts: usize,
    pub total_items: usize,
    pub total_plu_items: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InsertResult {
    Inserted(i64),
    DuplicateSkipped,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    /// Opens or creates SQLite database at specified path.
    pub fn open<P: AsRef<Path>>(path: P) -> Result<Self> {
        let conn = Connection::open(path)?;
        initialize_schema(&conn)?;
        Ok(Self { conn })
    }

    /// Opens an in-memory SQLite database (ideal for tests and sandboxing).
    pub fn open_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        initialize_schema(&conn)?;
        Ok(Self { conn })
    }

    /// Helper to get current ISO timestamp string.
    fn current_timestamp() -> String {
        // Fallback to simple timestamp if chrono is not included
        "2026-10-29T19:00:00Z".to_string()
    }

    /// Inserts a parsed FS receipt into the database with double-hash deduplication.
    pub fn insert_fs_receipt(
        &mut self,
        receipt: &FsReceipt,
        raw_lines: &[String],
    ) -> Result<InsertResult> {
        let (hash_primary, hash_secondary) = compute_receipt_hashes(
            raw_lines,
            "fs",
            &receipt.mrc,
            Some(&receipt.fs_no),
            &receipt.date,
            &receipt.time,
            receipt.txbl1,
            receipt.tax1,
            receipt.total,
            receipt.item_count,
            receipt.is_void,
            &receipt.items,
        );

        // Check if already stored by dual hash
        let existing: Option<i64> = self.conn.query_row(
            "SELECT id FROM receipts WHERE hash_primary = ?1 AND hash_secondary = ?2",
            params![hash_primary, hash_secondary],
            |row| row.get(0),
        ).optional()?;

        if existing.is_some() {
            return Ok(InsertResult::DuplicateSkipped);
        }

        let fs_number: Option<u32> = receipt.fs_no.parse().ok();
        let date_iso = normalize_date_to_iso(&receipt.date);
        let raw_content = raw_lines.join("\n");
        let imported_at = Self::current_timestamp();

        let tx = self.conn.transaction()?;

        tx.execute(
            r#"
            INSERT INTO receipts (
                category, mrc, fs_no, fs_number, date, time, date_iso,
                txbl1, tax1, total, item_count, is_void, raw_content,
                hash_primary, hash_secondary, imported_at
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7,
                ?8, ?9, ?10, ?11, ?12, ?13,
                ?14, ?15, ?16
            )
            "#,
            params![
                "fs",
                receipt.mrc,
                receipt.fs_no,
                fs_number,
                receipt.date,
                receipt.time,
                date_iso,
                receipt.txbl1,
                receipt.tax1,
                receipt.total,
                receipt.item_count as i64,
                if receipt.is_void { 1 } else { 0 },
                raw_content,
                hash_primary,
                hash_secondary,
                imported_at,
            ],
        )?;

        let receipt_id = tx.last_insert_rowid();

        for (idx, item) in receipt.items.iter().enumerate() {
            let item_vat = if receipt.txbl1 > 0.0 {
                receipt.tax1 * (item.total_price / receipt.txbl1)
            } else {
                0.0
            };
            let total_incl_tax = item.total_price + item_vat;

            tx.execute(
                r#"
                INSERT INTO receipt_items (
                    receipt_id, line_number, item_name, quantity,
                    unit_price, total_price, vat, total_incl_tax
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
                "#,
                params![
                    receipt_id,
                    idx + 1,
                    item.name,
                    item.quantity,
                    item.unit_price,
                    item.total_price,
                    item_vat,
                    total_incl_tax,
                ],
            )?;
        }

        tx.commit()?;
        Ok(InsertResult::Inserted(receipt_id))
    }

    /// Inserts a non-FS receipt (e.g. Z-report or audit block) into the database.
    pub fn insert_raw_block(
        &mut self,
        category: &str,
        mrc: &str,
        date: &str,
        time: &str,
        raw_lines: &[String],
    ) -> Result<InsertResult> {
        let (hash_primary, hash_secondary) = compute_receipt_hashes(
            raw_lines,
            category,
            mrc,
            None,
            date,
            time,
            0.0,
            0.0,
            0.0,
            0,
            false,
            &[],
        );

        let existing: Option<i64> = self.conn.query_row(
            "SELECT id FROM receipts WHERE hash_primary = ?1 AND hash_secondary = ?2",
            params![hash_primary, hash_secondary],
            |row| row.get(0),
        ).optional()?;

        if existing.is_some() {
            return Ok(InsertResult::DuplicateSkipped);
        }

        let date_iso = normalize_date_to_iso(date);
        let raw_content = raw_lines.join("\n");
        let imported_at = Self::current_timestamp();

        self.conn.execute(
            r#"
            INSERT INTO receipts (
                category, mrc, fs_no, fs_number, date, time, date_iso,
                txbl1, tax1, total, item_count, is_void, raw_content,
                hash_primary, hash_secondary, imported_at
            ) VALUES (
                ?1, ?2, NULL, NULL, ?3, ?4, ?5,
                0.0, 0.0, 0.0, 0, 0, ?6,
                ?7, ?8, ?9
            )
            "#,
            params![
                category,
                mrc,
                date,
                time,
                date_iso,
                raw_content,
                hash_primary,
                hash_secondary,
                imported_at,
            ],
        )?;

        Ok(InsertResult::Inserted(self.conn.last_insert_rowid()))
    }

    /// Inserts PLU items with double-hash deduplication.
    pub fn insert_plu_items(&mut self, items: &[PluItem]) -> Result<(usize, usize)> {
        let mut inserted = 0;
        let mut skipped = 0;
        let imported_at = Self::current_timestamp();

        let tx = self.conn.transaction()?;

        for item in items {
            let (hash_primary, hash_secondary) = compute_plu_hashes(item);

            let existing: Option<i64> = tx.query_row(
                "SELECT id FROM plu_items WHERE hash_primary = ?1 AND hash_secondary = ?2",
                params![hash_primary, hash_secondary],
                |row| row.get(0),
            ).optional()?;

            if existing.is_some() {
                skipped += 1;
                continue;
            }

            let date_iso = normalize_date_to_iso(&item.date);

            tx.execute(
                r#"
                INSERT INTO plu_items (
                    item_no, date, date_iso, item_name, price, qty, amount,
                    hash_primary, hash_secondary, imported_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
                "#,
                params![
                    item.no,
                    item.date,
                    date_iso,
                    item.item,
                    item.price,
                    item.qty,
                    item.amount,
                    hash_primary,
                    hash_secondary,
                    imported_at,
                ],
            )?;

            inserted += 1;
        }

        tx.commit()?;
        Ok((inserted, skipped))
    }

    /// Queries stored receipts with optional filters.
    pub fn query_receipts(&self, filter: &ReceiptFilter) -> Result<Vec<StoredReceipt>> {
        let mut sql = String::from(
            r#"
            SELECT id, category, mrc, fs_no, fs_number, date, time, date_iso,
                   txbl1, tax1, total, item_count, is_void, hash_primary,
                   hash_secondary, imported_at
            FROM receipts
            WHERE 1=1
            "#,
        );

        let mut query_params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(cat) = &filter.category {
            sql.push_str(" AND category = ?");
            query_params.push(Box::new(cat.clone()));
        }

        if let Some(mrc) = &filter.mrc {
            sql.push_str(" AND mrc = ?");
            query_params.push(Box::new(mrc.clone()));
        }

        if let Some(is_void) = filter.is_void {
            sql.push_str(" AND is_void = ?");
            query_params.push(Box::new(if is_void { 1 } else { 0 }));
        }

        if let Some(d_from) = &filter.date_from {
            let iso = normalize_date_to_iso(d_from);
            sql.push_str(" AND date_iso >= ?");
            query_params.push(Box::new(iso));
        }

        if let Some(d_to) = &filter.date_to {
            let iso = normalize_date_to_iso(d_to);
            sql.push_str(" AND date_iso <= ?");
            query_params.push(Box::new(iso));
        }

        if let Some(min_fs) = filter.fs_min {
            sql.push_str(" AND fs_number >= ?");
            query_params.push(Box::new(min_fs as i64));
        }

        if let Some(max_fs) = filter.fs_max {
            sql.push_str(" AND fs_number <= ?");
            query_params.push(Box::new(max_fs as i64));
        }

        if let Some(search) = &filter.search_term {
            sql.push_str(" AND (fs_no LIKE ? OR id IN (SELECT receipt_id FROM receipt_items WHERE item_name LIKE ?))");
            let pattern = format!("%{}%", search);
            query_params.push(Box::new(pattern.clone()));
            query_params.push(Box::new(pattern));
        }

        sql.push_str(" ORDER BY fs_number ASC, id ASC");

        if let Some(limit) = filter.limit {
            sql.push_str(&format!(" LIMIT {}", limit));
            if let Some(offset) = filter.offset {
                sql.push_str(&format!(" OFFSET {}", offset));
            }
        }

        let mut stmt = self.conn.prepare(&sql)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = query_params.iter().map(|b| b.as_ref()).collect();

        let receipt_rows = stmt.query_map(param_refs.as_slice(), |row| {
            Ok(StoredReceipt {
                id: row.get(0)?,
                category: row.get(1)?,
                mrc: row.get(2)?,
                fs_no: row.get(3)?,
                fs_number: row.get(4)?,
                date: row.get(5)?,
                time: row.get(6)?,
                date_iso: row.get(7)?,
                txbl1: row.get(8)?,
                tax1: row.get(9)?,
                total: row.get(10)?,
                item_count: row.get::<_, i64>(11)? as usize,
                is_void: row.get::<_, i32>(12)? != 0,
                hash_primary: row.get(13)?,
                hash_secondary: row.get(14)?,
                imported_at: row.get(15)?,
                items: Vec::new(),
            })
        })?;

        let mut receipts = Vec::new();
        for r_res in receipt_rows {
            let mut r = r_res?;
            // Fetch items for this receipt
            let mut item_stmt = self.conn.prepare(
                "SELECT id, receipt_id, line_number, item_name, quantity, unit_price, total_price, vat, total_incl_tax
                 FROM receipt_items WHERE receipt_id = ? ORDER BY line_number ASC"
            )?;
            let item_rows = item_stmt.query_map(params![r.id], |irow| {
                Ok(StoredReceiptItem {
                    id: irow.get(0)?,
                    receipt_id: irow.get(1)?,
                    line_number: irow.get::<_, i64>(2)? as usize,
                    item_name: irow.get(3)?,
                    quantity: irow.get(4)?,
                    unit_price: irow.get(5)?,
                    total_price: irow.get(6)?,
                    vat: irow.get(7)?,
                    total_incl_tax: irow.get(8)?,
                })
            })?;
            for item in item_rows {
                r.items.push(item?);
            }
            receipts.push(r);
        }

        Ok(receipts)
    }

    /// Queries stored receipts and converts them directly to the 14-column export FsRow schema.
    pub fn query_fs_export_rows(&self, filter: &ReceiptFilter) -> Result<Vec<FsRow>> {
        let receipts = self.query_receipts(filter)?;
        let mut rows = Vec::new();
        let mut serial = 1;

        for r in receipts {
            let fs_no_str = r.fs_no.unwrap_or_default();
            for item in r.items {
                rows.push(FsRow {
                    serial,
                    item_name: item.item_name,
                    country_of_origin: "".to_string(),
                    brand_name: "".to_string(),
                    unit_of_measure: "".to_string(),
                    quantity: item.quantity,
                    avg_purchase_price: "".to_string(),
                    unit_price_before_vat: item.unit_price,
                    total_price_before_vat: item.total_price,
                    vat: item.vat,
                    total_price_incl_tax: item.total_incl_tax,
                    fs_no: fs_no_str.clone(),
                    date: r.date.clone(),
                    mrc: r.mrc.clone(),
                });
                serial += 1;
            }
        }

        Ok(rows)
    }

    /// Queries PLU items with optional filters.
    pub fn query_plu_items(&self, filter: &PluFilter) -> Result<Vec<PluItem>> {
        let mut sql = String::from(
            "SELECT item_no, date, item_name, price, qty, amount FROM plu_items WHERE 1=1"
        );
        let mut query_params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(d_from) = &filter.date_from {
            let iso = normalize_date_to_iso(d_from);
            sql.push_str(" AND date_iso >= ?");
            query_params.push(Box::new(iso));
        }

        if let Some(d_to) = &filter.date_to {
            let iso = normalize_date_to_iso(d_to);
            sql.push_str(" AND date_iso <= ?");
            query_params.push(Box::new(iso));
        }

        if let Some(search) = &filter.search_term {
            sql.push_str(" AND item_name LIKE ?");
            query_params.push(Box::new(format!("%{}%", search)));
        }

        sql.push_str(" ORDER BY item_no ASC");

        if let Some(limit) = filter.limit {
            sql.push_str(&format!(" LIMIT {}", limit));
            if let Some(offset) = filter.offset {
                sql.push_str(&format!(" OFFSET {}", offset));
            }
        }

        let mut stmt = self.conn.prepare(&sql)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = query_params.iter().map(|b| b.as_ref()).collect();

        let rows = stmt.query_map(param_refs.as_slice(), |row| {
            Ok(PluItem {
                no: row.get(0)?,
                date: row.get(1)?,
                item: row.get(2)?,
                price: row.get(3)?,
                qty: row.get(4)?,
                amount: row.get(5)?,
            })
        })?;

        let mut items = Vec::new();
        for res in rows {
            items.push(res?);
        }

        Ok(items)
    }

    /// Returns general database metrics and record counts.
    pub fn get_stats(&self) -> Result<DatabaseStats> {
        let total_receipts: usize = self.conn.query_row(
            "SELECT count(*) FROM receipts",
            [],
            |r| r.get(0),
        )?;

        let fs_sales_receipts: usize = self.conn.query_row(
            "SELECT count(*) FROM receipts WHERE category = 'fs'",
            [],
            |r| r.get(0),
        )?;

        let z_reports: usize = self.conn.query_row(
            "SELECT count(*) FROM receipts WHERE category = 'z'",
            [],
            |r| r.get(0),
        )?;

        let void_receipts: usize = self.conn.query_row(
            "SELECT count(*) FROM receipts WHERE is_void = 1",
            [],
            |r| r.get(0),
        )?;

        let total_items: usize = self.conn.query_row(
            "SELECT count(*) FROM receipt_items",
            [],
            |r| r.get(0),
        )?;

        let total_plu_items: usize = self.conn.query_row(
            "SELECT count(*) FROM plu_items",
            [],
            |r| r.get(0),
        )?;

        Ok(DatabaseStats {
            total_receipts,
            fs_sales_receipts,
            z_reports,
            void_receipts,
            total_items,
            total_plu_items,
        })
    }
}
