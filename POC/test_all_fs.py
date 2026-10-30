import re
import json
import pandas as pd
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

fs_receipts = [r for r in receipts if re.search(r'FS No\.\d+', '\n'.join(r))]
print(f"Total FS receipts: {len(fs_receipts)}")

# Check FS numbers present
fs_nums = []
for r in fs_receipts:
    m = re.search(r'FS No\.(\d+)', '\n'.join(r))
    fs_nums.append(int(m.group(1)))

fs_nums = sorted(fs_nums)
print(f"FS min: {min(fs_nums)}, FS max: {max(fs_nums)}, total: {len(fs_nums)}")
missing = sorted(list(set(range(1, 427)) - set(fs_nums)))
print(f"Any missing numbers between 1 and 426?: {missing}")
