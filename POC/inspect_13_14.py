import json

with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\separated_receipts.json', 'r', encoding='utf-8') as f:
    receipts = json.load(f)

for target in ['FS No.00000013', 'FS No.00000014']:
    for r in receipts:
        if target in r:
            print(f"=== {target} ===")
            print(r)
            print()
