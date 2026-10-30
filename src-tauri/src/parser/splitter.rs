use std::fs::File;
use std::io::{self, BufRead, BufReader};
use std::path::Path;

/// Splits raw fiscal cash register dump into individual receipt line blocks.
/// 
/// Each line in the raw dump typically has format: `00000435\tN\t<content>`.
/// We split boundaries starting with store header `TIN:` (ignoring `Buyer's TIN:`)
/// and ending when `HEK0105410` is encountered.
pub fn split_raw_dump(raw_text: &str) -> Vec<Vec<String>> {
    let mut receipts = Vec::new();
    let mut current = Vec::new();
    let mut in_receipt = false;

    for raw in raw_text.lines() {
        let parts: Vec<&str> = raw.split('\t').collect();
        let content = if parts.len() >= 3 {
            parts[2].trim()
        } else {
            raw.trim()
        };

        // ONLY start on store TIN header, NOT on "Buyer's TIN:"
        if content.starts_with("TIN:") {
            in_receipt = true;
            current = Vec::new();
        }

        if in_receipt {
            current.push(content.to_string());
            if content.contains("HEK0105410") {
                receipts.push(current);
                in_receipt = false;
                current = Vec::new();
            }
        }
    }

    receipts
}

/// Helper to read and split directly from a file path.
pub fn read_and_split_receipts<P: AsRef<Path>>(filepath: P) -> io::Result<Vec<Vec<String>>> {
    let file = File::open(filepath)?;
    let reader = BufReader::new(file);

    let mut receipts = Vec::new();
    let mut current = Vec::new();
    let mut in_receipt = false;

    for line_res in reader.lines() {
        let raw = line_res?;
        let parts: Vec<&str> = raw.split('\t').collect();
        let content = if parts.len() >= 3 {
            parts[2].trim()
        } else {
            raw.trim()
        };

        if content.starts_with("TIN:") {
            in_receipt = true;
            current = Vec::new();
        }

        if in_receipt {
            current.push(content.to_string());
            if content.contains("HEK0105410") {
                receipts.push(current);
                in_receipt = false;
                current = Vec::new();
            }
        }
    }

    Ok(receipts)
}
