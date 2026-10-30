# -*- coding: utf-8 -*-
"""
Mama Receipts Processor
=======================
Reads the raw receipt text file, separates individual receipts,
parses FS-numbered sales receipts into structured JSON, and
outputs an Excel (.xlsx) file with the required 14-column schema.

Usage:
    python process_receipts.py
"""

import json
import os
import re
import sys
import pandas as pd
from pathlib import Path

# Ensure UTF-8 output on Windows terminal
if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR = Path(r"c:\Users\yonat\Documents\@Projects\Mama Recipts")
SOURCE_FILE = BASE_DIR / "HEK0105410_ET_131224_0624_a.txt"
INDIVIDUAL_DIR = BASE_DIR / "separated_receipts"
JSON_OUTPUT = BASE_DIR / "separated_receipts.json"
EXCEL_OUTPUT = BASE_DIR / "mama_receipts_output.xlsx"
CSV_OUTPUT = BASE_DIR / "mama_receipts_output.csv"
X_REPORT_CSV_OUTPUT = BASE_DIR / "mama_x_reports_output.csv"

# ── Target columns (X Reports / PLU inventory) ────────────────────────────
X_REPORT_COLUMNS = [
    'No.',
    'date',
    'Item',
    'Price',
    'Qty',
    'Amount',
]
TARGET_COLUMNS = [
    'ተ. ቁ.',                                   # 1  Serial number (row index)
    'የተሸጠው የእቃ መጠሪያ',                          # 2  Item name
    'የሥሪት ሃገር',                                 # 3  Country of origin
    'Brand Name',                               # 4  Brand
    'መለኪያ',                                     # 5  Unit of measure
    'ብዛት',                                      # 6  Quantity
    'የአንዱ አማካይ ግዢ ዋጋ UNIT',                     # 7  Avg purchase price (unit)
    'የአንዱ ሽያጭ ዋጋ ከተእታ በፊት',                    # 8  Unit selling price before VAT
    'ጠቅላላ ሽያጭ ዋጋ ከተእታ በፊት',                    # 9  Total selling price before VAT
    'ተ እ ታ',                                    # 10 VAT
    'ጠቅላላ ዋጋ ታክስ ጨምሮ',                         # 11 Total price including tax
    'የሽያጭ ደረሰኝ ቁጥር (FS No.)',                   # 12 FS number
    'ሽያጭ የተከናወነበት ቀን /ወር/',                    # 13 Date of sale
    'የሽያጭ መመዝገቢያ መለያ ኮድ /MRC/',                 # 14 MRC code
]

# ── Regex patterns ─────────────────────────────────────────────────────────
RE_FS_NO     = re.compile(r'FS No\.(\d+)')
RE_DATE_TIME = re.compile(r'(\d{2}/\d{2}/\d{4})\s+(\d{2}:\d{2})')
RE_TXBL1     = re.compile(r'TXBL1\s+\*?([\d,]+\.\d{2})')
RE_TAX1      = re.compile(r'TAX1\s+15%\s+\*?([\d,]+\.\d{2})')
RE_TOTAL     = re.compile(r'TOTAL:\s+\*?([\d,]+\.\d{2})')
RE_MRC       = re.compile(r'(HEK\d+)')
RE_MULTIPLIER = re.compile(r'^\s*([\d,.]+)\s*x\s*([\d,.]+)\s*=\s*$')
RE_ITEM_LINE = re.compile(r'^(.+?)\s+\*?([\d,]+\.\d{2})\s*$')
RE_VOID      = re.compile(r'\*{3}\s*VOID\s*\*{3}')
RE_SUBTOTAL  = re.compile(r'^SUBTOTAL:')
RE_SEPARATOR = re.compile(r'^\s*-\s+-\s+-\s+-\s*$')
RE_BUYERS_TIN = re.compile(r"Buyer's TIN:")
RE_ITEM_COUNT = re.compile(r'ITEM#\s+(\d+)')


