use std::path::Path;
use tauri::{AppHandle, Manager};

use crate::db::repository::{Database, DatabaseStats, PluFilter, ReceiptFilter, StoredReceipt};
use crate::parser::models::PluItem;
use crate::tools::export_tool::{export_stored_data, ExportResult};
use crate::tools::import_tool::{import_receipt_files, BatchImportResult};
use crate::tools::registry::{get_available_tools, ToolDescriptor};

/// Resolves the production-grade database path across Windows and Android.
/// 
/// In production, uses OS application data storage (`%APPDATA%/com.fiscal.registertool/fiscal_register.db` on Windows,
/// internal sandbox storage on Android). Falls back to `./fiscal_register.db` if unmanaged.
pub fn resolve_database_path(
    app: Option<&AppHandle>,
    explicit_path: Option<String>,
) -> Result<String, String> {
    if let Some(path) = explicit_path {
        return Ok(path);
    }

    if let Some(app_handle) = app {
        if let Ok(app_dir) = app_handle.path().app_data_dir() {
            if let Err(e) = std::fs::create_dir_all(&app_dir) {
                eprintln!("Warning: Failed to create app_data_dir: {}", e);
            } else {
                let db_path = app_dir.join("fiscal_register.db");
                return Ok(db_path.to_string_lossy().to_string());
            }
        }
    }

    Ok("fiscal_register.db".to_string())
}

/// Tool 0: List all available tools in the Fiscal Register Toolbox.
#[tauri::command]
pub fn list_tools() -> Vec<ToolDescriptor> {
    get_available_tools()
}

/// Tool 1: Batch import multiple receipt files into the internal database with double-hash deduplication.
#[tauri::command]
pub fn parse_and_store_receipts(
    app: AppHandle,
    file_paths: Vec<String>,
    db_path: Option<String>,
) -> Result<BatchImportResult, String> {
    let resolved = resolve_database_path(Some(&app), db_path)?;
    let mut db = Database::open(&resolved)
        .map_err(|e| format!("Failed to open database at {}: {}", resolved, e))?;
    let result = import_receipt_files(&mut db, &file_paths);
    Ok(result)
}

/// Tool 2: Query stored receipts with flexible criteria (date range, FS range, MRC, void status, search).
#[tauri::command]
pub fn query_stored_receipts(
    app: AppHandle,
    filter: ReceiptFilter,
    db_path: Option<String>,
) -> Result<Vec<StoredReceipt>, String> {
    let resolved = resolve_database_path(Some(&app), db_path)?;
    let db = Database::open(&resolved)
        .map_err(|e| format!("Failed to open database at {}: {}", resolved, e))?;
    db.query_receipts(&filter)
        .map_err(|e| format!("Query error: {}", e))
}

/// Tool 2b: Query stored PLU inventory items.
#[tauri::command]
pub fn query_stored_plu_items(
    app: AppHandle,
    filter: PluFilter,
    db_path: Option<String>,
) -> Result<Vec<PluItem>, String> {
    let resolved = resolve_database_path(Some(&app), db_path)?;
    let db = Database::open(&resolved)
        .map_err(|e| format!("Failed to open database at {}: {}", resolved, e))?;
    db.query_plu_items(&filter)
        .map_err(|e| format!("PLU query error: {}", e))
}

/// Tool 2c: Retrieve database statistics and counts.
#[tauri::command]
pub fn get_database_stats(
    app: AppHandle,
    db_path: Option<String>,
) -> Result<DatabaseStats, String> {
    let resolved = resolve_database_path(Some(&app), db_path)?;
    let db = Database::open(&resolved)
        .map_err(|e| format!("Failed to open database at {}: {}", resolved, e))?;
    db.get_stats()
        .map_err(|e| format!("Database stats error: {}", e))
}

/// Tool 3: Export stored receipts (all or filtered) to multi-sheet Excel and CSV.
#[tauri::command]
pub fn export_stored_receipts(
    app: AppHandle,
    output_dir: String,
    receipt_filter: Option<ReceiptFilter>,
    plu_filter: Option<PluFilter>,
    export_excel_format: Option<bool>,
    export_csv_format: Option<bool>,
    db_path: Option<String>,
) -> Result<ExportResult, String> {
    let resolved = resolve_database_path(Some(&app), db_path)?;
    let db = Database::open(&resolved)
        .map_err(|e| format!("Failed to open database at {}: {}", resolved, e))?;
    let out_path = Path::new(&output_dir);
    export_stored_data(
        &db,
        out_path,
        receipt_filter.as_ref(),
        plu_filter.as_ref(),
        export_excel_format.unwrap_or(true),
        export_csv_format.unwrap_or(true),
    )
}
