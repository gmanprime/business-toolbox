with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\HEK0105410_ET_131224_0624_a.txt', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

for target in ['No.NF:00000016', 'No.NF:00000017', 'No.NF:00000026']:
    for i, line in enumerate(lines):
        if target in line:
            # count lines until next HEK0105410
            end = i
            for j in range(i, min(len(lines), i+1500)):
                if 'HEK0105410' in lines[j]:
                    end = j
                    break
            print(f"{target} starts at line {i}, ends at {end} (length: {end-i} lines)")
