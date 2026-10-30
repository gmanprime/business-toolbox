use regex::Regex;
use std::fs::File;
use std::io::{self, BufRead, BufReader};
use std::path::Path;
use std::sync::LazyLock;

use super::fs_parser::{parse_money, round_2, round_3};
use super::models::PluItem;

static RE_DATE_TIME: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(\d{2}/\d{2}/\d{4})\s+(\d{2}:\d{2})").unwrap());
static RE_NAME_PRICE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^(.*?)\s+([\d,.]+)\s+(\d+)$").unwrap());
static RE_QTY: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^QTY:\s*([\d,.]+)$").unwrap());
static RE_AMT: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^AMOUNT:\s*\*?([\d,.]+)$").unwrap());

/// Parses PLU inventory items from X-Reports in the raw text dump.
pub fn parse_plu_x_reports(raw_text: &str) -> Vec<PluItem> {
    let raw_lines: Vec<&str> = raw_text.lines().collect();
    let mut start_idx = None;
    let mut date_val = "19/03/2024".to_string();

    for (idx, &raw) in raw_lines.iter().enumerate() {
        if raw.contains("PLU REPORT X") {
            start_idx = Some(idx);
            let back_start = idx.saturating_sub(8);
            for &back_line in &raw_lines[back_start..idx] {
                if let Some(m_dt) = RE_DATE_TIME.captures(back_line) {
                    date_val = m_dt[1].to_string();
                    break;
                }
            }
            break;
        }
    }

    let start_idx = match start_idx {
        Some(idx) => idx,
        None => return Vec::new(),
    };

    let mut items = Vec::new();
    let mut i = start_idx;

    while i < raw_lines.len() {
        let line = raw_lines[i]
            .split('\t')
            .last()
            .unwrap_or(raw_lines[i])
            .trim();

        if line.contains("HEK0105410") || (line.starts_with("TIN:") && i > start_idx + 5) {
            break;
        }

        if line.starts_with("NUMBER:") {
            let num_str = line.split(':').last().unwrap_or("").trim();
            let num_val = num_str.parse::<u32>().unwrap_or(0);

            i += 1;
            if i >= raw_lines.len() {
                break;
            }
            let name_price_line = raw_lines[i]
                .split('\t')
                .last()
                .unwrap_or(raw_lines[i])
                .trim();
            let (item_name, price) = if let Some(m_np) = RE_NAME_PRICE.captures(name_price_line) {
                (m_np[1].trim().to_string(), parse_money(&m_np[2]))
            } else {
                (name_price_line.to_string(), 0.0)
            };

            i += 1;
            if i >= raw_lines.len() {
                break;
            }
            let qty_line = raw_lines[i]
                .split('\t')
                .last()
                .unwrap_or(raw_lines[i])
                .trim();
            let qty = if let Some(m_qty) = RE_QTY.captures(qty_line) {
                parse_money(&m_qty[1])
            } else {
                0.0
            };

            i += 1;
            if i >= raw_lines.len() {
                break;
            }
            let amt_line = raw_lines[i]
                .split('\t')
                .last()
                .unwrap_or(raw_lines[i])
                .trim();
            let amt = if let Some(m_amt) = RE_AMT.captures(amt_line) {
                parse_money(&m_amt[1])
            } else {
                0.0
            };

            items.push(PluItem {
                no: num_val,
                date: date_val.clone(),
                item: item_name,
                price: round_2(price),
                qty: round_3(qty),
                amount: round_2(amt),
            });
        }
        i += 1;
    }

    items
}

/// Helper to read and parse PLU report directly from file.
pub fn parse_plu_x_reports_from_file<P: AsRef<Path>>(filepath: P) -> io::Result<Vec<PluItem>> {
    let file = File::open(filepath)?;
    let reader = BufReader::new(file);
    let mut raw_lines = Vec::new();
    for line in reader.lines() {
        raw_lines.push(line?);
    }
    let text = raw_lines.join("\n");
    Ok(parse_plu_x_reports(&text))
}
