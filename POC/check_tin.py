with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\HEK0105410_ET_131224_0624_a.txt', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

buyer_tin_count = 0
header_tin_count = 0

for line in lines:
    parts = line.split('\t')
    content = parts[2].strip() if len(parts) >= 3 else line.strip()
    if "Buyer's TIN:" in content:
        buyer_tin_count += 1
    elif "TIN:" in content:
        header_tin_count += 1

print(f"Header TIN: count = {header_tin_count}")
print(f"Buyer's TIN: count = {buyer_tin_count}")
