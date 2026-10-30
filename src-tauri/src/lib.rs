pub mod commands;
pub mod db;
pub mod exporter;
pub mod parser;
pub mod tools;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::list_tools,
            commands::parse_and_store_receipts,
            commands::query_stored_receipts,
            commands::query_stored_plu_items,
            commands::get_database_stats,
            commands::export_stored_receipts
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
