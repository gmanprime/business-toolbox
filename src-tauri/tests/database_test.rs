use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

use fiscal_register_lib::db::repository::{Database, ReceiptFilter};
use fiscal_register_lib::tools::export_tool::export_stored_data;
use fiscal_register_lib::tools::import_tool::import_receipt_files;
use fiscal_register_lib::tools::registry::get_available_tools;

fn get_source_file_path() -> PathBuf {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    manifest_dir.parent().unwrap().join("POC").join("HEK0105410_ET_131224_0624_a.txt")
}

#[test]
fn test_toolbox_registry() {
    let tools = get_available_tools();
    assert_eq!(tools.len(), 3, "Expected 3 registered toolbox tools");
    assert!(tools.iter().any(|t| t.id == "batch_receipt_parser"));
    assert!(tools.iter().any(|t| t.id == "receipt_database_query"));
    assert!(tools.iter().any(|t| t.id == "fiscal_exporter"));
}

#[test]
fn test_database_import_and_double_hash_deduplication() {
    let source_path = get_source_file_path();
    assert!(source_path.exists());
    let path_str = source_path.to_string_lossy().to_string();

    let mut db = Database::open_in_memory().expect("In-memory SQLite DB should initialize");

    // ── First Import ──
    let import_1 = import_receipt_files(&mut db, &[path_str.clone()]);
    assert_eq!(import_1.files_processed, 1);
    assert_eq!(import_1.fs_receipts_inserted, 426, "Expected 426 FS receipts inserted on first pass");
    assert_eq!(import_1.fs_receipts_duplicates_skipped, 0, "Expected 0 duplicates on first pass");
    assert_eq!(import_1.plu_items_inserted, 112, "Expected 112 PLU items inserted on first pass");
    assert_eq!(import_1.plu_items_duplicates_skipped, 0, "Expected 0 PLU duplicates on first pass");
    assert!(import_1.errors.is_empty(), "First import should have zero errors: {:?}", import_1.errors);

    let stats_1 = db.get_stats().expect("Stats query should succeed");
    assert_eq!(stats_1.fs_sales_receipts, 426);
    assert_eq!(stats_1.void_receipts, 22);
    assert_eq!(stats_1.total_plu_items, 112);
    assert_eq!(stats_1.total_items, 457); // 457 items in total (435 real items + 22 void records; 4 BY CHEQUE filtered)

    // ── Second Import (Exact same file) ──
    let import_2 = import_receipt_files(&mut db, &[path_str]);
    assert_eq!(import_2.files_processed, 1);
    assert_eq!(
        import_2.fs_receipts_inserted, 0,
        "Zero new FS receipts should be inserted on duplicate import"
    );
    assert_eq!(
        import_2.fs_receipts_duplicates_skipped, 426,
        "All 426 FS receipts should be detected as duplicates and safely skipped"
    );
    assert_eq!(
        import_2.plu_items_inserted, 0,
        "Zero new PLU items should be inserted on duplicate import"
    );
    assert_eq!(
        import_2.plu_items_duplicates_skipped, 112,
        "All 112 PLU items should be detected as duplicates and safely skipped"
    );

    // Database counts must remain strictly identical
    let stats_2 = db.get_stats().expect("Stats query should succeed");
    assert_eq!(stats_2.fs_sales_receipts, 426);
    assert_eq!(stats_2.void_receipts, 22);
    assert_eq!(stats_2.total_plu_items, 112);
    assert_eq!(stats_2.total_items, 457);

    // ── Verify 100% Sequential Integrity ──
    let all_fs = db.query_receipts(&ReceiptFilter {
        category: Some("fs".to_string()),
        ..Default::default()
    }).expect("Query should succeed");

    assert_eq!(all_fs.len(), 426);
    let mut numbers = HashSet::new();
    for r in &all_fs {
        let num = r.fs_number.expect("Each FS receipt must have a numeric sequence index");
        numbers.insert(num);
    }
    for expected in 1..=426 {
        assert!(numbers.contains(&expected), "Missing FS #{} in database!", expected);
    }
}

#[test]
fn test_database_filtering_and_partial_export() {
    let source_path = get_source_file_path();
    let mut db = Database::open_in_memory().expect("In-memory SQLite DB should initialize");
    import_receipt_files(&mut db, &[source_path.to_string_lossy().to_string()]);

    // 1. Filter Voids only
    let void_filter = ReceiptFilter {
        is_void: Some(true),
        ..Default::default()
    };
    let voids = db.query_receipts(&void_filter).unwrap();
    assert_eq!(voids.len(), 22, "Expected exactly 22 voided receipts from filter");

    // 2. Filter Valid sales only
    let valid_filter = ReceiptFilter {
        is_void: Some(false),
        category: Some("fs".to_string()),
        ..Default::default()
    };
    let valids = db.query_receipts(&valid_filter).unwrap();
    assert_eq!(valids.len(), 404, "Expected exactly 404 valid sales receipts from filter");

    // 3. Filter by FS number range 1 to 50
    let range_filter = ReceiptFilter {
        fs_min: Some(1),
        fs_max: Some(50),
        category: Some("fs".to_string()),
        ..Default::default()
    };
    let range_receipts = db.query_receipts(&range_filter).unwrap();
    assert_eq!(range_receipts.len(), 50, "Expected 50 receipts in range 1..=50");

    // 4. Search by item name
    let search_filter = ReceiptFilter {
        search_term: Some("wire".to_string()),
        ..Default::default()
    };
    let search_results = db.query_receipts(&search_filter).unwrap();
    assert!(!search_results.is_empty(), "Should find receipts containing 'wire'");

    // 5. Re-export all stored data from database
    let out_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("target").join("db_export_test");
    fs::create_dir_all(&out_dir).unwrap();

    let full_export = export_stored_data(&db, &out_dir, None, None, true, true)
        .expect("Full export from DB should succeed");
    assert_eq!(full_export.fs_rows_exported, 457, "Should export 457 FS rows");
    assert_eq!(full_export.plu_items_exported, 112, "Should export 112 PLU items");

    // 6. Filtered export (e.g. only FS 1..=20)
    let filtered_out_dir = out_dir.join("filtered");
    let partial_filter = ReceiptFilter {
        fs_min: Some(1),
        fs_max: Some(20),
        category: Some("fs".to_string()),
        ..Default::default()
    };
    let filtered_export = export_stored_data(
        &db,
        &filtered_out_dir,
        Some(&partial_filter),
        None,
        true,
        true,
    ).expect("Filtered export from DB should succeed");

    assert!(filtered_export.fs_rows_exported >= 20);
    assert!(filtered_out_dir.join("fiscal_sales_output.xlsx").exists());
    assert!(filtered_out_dir.join("fiscal_sales_output.csv").exists());
}
