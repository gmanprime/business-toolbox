import pandas as pd

df = pd.read_excel(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\mama_receipts_output.xlsx')
col = df.columns[11]

with open(r'c:\Users\yonat\Documents\@Projects\Mama Recipts\check_fs.txt', 'w', encoding='utf-8') as f:
    f.write(f"Target Column: {col}\n")
    f.write(f"Total Rows: {len(df)}\n")
    f.write(f"Unique FS Numbers: {df[col].nunique()}\n")
    f.write(f"Min FS: {df[col].min()}\n")
    f.write(f"Max FS: {df[col].max()}\n")
    f.write(f"Any values containing 'Z' or 'z': {df[col].astype(str).str.contains('Z|z').any()}\n")
    f.write("\nFirst 20 FS values:\n")
    for val in df[col].head(20):
        f.write(f"  {val}\n")
    f.write("\nLast 20 FS values:\n")
    for val in df[col].tail(20):
        f.write(f"  {val}\n")
