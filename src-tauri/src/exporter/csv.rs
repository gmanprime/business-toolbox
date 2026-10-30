use std::fs::File;
use std::io::{self, Write};
use std::path::Path;

use super::excel::{FS_COLUMNS, PLU_COLUMNS};
use crate::parser::models::{FsRow, PluItem};

const UTF8_BOM: &[u8] = b"\xEF\xBB\xBF";

/// Export FS sales rows to CSV with UTF-8 BOM encoding.
pub fn export_fs_csv<P: AsRef<Path>>(path: P, fs_rows: &[FsRow]) -> io::Result<()> {
    let mut file = File::create(path)?;
    // Write UTF-8 BOM for seamless Excel compatibility with Amharic text
    file.write_all(UTF8_BOM)?;

    let mut wtr = csv::WriterBuilder::new().from_writer(file);

    // Header
    wtr.write_record(&FS_COLUMNS)?;

    // Records
    for row in fs_rows {
        wtr.write_record(&[
            row.serial.to_string(),
            row.item_name.clone(),
            row.country_of_origin.clone(),
            row.brand_name.clone(),
            row.unit_of_measure.clone(),
            row.quantity.to_string(),
            row.avg_purchase_price.clone(),
            format!("{:.2}", row.unit_price_before_vat),
            format!("{:.2}", row.total_price_before_vat),
            format!("{:.2}", row.vat),
            format!("{:.2}", row.total_price_incl_tax),
            row.fs_no.clone(),
            row.date.clone(),
            row.mrc.clone(),
        ])?;
    }

    wtr.flush()?;
    Ok(())
}

/// Export PLU inventory items to CSV with UTF-8 BOM encoding.
pub fn export_plu_csv<P: AsRef<Path>>(path: P, plu_items: &[PluItem]) -> io::Result<()> {
    let mut file = File::create(path)?;
    file.write_all(UTF8_BOM)?;

    let mut wtr = csv::WriterBuilder::new().from_writer(file);

    wtr.write_record(&PLU_COLUMNS)?;

    for item in plu_items {
        wtr.write_record(&[
            item.no.to_string(),
            item.date.clone(),
            item.item.clone(),
            format!("{:.2}", item.price),
            format!("{:.3}", item.qty),
            format!("{:.2}", item.amount),
        ])?;
    }

    wtr.flush()?;
    Ok(())
}
