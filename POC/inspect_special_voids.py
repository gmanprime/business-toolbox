import json

with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\separated_receipts.json', 'r', encoding='utf-8') as f:
    receipts = json.load(f)

for target_fs in ['00000056', '00000062', '00000226']:
    for r in receipts:
        if f'FS No.{target_fs}' in r:
            print(f"=== FS No.{target_fs} ===")
            print(r)
            print("\n" + "="*40 + "\n")
