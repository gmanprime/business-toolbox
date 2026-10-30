import pandas as pd

df = pd.read_excel('mama_receipts_output.xlsx')
col = df.columns[11]
sample = df[df[col].astype(int).between(11, 16)][['ተ. ቁ.', 'የተሸጠው የእቃ መጠሪያ', 'ብዛት', 'ጠቅላላ ዋጋ ታክስ ጨምሮ', col, 'ሽያጭ የተከናወነበት ቀን /ወር/']]
with open('verify_voids.txt', 'w', encoding='utf-8') as f:
    f.write(sample.to_string())
