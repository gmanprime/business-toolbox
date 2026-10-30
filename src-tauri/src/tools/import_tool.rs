use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

use crate::db::repository::{Database, InsertResult};
use crate::parser::fs_parser::{classify_receipt, parse_fs_receipt};
use crate::parser::models::ReceiptCategory;
use crate::parser::plu_parser::parse_plu_x_reports;
use crate::parser::splitter::split_raw_dump;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BatchImportResult {
    pub files_processed: usize,
    pub total_blocks: usize,
    pub fs_receipts_inserted: usize,
    pub fs_receipts_duplicates_skipped: usize,
    pub z_reports_inserted: usize,
    pub z_reports_duplicates_skipped: usize,
    pub other_blocks_inserted: usize,
    pub other_blocks_duplicates_skipped: usize,
    pub plu_items_inserted: usize,
    pub plu_items_duplicates_skipped: usize,
    pub errors: Vec<String>,
}

/// Tool for importing raw fiscal dump files into the persistent database.
/// 
/// Handles multiple receipts of all types (FS Sales, Z-Reports, X-Reports / PLU),
/// computing dual 256-bit cryptographic hashes (512-bit collision resistance)
/// to strictly prevent duplication while ensuring no genuine records are excluded.
pub fn import_receipt_files(
    db: &mut Database,
    file_paths: &[String],
) -> BatchImportResult {
    let mut result = BatchImportResult::default();

    for path_str in file_paths {
        let p = Path::new(path_str);
        if !p.exists() {
            result.errors.push(format!("File does not exist: {}", path_str));
            continue;
        }

        let raw_text = match fs::read_to_string(p) {
            Ok(content) => content,
            Err(e) => {
                result.errors.push(format!("Failed to read {}: {}", path_str, e));
                continue;
            }
        };

        // 1. Ingest PLU Inventory (X-Reports)
        let plu_items = parse_plu_x_reports(&raw_text);
        if !plu_items.is_empty() {
            match db.insert_plu_items(&plu_items) {
                Ok((ins, skp)) => {
                    result.plu_items_inserted += ins;
                    result.plu_items_duplicates_skipped += skp;
                }
                Err(e) => {
                    result.errors.push(format!("Failed to store PLU items from {}: {}", path_str, e));
                }
            }
        }

        // 2. Ingest Receipt Blocks (FS, Z, Other)
        let blocks = split_raw_dump(&raw_text);
        result.total_blocks += blocks.len();

        for block in &blocks {
            let category = classify_receipt(block);
            match category {
                ReceiptCategory::Fs => {
                    if let Some(fs_receipt) = parse_fs_receipt(block) {
                        match db.insert_fs_receipt(&fs_receipt, block) {
                            Ok(InsertResult::Inserted(_)) => {
                                result.fs_receipts_inserted += 1;
                            }
                            Ok(InsertResult::DuplicateSkipped) => {
                                result.fs_receipts_duplicates_skipped += 1;
                            }
                            Err(e) => {
                                result.errors.push(format!("Error inserting FS receipt: {}", e));
                            }
                        }
                    }
                }
                ReceiptCategory::Z => {
                    let mrc = "HEK0105410";
                    let date = "";
                    let time = "";
                    match db.insert_raw_block("z", mrc, date, time, block) {
                        Ok(InsertResult::Inserted(_)) => {
                            result.z_reports_inserted += 1;
                        }
                        Ok(InsertResult::DuplicateSkipped) => {
                            result.z_reports_duplicates_skipped += 1;
                        }
                        Err(e) => {
                            result.errors.push(format!("Error inserting Z report: {}", e));
                        }
                    }
                }
                ReceiptCategory::Other => {
                    let mrc = "HEK0105410";
                    match db.insert_raw_block("other", mrc, "", "", block) {
                        Ok(InsertResult::Inserted(_)) => {
                            result.other_blocks_inserted += 1;
                        }
                        Ok(InsertResult::DuplicateSkipped) => {
                            result.other_blocks_duplicates_skipped += 1;
                        }
                        Err(e) => {
                            result.errors.push(format!("Error inserting other block: {}", e));
                        }
                    }
                }
            }
        }

        result.files_processed += 1;
    }

    result
}