def parse_money(s: str) -> float:
    """Convert a receipt price string like '2,608.65' to float."""
    if s is None:
        return 0.0
    return float(s.replace(',', ''))


# ═══════════════════════════════════════════════════════════════════════════
# STEP 1  –  Read raw file and split into individual receipt blocks
# ═══════════════════════════════════════════════════════════════════════════
def read_and_split_receipts(filepath: Path) -> list[list[str]]:
    """
    Parse the tab-delimited text file.  Each line has the format:
        00000435\tN\t<content>
    We extract the content column and split on 'TIN:' boundaries,
    ending each block at 'HEK0105410'.
    """
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        raw_lines = f.readlines()

    receipts: list[list[str]] = []
    current: list[str] = []
    in_receipt = False

    for raw in raw_lines:
        parts = raw.split('\t')
        content = parts[2].strip() if len(parts) >= 3 else raw.strip()

        # ONLY start on store TIN header, NOT on "Buyer's TIN:"
        if content.startswith('TIN:'):
            in_receipt = True
            current = []

        if in_receipt:
            current.append(content)
            if 'HEK0105410' in content:
                receipts.append(current)
                in_receipt = False
                current = []

    return receipts


# ═══════════════════════════════════════════════════════════════════════════
# STEP 1b –  Save individual receipt text files (for auditing)
# ═══════════════════════════════════════════════════════════════════════════
def save_individual_receipts(receipts: list[list[str]], out_dir: Path):
    """Write each receipt block to its own .txt file inside out_dir."""
    out_dir.mkdir(parents=True, exist_ok=True)
    for i, lines in enumerate(receipts):
        with open(out_dir / f"receipt_{i:04d}.txt", 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
    print(f"  >> Saved {len(receipts)} individual receipt files to {out_dir}")


# ═══════════════════════════════════════════════════════════════════════════
# STEP 2  –  Parse each FS receipt into structured JSON records
# ═══════════════════════════════════════════════════════════════════════════
def classify_receipt(lines: list[str]) -> str:
    """Return 'fs' for sales receipts, 'z' for Z reports, 'other' otherwise."""
    text = '\n'.join(lines)
    if RE_FS_NO.search(text):
        return 'fs'
    if 'SESSION Z REPORT' in text or re.search(r'\bZ:\d+', text):
        return 'z'
    return 'other'


def parse_items_from_body(body_lines: list[str]) -> list[dict]:
    """
    Parse the item lines between the date row and the first separator/SUBTOTAL.
    Handles three patterns:
      A) multiplier row then item row:  "1.370 x 2.000 ="  followed by  "Bolt and Nut 12x60( *2.74"
      B) plain item line:  "Socket + Switch Bits *52.17"
      C) VOID blocks: item, ***VOID***, negative item → skip the item entirely
    """
    items: list[dict] = []
    i = 0
    while i < len(body_lines):
        line = body_lines[i]

        # Skip separator, SUBTOTAL, TXBL, TAX, TOTAL, CASH, CHANGE, ITEM#, E R C A, HEK, Buyer's TIN, empty
        if (RE_SEPARATOR.match(line) or RE_SUBTOTAL.match(line) or
            line.startswith('TXBL') or line.startswith('TAX') or
            line.startswith('TOTAL:') or line.startswith('CASH') or
            line.startswith('CHANGE:') or line.startswith('ITEM#') or
            'E R C A' in line or 'HEK0105410' in line or
            RE_BUYERS_TIN.search(line) or
            line.startswith('NOTXBL') or
            line.strip() == ''):
            i += 1
            continue

        # Check for VOID: current item, next line VOID, next-next line is negative → skip all 3
        if i + 2 < len(body_lines) and RE_VOID.search(body_lines[i + 1]):
            # Skip the voided triplet (item, VOID, negative-item)
            i += 3
            continue

        # Check for multiplier line
        mult_match = RE_MULTIPLIER.match(line)
        if mult_match:
            unit_price = parse_money(mult_match.group(1))
            quantity = parse_money(mult_match.group(2))
            # Next line should be the item name + total price
            i += 1
            if i < len(body_lines):
                item_match = RE_ITEM_LINE.match(body_lines[i])
                if item_match:
                    item_name = item_match.group(1).strip()
                    total_price = parse_money(item_match.group(2))
                    items.append({
                        'name': item_name,
                        'quantity': quantity,
                        'unit_price': unit_price,
                        'total_price': total_price,
                    })
                # else: couldn't parse → skip
            i += 1
            continue

        # Plain item line (no multiplier)
        item_match = RE_ITEM_LINE.match(line)
        if item_match:
            item_name = item_match.group(1).strip()
            total_price = parse_money(item_match.group(2))
            items.append({
                'name': item_name,
                'quantity': 1,
                'unit_price': total_price,
                'total_price': total_price,
            })
            i += 1
            continue

        # Unrecognised line – skip
        i += 1

    return items


def parse_fs_receipt(lines: list[str]) -> dict | None:
    """
    Parse a single FS (sales) receipt block into a structured dict.
    Returns None for voided receipts (ITEM# 0) or receipts that
    can't be parsed.
    """
    text = '\n'.join(lines)

    # FS Number
    fs_match = RE_FS_NO.search(text)
    fs_no = fs_match.group(1) if fs_match else None

    # Date / Time
    dt_match = RE_DATE_TIME.search(text)
    date = dt_match.group(1) if dt_match else None
    time_ = dt_match.group(2) if dt_match else None

    # MRC
    mrc_match = RE_MRC.search(text)
    mrc = mrc_match.group(1) if mrc_match else 'HEK0105410'

    # TXBL1 (total before VAT)
    txbl_match = RE_TXBL1.search(text)
    txbl1 = parse_money(txbl_match.group(1)) if txbl_match else 0.0

    # TAX1
    tax_match = RE_TAX1.search(text)
    tax1 = parse_money(tax_match.group(1)) if tax_match else 0.0

    # TOTAL
    total_match = RE_TOTAL.search(text)
    total = parse_money(total_match.group(1)) if total_match else 0.0

    # ITEM count
    item_count_match = RE_ITEM_COUNT.search(text)
    item_count = int(item_count_match.group(1)) if item_count_match else 0

    # ── Find body lines (everything between date row and first separator) ──
    # The body starts right after the date/time line
    body_start = None
    for idx, ln in enumerate(lines):
        if RE_DATE_TIME.match(ln):
            body_start = idx + 1
            break

    if body_start is None:
        return None

    # Handle voided receipts: preserve them with FS No, Date, MRC, 0 amounts, and [VOID] item name
    if item_count == 0 or (RE_VOID.search(text) and total == 0.0):
        void_item_name = "*** VOID ***"
        for ln in lines[body_start:]:
            if (RE_VOID.search(ln) or RE_SEPARATOR.match(ln) or RE_SUBTOTAL.match(ln) or
                RE_BUYERS_TIN.search(ln) or ln.startswith('TOTAL') or ln.startswith('CASH')):
                continue
            item_match = RE_ITEM_LINE.match(ln)
            if item_match and not item_match.group(2).startswith('-'):
                void_item_name = f"{item_match.group(1).strip()} (VOID)"
                break

        return {
            'fs_no': fs_no,
            'date': date,
            'time': time_,
            'mrc': mrc,
            'txbl1': 0.0,
            'tax1': 0.0,
            'total': 0.0,
            'item_count': 0,
            'is_void': True,
            'items': [{
                'name': void_item_name,
                'quantity': 0,
                'unit_price': 0.0,
                'total_price': 0.0,
            }],
        }

    # Body ends at the first "- - - -" separator (or TXBL/TAX line)
    body_lines = lines[body_start:]

    # Parse items from the body
    items = parse_items_from_body(body_lines)

    if not items:
        return None

    return {
        'fs_no': fs_no,
        'date': date,
        'time': time_,
        'mrc': mrc,
        'txbl1': txbl1,
        'tax1': tax1,
        'total': total,
        'item_count': item_count,
        'is_void': False,
        'items': items,
    }


# ═══════════════════════════════════════════════════════════════════════════
# STEP 3  –  Map parsed JSON to the 14-column DataFrame rows
# ═══════════════════════════════════════════════════════════════════════════
def receipts_to_dataframe(parsed_receipts: list[dict]) -> pd.DataFrame:
    """
    Each parsed receipt may contain multiple items.
    We create one DataFrame row per item, flattening the receipt metadata
    across all item rows that belong to it.

    For multi-item receipts:
    - Each item gets its own row with the same FS No., date, MRC.
    - The receipt-level tax/total are shared (they apply to the whole receipt).
    - Per-item VAT is computed proportionally:
          item_vat = receipt_tax * (item_total / receipt_txbl)
    """
    rows = []
    serial = 1

    for receipt in parsed_receipts:
        fs_no = receipt['fs_no']
        date = receipt['date']
        mrc = receipt['mrc']
        receipt_txbl = receipt['txbl1']
        receipt_tax = receipt['tax1']
        receipt_total = receipt['total']

        for item in receipt['items']:
            # Proportional VAT for this item
            if receipt_txbl > 0:
                item_vat = receipt_tax * (item['total_price'] / receipt_txbl)
            else:
                item_vat = 0.0

            item_total_incl_tax = item['total_price'] + item_vat

            row = {
                'ተ. ቁ.': serial,
                'የተሸጠው የእቃ መጠሪያ': item['name'],
                'የሥሪት ሃገር': '',                # Not in receipt text
                'Brand Name': '',                # Not in receipt text
                'መለኪያ': '',                      # Not explicitly in receipt text
                'ብዛት': item['quantity'],
                'የአንዱ አማካይ ግዢ ዋጋ UNIT': '',    # Purchase cost not on sales receipt
                'የአንዱ ሽያጭ ዋጋ ከተእታ በፊት': round(item['unit_price'], 2),
                'ጠቅላላ ሽያጭ ዋጋ ከተእታ በፊት': round(item['total_price'], 2),
                'ተ እ ታ': round(item_vat, 2),
                'ጠቅላላ ዋጋ ታክስ ጨምሮ': round(item_total_incl_tax, 2),
                'የሽያጭ ደረሰኝ ቁጥር (FS No.)': fs_no,
                'ሽያጭ የተከናወነበት ቀን /ወር/': date,
                'የሽያጭ መመዝገቢያ መለያ ኮድ /MRC/': mrc,
            }
            rows.append(row)
            serial += 1

    df = pd.DataFrame(rows, columns=TARGET_COLUMNS)
    return df


# ═══════════════════════════════════════════════════════════════════════════
# STEP 3b – Parse X-Reports (PLU Report X)
# ═══════════════════════════════════════════════════════════════════════════
def parse_plu_x_reports(filepath: Path) -> pd.DataFrame:
    """
    Extract the PLU REPORT X items from the source file.
    Each item block is structured as:
        NUMBER:                     0101
        Electirc wire ilslc     90.000 1
        QTY:                      65.860
        AMOUNT:                *1,239.28
    Returns a DataFrame with columns ['No.', 'date', 'Item', 'Price', 'Qty', 'Amount'].
    """
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        raw_lines = f.readlines()

    re_name_price = re.compile(r'^(.*?)\s+([\d,.]+)\s+(\d+)$')
    re_qty = re.compile(r'^QTY:\s*([\d,.]+)$')
    re_amt = re.compile(r'^AMOUNT:\s*\*?([\d,.]+)$')

    start_idx = None
    date_val = "19/03/2024"

    for idx, raw in enumerate(raw_lines):
        if 'PLU REPORT X' in raw:
            start_idx = idx
            # Locate date from previous lines
            for back in range(max(0, idx - 8), idx):
                m_dt = RE_DATE_TIME.search(raw_lines[back])
                if m_dt:
                    date_val = m_dt.group(1)
                    break
            break

    if start_idx is None:
        return pd.DataFrame(columns=X_REPORT_COLUMNS)

    items = []
    i = start_idx
    while i < len(raw_lines):
        line = raw_lines[i].split('\t')[-1].strip()
        if 'HEK0105410' in line or (line.startswith('TIN:') and i > start_idx + 5):
            break

        if line.startswith('NUMBER:'):
            num_str = line.split(':')[-1].strip()
            num_val = int(num_str)

            i += 1
            if i >= len(raw_lines):
                break
            name_price_line = raw_lines[i].split('\t')[-1].strip()
            m_np = re_name_price.match(name_price_line)
            if m_np:
                item_name = m_np.group(1).strip()
                price = parse_money(m_np.group(2))
            else:
                item_name = name_price_line
                price = 0.0

            i += 1
            if i >= len(raw_lines):
                break
            qty_line = raw_lines[i].split('\t')[-1].strip()
            m_qty = re_qty.match(qty_line)
            qty = parse_money(m_qty.group(1)) if m_qty else 0.0

            i += 1
            if i >= len(raw_lines):
                break
            amt_line = raw_lines[i].split('\t')[-1].strip()
            m_amt = re_amt.match(amt_line)
            amt = parse_money(m_amt.group(1)) if m_amt else 0.0

            items.append({
                'No.': num_val,
                'date': date_val,
                'Item': item_name,
                'Price': round(price, 2),
                'Qty': round(qty, 3),
                'Amount': round(amt, 2),
            })
        i += 1

    return pd.DataFrame(items, columns=X_REPORT_COLUMNS)


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════
def main():
    print("=" * 70)
    print("  MAMA RECEIPTS PROCESSOR")
    print("=" * 70)

    # ── Step 1: Read and split ──
    print("\n[Step 1] Reading and splitting receipts...")
    all_receipts = read_and_split_receipts(SOURCE_FILE)
    print(f"  >> Total receipt blocks found: {len(all_receipts)}")

    # ── Step 1b: Save individual files ──
    print("\n[Step 1b] Saving individual receipt files...")
    save_individual_receipts(all_receipts, INDIVIDUAL_DIR)

    # ── Step 1c: Save to JSON ──
    receipts_text = ['\n'.join(r) for r in all_receipts]
    with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(receipts_text, f, indent=2, ensure_ascii=False)
    print(f"  >> Saved JSON to {JSON_OUTPUT}")

    # ── Classify ──
    fs_receipts = []
    z_count = 0
    other_count = 0
    for r in all_receipts:
        kind = classify_receipt(r)
        if kind == 'fs':
            fs_receipts.append(r)
        elif kind == 'z':
            z_count += 1
        else:
            other_count += 1

    print(f"\n  Receipt breakdown:")
    print(f"    FS (sales) receipts : {len(fs_receipts)}")
    print(f"    Z reports           : {z_count}")
    print(f"    Other               : {other_count}")

    # ── Step 2: Parse FS receipts ──
    print("\n[Step 2] Parsing FS receipts...")
    parsed = []
    skipped_parse_error = 0

    for lines in fs_receipts:
        result = parse_fs_receipt(lines)
        if result is None:
            skipped_parse_error += 1
        else:
            parsed.append(result)

    valid_sales_count = sum(1 for r in parsed if not r.get('is_void'))
    void_count = sum(1 for r in parsed if r.get('is_void'))

    print(f"  >> Total FS receipts processed : {len(parsed)}")
    print(f"     - Valid sales receipts      : {valid_sales_count}")
    print(f"     - Kept voided receipts      : {void_count}")
    if skipped_parse_error > 0:
        print(f"  >> Skipped (parse err)         : {skipped_parse_error}")

    # Save parsed JSON
    parsed_json_path = BASE_DIR / "parsed_receipts.json"
    with open(parsed_json_path, 'w', encoding='utf-8') as f:
        json.dump(parsed, f, indent=2, ensure_ascii=False)
    print(f"  >> Saved parsed JSON to {parsed_json_path}")

    # ── Step 3: Build FS Sales DataFrame ──
    print("\n[Step 3] Building FS Sales DataFrame...")
    df_fs = receipts_to_dataframe(parsed)
    print(f"  >> Total FS data rows: {len(df_fs)}")

    # ── Step 4: Parse X-Report (PLU Inventory) ──
    print("\n[Step 4] Parsing X-Report (PLU)...")
    df_x = parse_plu_x_reports(SOURCE_FILE)
    print(f"  >> Total X-Report items parsed: {len(df_x)}")
    print(f"  >> Columns: {list(df_x.columns)}")

    # ── Step 5: Export CSV files ──
    print("\n[Step 5] Exporting CSV files...")
    # FS Sales CSV
    try:
        df_fs.to_csv(CSV_OUTPUT, index=False, encoding='utf-8-sig')
        print(f"  >> Saved FS Sales CSV to {CSV_OUTPUT}")
    except PermissionError:
        fallback_csv = BASE_DIR / "mama_receipts_output_updated.csv"
        df_fs.to_csv(fallback_csv, index=False, encoding='utf-8-sig')
        print(f"  [!] Note: '{CSV_OUTPUT.name}' is open in Excel.")
        print(f"  >> Saved updated FS Sales CSV to {fallback_csv}")

    # X-Report CSV
    try:
        df_x.to_csv(X_REPORT_CSV_OUTPUT, index=False, encoding='utf-8-sig')
        print(f"  >> Saved X-Report CSV to {X_REPORT_CSV_OUTPUT}")
    except PermissionError:
        fallback_x_csv = BASE_DIR / "mama_x_reports_output_updated.csv"
        df_x.to_csv(fallback_x_csv, index=False, encoding='utf-8-sig')
        print(f"  [!] Note: '{X_REPORT_CSV_OUTPUT.name}' is open in Excel.")
        print(f"  >> Saved updated X-Report CSV to {fallback_x_csv}")

    # ── Step 6: Export Multi-Sheet Excel ──
    print("\n[Step 6] Exporting Multi-Sheet Excel...")
    def write_multi_sheet_excel(out_path):
        with pd.ExcelWriter(out_path, engine='openpyxl') as writer:
            df_fs.to_excel(writer, sheet_name='Sales Receipts (FS)', index=False)
            df_x.to_excel(writer, sheet_name='X Reports (PLU)', index=False)

    try:
        write_multi_sheet_excel(EXCEL_OUTPUT)
        print(f"  >> Saved Multi-Sheet Excel to {EXCEL_OUTPUT}")
    except PermissionError:
        fallback_xlsx = BASE_DIR / "mama_receipts_output_updated.xlsx"
        write_multi_sheet_excel(fallback_xlsx)
        print(f"  [!] Note: '{EXCEL_OUTPUT.name}' is currently open in Excel.")
        print(f"  >> Saved updated Multi-Sheet Excel to {fallback_xlsx}")

    # Previews
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 200)
    pd.set_option('display.max_colwidth', 30)

    print("\n" + "=" * 70)
    print("  PREVIEW: Sheet 1 - Sales Receipts (FS) [First 5 rows]")
    print("=" * 70)
    print(df_fs.head(5).to_string())

    print("\n" + "=" * 70)
    print("  PREVIEW: Sheet 2 - X Reports (PLU) [First 5 rows]")
    print("=" * 70)
    print(df_x.head(5).to_string())

    print("\n[OK] Done!")


if __name__ == '__main__':
    main()
