use std::path::Path;
use serde::{Deserialize, Serialize};

use crate::db::repository::{Database, PluFilter, ReceiptFilter};
use crate::exporter::csv::{export_fs_csv, export_plu_csv};
use crate::exporter::excel::export_excel;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportResult {
    pub fs_rows_exported: usize,
    pub plu_items_exported: usize,
    pub excel_file: Option<String>,
    pub fs_csv_file: Option<String>,
    pub plu_csv_file: Option<String>,
}

/// Exports receipts and inventory items from the database to styled Excel and CSV files.
/// 
/// Accepts optional filters (`ReceiptFilter`, `PluFilter`) so users can export:
/// - The entire database in whole
/// - Filtered date ranges
/// - Specific FS number intervals
/// - Specific machine codes (MRC) or non-void subsets
pub fn export_stored_data(
    db: &Database,
    output_dir: &Path,
    receipt_filter: Option<&ReceiptFilter>,
    plu_filter: Option<&PluFilter>,
    export_excel_format: bool,
    export_csv_format: bool,
) -> Result<ExportResult, String> {
    std::fs::create_dir_all(output_dir)
        .map_err(|e| format!("Failed to create export directory: {}", e))?;

    let default_receipt_filter = ReceiptFilter::default();
    let r_filter = receipt_filter.unwrap_or(&default_receipt_filter);

    let default_plu_filter = PluFilter::default();
    let p_filter = plu_filter.unwrap_or(&default_plu_filter);

    // Fetch matching data from database
    let fs_rows = db
        .query_fs_export_rows(r_filter)
        .map_err(|e| format!("Database query error for FS rows: {}", e))?;

    let plu_items = db
        .query_plu_items(p_filter)
        .map_err(|e| format!("Database query error for PLU items: {}", e))?;

    let mut result = ExportResult {
        fs_rows_exported: fs_rows.len(),
        plu_items_exported: plu_items.len(),
        excel_file: None,
        fs_csv_file: None,
        plu_csv_file: None,
    };

    if export_excel_format {
        let excel_path = output_dir.join("mama_receipts_output.xlsx");
        export_excel(&excel_path, &fs_rows, &plu_items)
            .map_err(|e| format!("Excel export error: {}", e))?;
        result.excel_file = Some(excel_path.to_string_lossy().to_string());
    }

    if export_csv_format {
        let fs_csv_path = output_dir.join("mama_receipts_output.csv");
        export_fs_csv(&fs_csv_path, &fs_rows)
            .map_err(|e| format!("FS CSV export error: {}", e))?;
        result.fs_csv_file = Some(fs_csv_path.to_string_lossy().to_string());

        let plu_csv_path = output_dir.join("mama_x_reports_output.csv");
        export_plu_csv(&plu_csv_path, &plu_items)
            .map_err(|e| format!("PLU CSV export error: {}", e))?;
        result.plu_csv_file = Some(plu_csv_path.to_string_lossy().to_string());
    }

    Ok(result)
}
