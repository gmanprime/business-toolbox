import re

with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\HEK0105410_ET_131224_0624_a.txt', 'r', encoding='utf-8', errors='replace') as f:
    raw_lines = f.readlines()

def parse_money(s: str) -> float:
    return float(s.replace(',', '').replace('*', ''))

# Pattern for name and price: <name> <price> <tax_group>
# e.g., "Electirc wire ilslc 90.000 1" or "Hook big Golden 144/ 58.000 1"
re_name_price = re.compile(r'^(.*?)\s+([\d,.]+)\s+(\d+)$')
re_qty = re.compile(r'^QTY:\s*([\d,.]+)$')
re_amt = re.compile(r'^AMOUNT:\s*\*?([\d,.]+)$')

i = 29279 # Start of Report 16
date = "19/03/2024"
parsed_items = []

while i < len(raw_lines):
    line = raw_lines[i].split('\t')[-1].strip()
    if 'HEK0105410' in line or (line.startswith('TIN:') and i > 29279 + 5):
        break
    if line.startswith('NUMBER:'):
        num_str = line.split(':')[-1].strip()
        num_val = int(num_str)
        
        i += 1
        name_price_line = raw_lines[i].split('\t')[-1].strip()
        m_np = re_name_price.match(name_price_line)
        if not m_np:
            print(f"FAILED on name_price: '{name_price_line}'")
            item_name = name_price_line
            price = 0.0
        else:
            item_name = m_np.group(1).strip()
            price = parse_money(m_np.group(2))
            tax_group = int(m_np.group(3))

        i += 1
        qty_line = raw_lines[i].split('\t')[-1].strip()
        m_qty = re_qty.match(qty_line)
        qty = parse_money(m_qty.group(1)) if m_qty else 0.0

        i += 1
        amt_line = raw_lines[i].split('\t')[-1].strip()
        m_amt = re_amt.match(amt_line)
        amt = parse_money(m_amt.group(1)) if m_amt else 0.0

        parsed_items.append({
            'No.': num_val,
            'date': date,
            'Item': item_name,
            'Price': price,
            'Qty': qty,
            'Amount': amt,
        })
    i += 1

print(f"Total parsed items: {len(parsed_items)}")
for it in parsed_items[:5]:
    print(it)
print("...")
for it in parsed_items[-3:]:
    print(it)
