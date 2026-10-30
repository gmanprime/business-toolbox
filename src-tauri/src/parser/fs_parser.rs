use regex::Regex;
use std::sync::LazyLock;

use super::models::{FsReceipt, FsRow, ReceiptCategory, ReceiptItem};

// Static regex patterns initialized once
static RE_FS_NO: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"FS No\.(\d+)").unwrap());
static RE_DATE_TIME: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(\d{2}/\d{2}/\d{4})\s+(\d{2}:\d{2})").unwrap());
static RE_TXBL1: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"TXBL1\s+\*?([\d,]+\.\d{2})").unwrap());
static RE_TAX1: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"TAX1\s+15%\s+\*?([\d,]+\.\d{2})").unwrap());
static RE_TOTAL: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"TOTAL:\s+\*?([\d,]+\.\d{2})").unwrap());
static RE_MRC: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(HEK\d+)").unwrap());
static RE_MULTIPLIER: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^\s*([\d,.]+)\s*x\s*([\d,.]+)\s*=\s*$").unwrap());
static RE_ITEM_LINE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^(.+?)\s+\*?([\d,]+\.\d{2})\s*$").unwrap());
static RE_VOID: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\*{3}\s*VOID\s*\*{3}").unwrap());
static RE_SUBTOTAL: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^SUBTOTAL:").unwrap());
static RE_SEPARATOR: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^\s*-\s+-\s+-\s+-\s*$").unwrap());
static RE_BUYERS_TIN: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"Buyer's TIN:").unwrap());
static RE_ITEM_COUNT: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"ITEM#\s+(\d+)").unwrap());
static RE_Z_REPORT: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\bZ:\d+").unwrap());

/// Parse money string like "2,608.65" or "*1,239.28" to f64.
pub fn parse_money(s: &str) -> f64 {
    let cleaned = s.replace(',', "").replace('*', "");
    cleaned.trim().parse::<f64>().unwrap_or(0.0)
}

/// Round float to 2 decimal places.
pub fn round_2(val: f64) -> f64 {
    (val * 100.0).round() / 100.0
}

/// Round float to 3 decimal places.
pub fn round_3(val: f64) -> f64 {
    (val * 1000.0).round() / 1000.0
}

/// Classify receipt block as FS sales receipt, Z-report, or Other.
pub fn classify_receipt(lines: &[String]) -> ReceiptCategory {
    let text = lines.join("\n");
    if RE_FS_NO.is_match(&text) {
        ReceiptCategory::Fs
    } else if text.contains("SESSION Z REPORT") || RE_Z_REPORT.is_match(&text) {
        ReceiptCategory::Z
    } else {
        ReceiptCategory::Other
    }
}

/// Parse item lines from receipt body.
pub fn parse_items_from_body(body_lines: &[String]) -> Vec<ReceiptItem> {
    let mut items = Vec::new();
    let mut i = 0;

    while i < body_lines.len() {
        let line = &body_lines[i];

        // Skip non-item control lines
        if RE_SEPARATOR.is_match(line)
            || RE_SUBTOTAL.is_match(line)
            || line.starts_with("TXBL")
            || line.starts_with("TAX")
            || line.starts_with("TOTAL:")
            || line.starts_with("CASH")
            || line.starts_with("CHANGE:")
            || line.starts_with("ITEM#")
            || line.contains("E R C A")
            || line.contains("HEK0105410")
            || RE_BUYERS_TIN.is_match(line)
            || line.starts_with("NOTXBL")
            || line.trim().is_empty()
        {
            i += 1;
            continue;
        }

        // Check for VOID triplet: current item, next line VOID, next-next line is negative -> skip all 3
        if i + 2 < body_lines.len() && RE_VOID.is_match(&body_lines[i + 1]) {
            i += 3;
            continue;
        }

        // Check for multiplier line: "unit_price x quantity ="
        if let Some(mult_caps) = RE_MULTIPLIER.captures(line) {
            let unit_price = parse_money(&mult_caps[1]);
            let quantity = parse_money(&mult_caps[2]);
            i += 1;
            if i < body_lines.len() {
                if let Some(item_caps) = RE_ITEM_LINE.captures(&body_lines[i]) {
                    let name = item_caps[1].trim().to_string();
                    let total_price = parse_money(&item_caps[2]);
                    items.push(ReceiptItem {
                        name,
                        quantity,
                        unit_price,
                        total_price,
                    });
                }
            }
            i += 1;
            continue;
        }

        // Plain item line (default quantity = 1.0)
        if let Some(item_caps) = RE_ITEM_LINE.captures(line) {
            let name = item_caps[1].trim().to_string();
            let total_price = parse_money(&item_caps[2]);
            items.push(ReceiptItem {
                name,
                quantity: 1.0,
                unit_price: total_price,
                total_price,
            });
            i += 1;
            continue;
        }

        // Unrecognized line - skip
        i += 1;
    }

    items
}

