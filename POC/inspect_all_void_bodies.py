import json
import re

with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\separated_receipts.json', 'r', encoding='utf-8') as f:
    receipts = json.load(f)

void_receipts = []
for r in receipts:
    text = '\n'.join(r)
    fs_m = re.search(r'FS No\.(\d+)', text)
    if fs_m and '***' in text and 'VOID' in text:
        item_m = re.search(r'ITEM#\s+(\d+)', text)
        item_cnt = int(item_m.group(1)) if item_m else 0
        if item_cnt == 0:
            void_receipts.append(r)

print(f"Total void receipts: {len(void_receipts)}")
for i, r in enumerate(void_receipts):
    lines = r
    fs = re.search(r'FS No\.(\d+)', '\n'.join(lines)).group(1)
    date = re.search(r'(\d{2}/\d{2}/\d{4})', '\n'.join(lines)).group(1)
    # find lines between date and TOTAL
    d_idx = -1
    for idx, l in enumerate(lines):
        if re.search(r'\d{2}/\d{2}/\d{4}', l):
            d_idx = idx
            break
    body = lines[d_idx+1:] if d_idx != -1 else lines
    print(f"FS {fs} ({date}):")
    for l in body:
        if 'TOTAL' in l:
            break
        print(f"   {l}")
