with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\HEK0105410_ET_131224_0624_a.txt', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

plu_reports = []
current_report = []
in_plu = False

for i, line in enumerate(lines):
    parts = line.split('\t')
    content = parts[2].strip() if len(parts) >= 3 else line.strip()

    if 'PLU REPORT X' in content:
        # find header info by looking back ~10 lines
        header_lines = [lines[j].split('\t')[-1].strip() for j in range(max(0, i-6), i)]
        in_plu = True
        current_report = header_lines + [content]
        continue

    if in_plu:
        current_report.append(content)
        if 'HEK0105410' in content or '***' in content and 'REPORT' in content:
            plu_reports.append(current_report)
            in_plu = False
            current_report = []

print(f"Total PLU Reports detected: {len(plu_reports)}")
for idx, r in enumerate(plu_reports):
    print(f"\nReport #{idx+1}: first 10 lines:")
    for l in r[:10]:
        print("  ", l)
    print("  ... total lines in report:", len(r))
    # Count how many NUMBER: lines
    num_count = sum(1 for l in r if l.startswith('NUMBER:'))
    print("  ... total PLU items (NUMBER:):", num_count)
