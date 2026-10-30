import re
from pathlib import Path

SOURCE_FILE = Path(r"c:\Users\yonat\Documents\@Projects\Mama Recipts\HEK0105410_ET_131224_0624_a.txt")

with open(SOURCE_FILE, 'r', encoding='utf-8', errors='replace') as f:
    raw_lines = f.readlines()

receipts = []
current = []
in_receipt = False

for raw in raw_lines:
    parts = raw.split('\t')
    content = parts[2].strip() if len(parts) >= 3 else raw.strip()

    if content.startswith('TIN:'):
        in_receipt = True
        current = []

    if in_receipt:
        current.append(content)
        if 'HEK0105410' in content:
            receipts.append(current)
            in_receipt = False
            current = []

void_fs = []
valid_fs = []

for r in receipts:
    text = '\n'.join(r)
    fs_m = re.search(r'FS No\.(\d+)', text)
    if fs_m:
        fs_num = int(fs_m.group(1))
        item_m = re.search(r'ITEM#\s+(\d+)', text)
        item_cnt = int(item_m.group(1)) if item_m else 0
        total_m = re.search(r'TOTAL:\s+\*?([\d,.]+)', text)
        total_val = float(total_m.group(1).replace(',', '')) if total_m else 0.0
        
        if '***' in text and 'VOID' in text and item_cnt == 0:
            void_fs.append(fs_num)
        else:
            valid_fs.append(fs_num)

print(f"Total FS: {len(valid_fs) + len(void_fs)}")
print(f"Valid FS (real sales): {len(valid_fs)}")
print(f"Voided FS (0 items / 0 total): {len(void_fs)}")
print(f"List of Voided FS numbers: {void_fs}")
