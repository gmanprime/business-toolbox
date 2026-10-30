import json
import re

with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\separated_receipts.json', 'r', encoding='utf-8') as f:
    receipts = json.load(f)

void_receipts = [r for r in receipts if 'VOID' in r]
with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\void_summary.txt', 'w', encoding='utf-8') as out:
    for idx, r in enumerate(void_receipts):
        fs = re.search(r'FS No\.(\d+)', r)
        fs_str = fs.group(1) if fs else 'No FS'
        item = re.search(r'ITEM#\s+(\d+)', r)
        item_str = item.group(1) if item else 'No ITEM#'
        total = re.search(r'TOTAL:\s+\*?([\d,.]+)', r)
        total_str = total.group(1) if total else 'No TOTAL'
        out.write(f"Receipt #{idx+1}: FS={fs_str}, ITEM#={item_str}, TOTAL={total_str}\n")
