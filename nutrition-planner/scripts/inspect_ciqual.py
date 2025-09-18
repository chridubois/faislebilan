import pandas as pd

# chemin du fichier téléchargé
path = "data/raw/ciqual/Table Ciqual 2020_FR_2020 07 07.xls"

# lit la première feuille (par défaut)
df = pd.read_excel(path)

# affiche les noms de colonnes
print("Colonnes CIQUAL :")
for col in df.columns.tolist():
    print("-", col)
