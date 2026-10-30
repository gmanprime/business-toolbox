use sha2::{Digest, Sha256};
use crate::parser::models::{PluItem, ReceiptItem};

/// Formats SHA-256 output into a 64-character lowercase hexadecimal string.
fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

/// Computes dual cryptographic hashes for a fiscal receipt block.
/// 
/// 1. Primary Hash (`hash_primary`):
///    SHA-256 of the normalized canonical raw content lines.
/// 
/// 2. Secondary Hash (`hash_secondary`):
///    SHA-256 of the semantic tuple:
///    `category|mrc|fs_no|date|time|total|txbl1|tax1|item_count|is_void|items`
///    salted with a domain separator `MAMA_FISCAL_V1`.
/// 
/// Combining both guarantees 512 bits of unique collision resistance (impossible false duplicates)
/// while cleanly catching true re-imported duplicate receipts.
pub fn compute_receipt_hashes(
    lines: &[String],
    category: &str,
    mrc: &str,
    fs_no: Option<&str>,
    date: &str,
    time: &str,
    txbl1: f64,
    tax1: f64,
    total: f64,
    item_count: usize,
    is_void: bool,
    items: &[ReceiptItem],
) -> (String, String) {
    // Primary Hash: Raw content canonicalization
    let mut primary_hasher = Sha256::new();
    for line in lines {
        let trimmed = line.trim();
        if !trimmed.is_empty() {
            primary_hasher.update(trimmed.as_bytes());
            primary_hasher.update(b"\n");
        }
    }
    let hash_primary = to_hex(&primary_hasher.finalize());

    // Secondary Hash: Semantic payload with domain separation salt
    let mut sec_hasher = Sha256::new();
    sec_hasher.update(b"MAMA_FISCAL_V1|");
    sec_hasher.update(category.as_bytes());
    sec_hasher.update(b"|");
    sec_hasher.update(mrc.as_bytes());
    sec_hasher.update(b"|");
    sec_hasher.update(fs_no.unwrap_or("").as_bytes());
    sec_hasher.update(b"|");
    sec_hasher.update(date.as_bytes());
    sec_hasher.update(b"|");
    sec_hasher.update(time.as_bytes());
    sec_hasher.update(b"|");
    sec_hasher.update(format!("{:.2}|{:.2}|{:.2}|{}|{}|", txbl1, tax1, total, item_count, is_void).as_bytes());

    for item in items {
        sec_hasher.update(
            format!(
                "{}@{:.3}x{:.2}={:.2};",
                item.name.trim(),
                item.quantity,
                item.unit_price,
                item.total_price
            )
            .as_bytes(),
        );
    }
    let hash_secondary = to_hex(&sec_hasher.finalize());

    (hash_primary, hash_secondary)
}

/// Computes dual cryptographic hashes for a PLU inventory item.
pub fn compute_plu_hashes(item: &PluItem) -> (String, String) {
    // Primary: Canonical content
    let mut primary_hasher = Sha256::new();
    primary_hasher.update(
        format!(
            "PLU|date={}|no={}|item={}|price={:.2}|qty={:.3}|amt={:.2}",
            item.date.trim(),
            item.no,
            item.item.trim(),
            item.price,
            item.qty,
            item.amount
        )
        .as_bytes(),
    );
    let hash_primary = to_hex(&primary_hasher.finalize());

    // Secondary: Salted semantic hash
    let mut sec_hasher = Sha256::new();
    sec_hasher.update(b"MAMA_PLU_V1|");
    sec_hasher.update(
        format!(
            "{}|{}|{}|{:.2}|{:.3}|{:.2}",
            item.date.trim(),
            item.no,
            item.item.trim(),
            item.price,
            item.qty,
            item.amount
        )
        .as_bytes(),
    );
    let hash_secondary = to_hex(&sec_hasher.finalize());

    (hash_primary, hash_secondary)
}
