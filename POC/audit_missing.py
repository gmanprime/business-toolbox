import json
import re
import pandas as pd

df = pd.read_excel(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\mama_receipts_output.xlsx')
existing_fs = set(int(x) for x in df['የሽያጭ ደረሰኝ ቁጥር (FS No.)'].dropna().unique())

all_fs_range = set(range(1, max(existing_fs) + 1))
missing_fs = sorted(list(all_fs_range - existing_fs))

with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\separated_receipts.json', 'r', encoding='utf-8') as f:
    receipts = json.load(f)

# Find where each missing FS is in the raw receipts
results = []
for m in missing_fs:
    target_pattern = f"FS No.{m:08d}"
    found = False
    for r in receipts:
        if target_pattern in r:
            is_void = 'VOID' in r
            item_m = re.search(r'ITEM#\s+(\d+)', r)
            item_cnt = item_m.group(1) if item_m else 'N/A'
            total_m = re.search(r'TOTAL:\s+\*?([\d,.]+)', r)
            total_val = total_m.group(1) if total_m else 'N/A'
            results.append((m, target_pattern, "FOUND", f"VOID={is_void}, ITEM#={item_cnt}, TOTAL={total_val}"))
            found = True
            break
    if not found:
        results.append((m, target_pattern, "NOT FOUND IN RAW", ""))

with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\audit_missing_fs.txt', 'w', encoding='utf-8') as f:
    f.write(f"Total missing FS numbers: {len(missing_fs)}\n\n")
    for r in results:
        f.write(f"FS #{r[0]:08d}: Status={r[2]} | Details: {r[3]}\n")
