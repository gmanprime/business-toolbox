with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\HEK0105410_ET_131224_0624_a.txt', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

tin_lines = set()
for line in lines:
    parts = line.split('\t')
    content = parts[2].strip() if len(parts) >= 3 else line.strip()
    if 'TIN' in content:
        tin_lines.add(content)

for t in sorted(tin_lines):
    print(repr(t))
