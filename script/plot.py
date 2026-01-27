import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from sklearn.preprocessing import MinMaxScaler
import numpy as np
import itertools
import seaborn as sns
import sys

filename = sys.argv[1]



#Plot régression linéaire
df = pd.read_csv(filename)

df = df[df['neighbourhood_cleansed'] == "Centre ville (Bordeaux)"]
df['price_per_bed'] = pd.to_numeric(df['price_per_bed'], errors='coerce')
df['review_scores_rating'] = pd.to_numeric(df['review_scores_rating'], errors='coerce')

df = df.dropna(subset=['price_per_bed', 'review_scores_rating'])

scaler = MinMaxScaler()
x = scaler.fit_transform(df[['review_scores_rating']]).flatten()
y = df['price_per_bed'].values

coef = np.polyfit(x, y, 1)
poly = np.poly1d(coef)

x_line = np.linspace(x.min(), x.max(), 100)
y_line = poly(x_line)

plt.figure(figsize=(8, 6))
plt.scatter(x, y, alpha=0.5, label="Logement airbnb")
plt.plot(x_line, y_line, color='red', linewidth=2, label="Régression linéaire")
plt.ylim(bottom= 0,top=400)
plt.xlim(left=0.4,right=1)
plt.xlabel("Note normalisée (review_scores_rating)")
plt.ylabel("Prix par lit pour une nuit en euros")
plt.grid(True)
plt.legend()
plt.savefig("data/prix_vs_notes_regression.png", dpi=300, bbox_inches="tight")




#Boxplot prix moyen par commune
df = pd.read_csv(filename)


order = df.groupby('neighbourhood_group_cleansed')['price_per_bed'].mean().sort_values().index

plt.figure(figsize=(12,6))
sns.boxplot(data=df, x='neighbourhood_group_cleansed', y='price_per_bed', order=order, showfliers=False)
plt.xlabel("Nom de Commune")
plt.ylabel("Prix pour un lit pour une nuit en euros")
plt.xticks(rotation=90)  
plt.grid(axis='y', linestyle='--', alpha=0.7)
plt.tight_layout()
plt.savefig("data/Prix par commune")



#Prix par rapport au room_type
df = pd.read_csv(filename)

df['price_per_bed'] = pd.to_numeric(df['price_per_bed'], errors='coerce')
df = df.dropna(subset=['price_per_bed', 'room_type'])
order = (
    df.groupby('room_type')['price_per_bed']
    .mean()
    .sort_values()
    .index
)
plt.figure(figsize=(8,6))
sns.boxplot(
    data=df,
    x='room_type',
    y='price_per_bed',
    order=order,
    showfliers=False
)

plt.xlabel("Type de logement")
plt.ylabel("Prix pour un lit par nuit en euros")
plt.grid(axis='y', linestyle='--', alpha=0.7)

plt.tight_layout()
plt.savefig("data/prix_vs_room_type_trie.png", dpi=300)



df = pd.read_csv(filename)

# Nettoyage
df['price_per_bed'] = pd.to_numeric(df['price_per_bed'], errors='coerce')
df['review_scores_rating'] = pd.to_numeric(df['review_scores_rating'], errors='coerce')

df = df.dropna(subset=[
    'price_per_bed',
    'review_scores_rating',
    'neighbourhood_group_cleansed'
])

# Agrégation
grouped = (
    df.groupby('neighbourhood_group_cleansed')
    .agg(
        avg_price_per_bed=('price_per_bed', 'mean'),
        avg_rating=('review_scores_rating', 'mean'),
        count=('price_per_bed', 'count')
    )
)

# Ratio qualité / prix
grouped['quality_price_ratio'] = (
    grouped['avg_rating'] / grouped['avg_price_per_bed']
)

# 🔹 Normalisation entre 0 et 1
scaler = MinMaxScaler()
grouped['quality_price_ratio_norm'] = scaler.fit_transform(
    grouped[['quality_price_ratio']]
)

# Tri
grouped_sorted = grouped.sort_values(
    'quality_price_ratio_norm',
    ascending=False
)

# Plot
plt.figure(figsize=(12,6))
sns.barplot(
    x=grouped_sorted.index,
    y=grouped_sorted['quality_price_ratio_norm']
)

plt.xticks(rotation=45, ha='right')
plt.xlabel("Commune")
plt.ylabel("Rapport Note / prix par lit (normalisé 0–1)")
plt.grid(axis='y', linestyle='--', alpha=0.7)

plt.tight_layout()
plt.savefig("data/qualite_prix_par_quartier_normalise.png", dpi=300)