/// Parse a single FS receipt block.
pub fn parse_fs_receipt(lines: &[String]) -> Option<FsReceipt> {
    let text = lines.join("\n");

    let fs_no = RE_FS_NO.captures(&text)?.get(1)?.as_str().to_string();

    let (date, time) = if let Some(caps) = RE_DATE_TIME.captures(&text) {
        (caps[1].to_string(), caps[2].to_string())
    } else {
        ("".to_string(), "".to_string())
    };

    let mrc = if let Some(caps) = RE_MRC.captures(&text) {
        caps[1].to_string()
    } else {
        "HEK0105410".to_string()
    };

    let txbl1 = if let Some(caps) = RE_TXBL1.captures(&text) {
        parse_money(&caps[1])
    } else {
        0.0
    };

    let tax1 = if let Some(caps) = RE_TAX1.captures(&text) {
        parse_money(&caps[1])
    } else {
        0.0
    };

    let total = if let Some(caps) = RE_TOTAL.captures(&text) {
        parse_money(&caps[1])
    } else {
        0.0
    };

    let item_count = if let Some(caps) = RE_ITEM_COUNT.captures(&text) {
        caps[1].parse::<usize>().unwrap_or(0)
    } else {
        0
    };

    // Body starts right after date/time line
    let mut body_start = None;
    for (idx, ln) in lines.iter().enumerate() {
        if RE_DATE_TIME.is_match(ln) {
            body_start = Some(idx + 1);
            break;
        }
    }

    let body_start = body_start?;

    // Handle voided receipts
    let is_void_receipt = item_count == 0 || (RE_VOID.is_match(&text) && total == 0.0);

    if is_void_receipt {
        let mut void_item_name = "*** VOID ***".to_string();
        for ln in &lines[body_start..] {
            if RE_VOID.is_match(ln)
                || RE_SEPARATOR.is_match(ln)
                || RE_SUBTOTAL.is_match(ln)
                || RE_BUYERS_TIN.is_match(ln)
                || ln.starts_with("TOTAL")
                || ln.starts_with("CASH")
            {
                continue;
            }
            if let Some(item_caps) = RE_ITEM_LINE.captures(ln) {
                let price_str = &item_caps[2];
                if !price_str.starts_with('-') {
                    void_item_name = format!("{} (VOID)", item_caps[1].trim());
                    break;
                }
            }
        }

        return Some(FsReceipt {
            fs_no,
            date,
            time,
            mrc,
            txbl1: 0.0,
            tax1: 0.0,
            total: 0.0,
            item_count: 0,
            is_void: true,
            items: vec![ReceiptItem {
                name: void_item_name,
                quantity: 0.0,
                unit_price: 0.0,
                total_price: 0.0,
            }],
        });
    }

    let body_lines = &lines[body_start..];
    let items = parse_items_from_body(body_lines);
    if items.is_empty() {
        return None;
    }

    Some(FsReceipt {
        fs_no,
        date,
        time,
        mrc,
        txbl1,
        tax1,
        total,
        item_count,
        is_void: false,
        items,
    })
}

/// Filter and parse all FS receipts from receipt blocks.
pub fn parse_all_fs_receipts(blocks: &[Vec<String>]) -> Vec<FsReceipt> {
    let mut receipts = Vec::new();
    for block in blocks {
        if classify_receipt(block) == ReceiptCategory::Fs {
            if let Some(receipt) = parse_fs_receipt(block) {
                receipts.push(receipt);
            }
        }
    }
    receipts
}

/// Map parsed FS receipts to the target 14-column rows.
pub fn receipts_to_rows(receipts: &[FsReceipt]) -> Vec<FsRow> {
    let mut rows = Vec::new();
    let mut serial = 1;

    for receipt in receipts {
        let fs_no = &receipt.fs_no;
        let date = &receipt.date;
        let mrc = &receipt.mrc;
        let receipt_txbl = receipt.txbl1;
        let receipt_tax = receipt.tax1;

        for item in &receipt.items {
            let item_vat = if receipt_txbl > 0.0 {
                receipt_tax * (item.total_price / receipt_txbl)
            } else {
                0.0
            };

            let item_total_incl_tax = item.total_price + item_vat;

            rows.push(FsRow {
                serial,
                item_name: item.name.clone(),
                country_of_origin: "".to_string(),
                brand_name: "".to_string(),
                unit_of_measure: "".to_string(),
                quantity: item.quantity,
                avg_purchase_price: "".to_string(),
                unit_price_before_vat: round_2(item.unit_price),
                total_price_before_vat: round_2(item.total_price),
                vat: round_2(item_vat),
                total_price_incl_tax: round_2(item_total_incl_tax),
                fs_no: fs_no.clone(),
                date: date.clone(),
                mrc: mrc.clone(),
            });
            serial += 1;
        }
    }

    rows
}
