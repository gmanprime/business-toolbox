import re

with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\HEK0105410_ET_131224_0624_a.txt', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

x_reports = []
for i, line in enumerate(lines):
    if 'X REPORT' in line:
        context = [lines[j].split('\t')[-1].strip() for j in range(max(0, i-2), min(len(lines), i+15))]
        x_reports.append((i, context))

print(f"Total X Reports found: {len(x_reports)}")
for idx, (lineno, ctx) in enumerate(x_reports):
    print(f"\n--- X Report #{idx+1} at line {lineno} ---")
    for l in ctx[:10]:
        print("  ", l)
