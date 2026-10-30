use std::path::Path;
use rust_xlsxwriter::{Format, FormatBorder, Workbook, XlsxError};

use crate::parser::models::{FsRow, PluItem};

pub const FS_COLUMNS: [&str; 14] = [
    "ተ. ቁ.",
    "የተሸጠው የእቃ መጠሪያ",
    "የሥሪት ሃገር",
    "Brand Name",
    "መለኪያ",
    "ብዛት",
    "የአንዱ አማካይ ግዢ ዋጋ UNIT",
    "የአንዱ ሽያጭ ዋጋ ከተእታ በፊት",
    "ጠቅላላ ሽያጭ ዋጋ ከተእታ በፊት",
    "ተ እ ታ",
    "ጠቅላላ ዋጋ ታክስ ጨምሮ",
    "የሽያጭ ደረሰኝ ቁጥር (FS No.)",
    "ሽያጭ የተከናወነበት ቀን /ወር/",
    "የሽያጭ መመዝገቢያ መለያ ኮድ /MRC/",
];

pub const PLU_COLUMNS: [&str; 6] = [
    "No.",
    "date",
    "Item",
    "Price",
    "Qty",
    "Amount",
];

/// Exports FS sales rows and PLU inventory items into a multi-sheet Excel workbook.
pub fn export_excel<P: AsRef<Path>>(
    path: P,
    fs_rows: &[FsRow],
    plu_items: &[PluItem],
) -> Result<(), XlsxError> {
    let mut workbook = Workbook::new();

    // Formats
    let header_format = Format::new()
        .set_bold()
        .set_border(FormatBorder::Thin);

    let money_format = Format::new()
        .set_num_format("#,##0.00")
        .set_border(FormatBorder::Thin);

    let qty_format = Format::new()
        .set_num_format("#,##0.000")
        .set_border(FormatBorder::Thin);

    let border_format = Format::new()
        .set_border(FormatBorder::Thin);

    // ─────────────────────────────────────────────────────────────
    // Sheet 1: Sales Receipts (FS)
    // ─────────────────────────────────────────────────────────────
    let sheet1 = workbook.add_worksheet();
    sheet1.set_name("Sales Receipts (FS)")?;

    // Write header
    for (col_idx, &header) in FS_COLUMNS.iter().enumerate() {
        sheet1.write_with_format(0, col_idx as u16, header, &header_format)?;
    }

    // Write rows
    for (row_idx, row) in fs_rows.iter().enumerate() {
        let r = (row_idx + 1) as u32;
        sheet1.write_with_format(r, 0, row.serial as u32, &border_format)?;
        sheet1.write_with_format(r, 1, &row.item_name, &border_format)?;
        sheet1.write_with_format(r, 2, &row.country_of_origin, &border_format)?;
        sheet1.write_with_format(r, 3, &row.brand_name, &border_format)?;
        sheet1.write_with_format(r, 4, &row.unit_of_measure, &border_format)?;
        sheet1.write_with_format(r, 5, row.quantity, &border_format)?;
        sheet1.write_with_format(r, 6, &row.avg_purchase_price, &border_format)?;
        sheet1.write_with_format(r, 7, row.unit_price_before_vat, &money_format)?;
        sheet1.write_with_format(r, 8, row.total_price_before_vat, &money_format)?;
        sheet1.write_with_format(r, 9, row.vat, &money_format)?;
        sheet1.write_with_format(r, 10, row.total_price_incl_tax, &money_format)?;
        sheet1.write_with_format(r, 11, &row.fs_no, &border_format)?;
        sheet1.write_with_format(r, 12, &row.date, &border_format)?;
        sheet1.write_with_format(r, 13, &row.mrc, &border_format)?;
    }

    // Adjust column widths for Sheet 1
    sheet1.set_column_width(0, 8)?;
    sheet1.set_column_width(1, 32)?;
    sheet1.set_column_width(5, 10)?;
    sheet1.set_column_width(7, 18)?;
    sheet1.set_column_width(8, 18)?;
    sheet1.set_column_width(9, 14)?;
    sheet1.set_column_width(10, 18)?;
    sheet1.set_column_width(11, 24)?;
    sheet1.set_column_width(12, 18)?;
    sheet1.set_column_width(13, 20)?;

    // ─────────────────────────────────────────────────────────────
    // Sheet 2: X Reports (PLU)
    // ─────────────────────────────────────────────────────────────
    let sheet2 = workbook.add_worksheet();
    sheet2.set_name("X Reports (PLU)")?;

    // Write header
    for (col_idx, &header) in PLU_COLUMNS.iter().enumerate() {
        sheet2.write_with_format(0, col_idx as u16, header, &header_format)?;
    }

    // Write rows
    for (row_idx, item) in plu_items.iter().enumerate() {
        let r = (row_idx + 1) as u32;
        sheet2.write_with_format(r, 0, item.no, &border_format)?;
        sheet2.write_with_format(r, 1, &item.date, &border_format)?;
        sheet2.write_with_format(r, 2, &item.item, &border_format)?;
        sheet2.write_with_format(r, 3, item.price, &money_format)?;
        sheet2.write_with_format(r, 4, item.qty, &qty_format)?;
        sheet2.write_with_format(r, 5, item.amount, &money_format)?;
    }

    sheet2.set_column_width(0, 10)?;
    sheet2.set_column_width(1, 14)?;
    sheet2.set_column_width(2, 32)?;
    sheet2.set_column_width(3, 14)?;
    sheet2.set_column_width(4, 14)?;
    sheet2.set_column_width(5, 16)?;

    workbook.save(path)?;
    Ok(())
}
