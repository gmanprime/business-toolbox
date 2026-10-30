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

    # ONLY start receipt on seller TIN, NOT Buyer's TIN!
    if content.startswith('TIN:'):
        in_receipt = True
        current = []

    if in_receipt:
        current.append(content)
        if 'HEK0105410' in content:
            receipts.append(current)
            in_receipt = False
            current = []

print(f"Total receipts extracted: {len(receipts)}")

fs_receipts = []
z_receipts = []
other_receipts = []

for r in receipts:
    text = '\n'.join(r)
    if 'FS No.' in text:
        fs_receipts.append(r)
    elif 'SESSION Z REPORT' in text or 'Z:' in text:
        z_receipts.append(r)
    else:
        other_receipts.append(r)

print(f"FS receipts: {len(fs_receipts)}")
print(f"Z reports: {len(z_receipts)}")
print(f"Other: {len(other_receipts)}")

fs_numbers = []
for r in fs_receipts:
    text = '\n'.join(r)
    m = re.search(r'FS No\.(\d+)', text)
    if m:
        fs_numbers.append(int(m.group(1)))

fs_numbers = sorted(fs_numbers)
print(f"FS min: {min(fs_numbers)}, FS max: {max(fs_numbers)}, count: {len(fs_numbers)}")

missing = sorted(list(set(range(1, max(fs_numbers) + 1)) - set(fs_numbers)))
print(f"Missing FS numbers in raw extraction: {missing}")
