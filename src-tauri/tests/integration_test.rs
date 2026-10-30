use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

use mama_receipts_lib::exporter::{export_excel, export_fs_csv, export_plu_csv};
use mama_receipts_lib::parser::{
    parse_all_fs_receipts, parse_plu_x_reports, read_and_split_receipts, receipts_to_rows,
};

fn get_source_file_path() -> PathBuf {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    manifest_dir.parent().unwrap().join("POC").join("HEK0105410_ET_131224_0624_a.txt")
}

#[test]
fn test_splitter_block_count() {
    let source_path = get_source_file_path();
    assert!(source_path.exists(), "Source file must exist at {:?}", source_path);

    let blocks = read_and_split_receipts(&source_path).expect("Failed to read and split receipts");
    assert_eq!(
        blocks.len(),
        1150,
        "Expected exactly 1,150 receipt blocks in reference dump"
    );
}

#[test]
fn test_fs_receipts_count_and_sequential_integrity() {
    let source_path = get_source_file_path();
    let blocks = read_and_split_receipts(&source_path).expect("Failed to read and split receipts");

    let parsed_receipts = parse_all_fs_receipts(&blocks);

    // 1. Exactly 426 FS receipts parsed (404 valid + 22 voids)
    assert_eq!(
        parsed_receipts.len(),
        426,
        "Expected exactly 426 FS receipts parsed"
    );

    let valid_count = parsed_receipts.iter().filter(|r| !r.is_void).count();
    let void_count = parsed_receipts.iter().filter(|r| r.is_void).count();

    assert_eq!(valid_count, 404, "Expected exactly 404 valid sales receipts");
    assert_eq!(void_count, 22, "Expected exactly 22 voided receipts");

    // 2. Zero missing FS numbers between 1 and 426
    let mut fs_numbers = HashSet::new();
    for r in &parsed_receipts {
        let num: u32 = r.fs_no.parse().unwrap_or_else(|_| {
            panic!("FS number '{}' could not be parsed as integer", r.fs_no)
        });
        fs_numbers.insert(num);
    }

    for expected in 1..=426 {
        assert!(
            fs_numbers.contains(&expected),
            "Missing FS No. {}! Sequential integrity failed.",
            expected
        );
    }
    assert_eq!(
        fs_numbers.len(),
        426,
        "FS number set should contain exactly 426 unique numbers"
    );
}

#[test]
fn test_plu_x_reports_parsing() {
    let source_path = get_source_file_path();
    let raw_text = fs::read_to_string(&source_path).expect("Failed to read source file");

    let plu_items = parse_plu_x_reports(&raw_text);

    // Assert exactly 112 items
    assert_eq!(
        plu_items.len(),
        112,
        "Expected exactly 112 PLU items parsed from X-report"
    );

    // Check first item details
    let first = &plu_items[0];
    assert_eq!(first.no, 101);
    assert_eq!(first.item, "Electirc wire ilslc");
    assert_eq!(first.price, 90.00);
    assert_eq!(first.qty, 65.860);
    assert_eq!(first.amount, 1239.28);
}

#[test]
fn test_exact_match_with_poc_json() {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    let poc_json_path = manifest_dir.parent().unwrap().join("POC").join("parsed_receipts.json");
    let poc_content = fs::read_to_string(&poc_json_path).expect("Failed to read parsed_receipts.json");
    let poc_receipts: serde_json::Value = serde_json::from_str(&poc_content).unwrap();

    let source_path = get_source_file_path();
    let blocks = read_and_split_receipts(&source_path).unwrap();
    let rust_receipts = parse_all_fs_receipts(&blocks);

    let poc_arr = poc_receipts.as_array().unwrap();
    assert_eq!(poc_arr.len(), rust_receipts.len());

    for (poc_val, rust_r) in poc_arr.iter().zip(rust_receipts.iter()) {
        assert_eq!(poc_val["fs_no"].as_str().unwrap(), rust_r.fs_no);
        assert_eq!(poc_val["date"].as_str().unwrap(), rust_r.date);
        assert_eq!(poc_val["mrc"].as_str().unwrap(), rust_r.mrc);
        assert_eq!(poc_val["is_void"].as_bool().unwrap(), rust_r.is_void);

        let poc_items = poc_val["items"].as_array().unwrap();
        assert_eq!(poc_items.len(), rust_r.items.len());
        for (poc_it, rust_it) in poc_items.iter().zip(rust_r.items.iter()) {
            assert_eq!(poc_it["name"].as_str().unwrap(), rust_it.name);
            assert_eq!(poc_it["quantity"].as_f64().unwrap(), rust_it.quantity);
            assert_eq!(poc_it["unit_price"].as_f64().unwrap(), rust_it.unit_price);
            assert_eq!(poc_it["total_price"].as_f64().unwrap(), rust_it.total_price);
        }
    }
}

#[test]
fn test_full_pipeline_and_export() {
    let source_path = get_source_file_path();
    let blocks = read_and_split_receipts(&source_path).expect("Failed to read and split receipts");
    let parsed_receipts = parse_all_fs_receipts(&blocks);
    let fs_rows = receipts_to_rows(&parsed_receipts);

    let raw_text = fs::read_to_string(&source_path).expect("Failed to read source file");
    let plu_items = parse_plu_x_reports(&raw_text);

    // Ground truth: 461 item rows
    assert_eq!(fs_rows.len(), 461, "Expected exactly 461 rows for FS sales matching POC ground truth");

    // Output directory for test
    let out_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("target").join("test_output");
    fs::create_dir_all(&out_dir).expect("Failed to create test output dir");

    let excel_path = out_dir.join("mama_receipts_output.xlsx");
    let csv_fs_path = out_dir.join("mama_receipts_output.csv");
    let csv_plu_path = out_dir.join("mama_x_reports_output.csv");

    // Export Excel
    export_excel(&excel_path, &fs_rows, &plu_items).expect("Excel export should succeed");
    assert!(excel_path.exists());
    let excel_len = fs::metadata(&excel_path).unwrap().len();
    assert!(excel_len > 10_000, "Excel output size should be non-trivial (got {} bytes)", excel_len);

    // Export CSVs
    export_fs_csv(&csv_fs_path, &fs_rows).expect("FS CSV export should succeed");
    assert!(csv_fs_path.exists());
    let csv_fs_len = fs::metadata(&csv_fs_path).unwrap().len();
    assert!(csv_fs_len > 10_000, "FS CSV output size should be non-trivial (got {} bytes)", csv_fs_len);

    export_plu_csv(&csv_plu_path, &plu_items).expect("PLU CSV export should succeed");
    assert!(csv_plu_path.exists());
    let csv_plu_len = fs::metadata(&csv_plu_path).unwrap().len();
    assert!(csv_plu_len > 1_000, "PLU CSV output size should be non-trivial (got {} bytes)", csv_plu_len);
}
