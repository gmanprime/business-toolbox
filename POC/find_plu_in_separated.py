import json

with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\separated_receipts.json', 'r', encoding='utf-8') as f:
    receipts = json.load(f)

for idx, r in enumerate(receipts):
    if 'PLU REPORT X' in r:
        lines = r.split('\n')
        # find No.NF line
        nf = [l for l in lines if 'No.NF:' in l]
        dt = [l for l in lines if '/' in l and ':' in l]
        print(f"Receipt index {idx}: {nf}, date line: {dt[:1]}, total lines: {len(lines)}")
