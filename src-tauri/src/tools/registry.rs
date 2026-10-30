use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolDescriptor {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub version: String,
}

/// Returns the registry of tools available within the Fiscal Register Toolbox.
pub fn get_available_tools() -> Vec<ToolDescriptor> {
    vec![
        ToolDescriptor {
            id: "batch_receipt_parser".to_string(),
            name: "Fiscal Batch Log Parser".to_string(),
            description: "Ingest and parse raw fiscal cash register dumps containing multiple receipts of all types (FS Sales, Z-Reports, X-Reports / PLU). Automatically deduplicates using 512-bit dual cryptographic hashing.".to_string(),
            category: "Ingestion & Parsing".to_string(),
            version: "1.0.0".to_string(),
        },
        ToolDescriptor {
            id: "receipt_database_query".to_string(),
            name: "Receipt Database & Explorer".to_string(),
            description: "Search, filter, and inspect stored receipts across date ranges, FS sequential numbers, machine codes (MRC), and item names.".to_string(),
            category: "Data Management".to_string(),
            version: "1.0.0".to_string(),
        },
        ToolDescriptor {
            id: "fiscal_exporter".to_string(),
            name: "Fiscal Report Exporter".to_string(),
            description: "Export stored or filtered receipts into styled multi-sheet Excel (.xlsx) workbooks and UTF-8 CSV files with full Ethiopian ERCA 14-column compliance.".to_string(),
            category: "Reporting & Export".to_string(),
            version: "1.0.0".to_string(),
        },
    ]
}
