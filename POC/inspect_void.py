import json
import re

with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\separated_receipts.json', 'r', encoding='utf-8') as f:
    receipts = json.load(f)

void_receipts = [r for r in receipts if '*** VOID ***' in r or '***           VOID           ***' in r]
print(f"Total receipts containing VOID: {len(void_receipts)}")

for idx, r in enumerate(void_receipts[:5]):
    print(f"\n--- VOID Receipt #{idx+1} ---")
    lines = r.split('\n')
    # print FS line and items
    for line in lines:
        if any(k in line for k in ['FS No', 'VOID', 'ITEM#', 'TOTAL', 'TXBL1', 'SUBTOTAL']) or 'x' in line or '*' in line:
            print("  ", line)
