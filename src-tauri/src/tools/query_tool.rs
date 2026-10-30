use rusqlite::Result;

use crate::db::repository::{
    Database, DatabaseStats, PluFilter, ReceiptFilter, StoredReceipt,
};
use crate::parser::models::PluItem;

/// Query tool for filtering, searching, and inspecting stored receipts.
pub fn search_receipts(
    db: &Database,
    filter: &ReceiptFilter,
) -> Result<Vec<StoredReceipt>> {
    db.query_receipts(filter)
}

/// Query tool for filtering stored PLU inventory items.
pub fn search_plu_items(
    db: &Database,
    filter: &PluFilter,
) -> Result<Vec<PluItem>> {
    db.query_plu_items(filter)
}

/// Retrieves general metrics and summary stats from the database.
pub fn get_statistics(db: &Database) -> Result<DatabaseStats> {
    db.get_stats()
}
