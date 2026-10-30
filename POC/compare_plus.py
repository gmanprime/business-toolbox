with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\HEK0105410_ET_131224_0624_a.txt', 'r', encoding='utf-8', errors='replace') as f:
    raw_lines = f.readlines()

def extract_plu_items(start_line):
    items = []
    i = start_line
    while i < len(raw_lines):
        line = raw_lines[i].split('\t')[-1].strip()
        if 'HEK0105410' in line or (line.startswith('TIN:') and i > start_line + 5):
            break
        if line.startswith('NUMBER:'):
            num = line.split(':')[-1].strip()
            # next line is item name and price
            i += 1
            if i >= len(raw_lines): break
            name_price_line = raw_lines[i].split('\t')[-1].strip()
            # next line is QTY
            i += 1
            if i >= len(raw_lines): break
            qty_line = raw_lines[i].split('\t')[-1].strip()
            # next line is AMOUNT
            i += 1
            if i >= len(raw_lines): break
            amt_line = raw_lines[i].split('\t')[-1].strip()
            items.append({
                'number': num,
                'name_price': name_price_line,
                'qty': qty_line,
                'amount': amt_line
            })
        i += 1
    return items

items_16 = extract_plu_items(29279)
items_17 = extract_plu_items(29739)
items_26 = extract_plu_items(34296)

print(f"Items in Report 16 (19/03/2024 17:29): {len(items_16)}")
print(f"Items in Report 17 (19/03/2024 17:35): {len(items_17)}")
print(f"Items in Report 26 (28/03/2024 16:59): {len(items_26)}")

# Check if 16 and 17 are identical
print(f"Report 16 == Report 17?: {items_16 == items_17}")
print(f"Report 16 == Report 26?: {items_16 == items_26}")
