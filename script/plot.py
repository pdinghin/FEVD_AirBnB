import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from sklearn.preprocessing import MinMaxScaler
import numpy as np
import itertools
import sys

filename = sys.argv[1]

df = pd.read_csv(filename)


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
plt.scatter(x, y, alpha=0.5, label="Données")
plt.plot(x_line, y_line, color='red', linewidth=2, label="Régression linéaire")

plt.xlabel("Note normalisée (review_scores_rating)")
plt.ylabel("Prix par lit")
plt.title("Prix par lit vs Note (normalisée)")
plt.grid(True)
plt.legend()

plt.savefig("prix_vs_notes_regression.png", dpi=300, bbox_inches="tight")
plt.show()






df_box = df.dropna(subset=['neighbourhood_cleansed', 'neighbourhood_group_cleansed', 'price'])
medians = df_box.groupby('neighbourhood_cleansed')['price'].median().sort_values()
neighbourhoods = medians.index.tolist()
data = [df_box[df_box['neighbourhood_cleansed'] == n]['price'] for n in neighbourhoods]
neighbourhood_groups = [df_box[df_box['neighbourhood_cleansed'] == n]['neighbourhood_group_cleansed'].iloc[0] for n in neighbourhoods]

plt.figure(figsize=(14, 6))
unique_groups = list(dict.fromkeys(neighbourhood_groups))
colors_cycle = itertools.cycle(plt.cm.tab20.colors)
colors_map = {group: next(colors_cycle) for group in unique_groups}
box = plt.boxplot(data, tick_labels=neighbourhoods, patch_artist=True, showfliers=False)
for patch, group in zip(box['boxes'], neighbourhood_groups):
    patch.set_facecolor(colors_map.get(group, "gray"))
for median in box['medians']:
    median.set_color('black')
    median.set_linewidth(2)
handles = [mpatches.Patch(color=colors_map[group], label=group) for group in unique_groups]
plt.legend(handles=handles, title="Neighbourhood Group", bbox_to_anchor=(1.05, 1), loc='upper left')

plt.xlabel("Neighbourhood")
plt.ylabel("Prix")
plt.title("Distribution des prix par quartier (trié par médiane)")
plt.xticks(rotation=45, ha="right")
plt.grid(True, axis='y')

plt.savefig("boxplot_prix_par_quartier_trie.png", dpi=300, bbox_inches="tight")
plt.close()





df_bdx = df[df['neighbourhood_group_cleansed'] == "Bordeaux"]


if df_bdx.empty:
    print("Aucune donnée pour Bordeaux !")
else:

    neighbourhoods_info = df_bdx.groupby('neighbourhood_cleansed').first().reset_index()
    neighbourhoods_info = neighbourhoods_info.sort_values('host_location')


    neighbourhoods = neighbourhoods_info['neighbourhood_cleansed'].tolist()
    host_locations = neighbourhoods_info['neighbourhood_group_cleansed'].tolist()
    data = [df_bdx[df_bdx['neighbourhood_cleansed'] == n]['price'] for n in neighbourhoods]

    plt.figure(figsize=(12, 6))


    unique_locations = list(dict.fromkeys(host_locations))
    import itertools
    colors_cycle = itertools.cycle(plt.cm.tab20.colors)
    colors_map = {loc: next(colors_cycle) for loc in unique_locations}

    box = plt.boxplot(data, tick_labels=neighbourhoods, patch_artist=True, showfliers=False)

    for patch, loc in zip(box['boxes'], host_locations):
        patch.set_facecolor(colors_map[loc])

    for median in box['medians']:
        median.set_color('black')
        median.set_linewidth(2)

    plt.xlabel("Neighbourhood")
    plt.ylabel("Prix")
    plt.title("Distribution des prix par quartier à Bordeaux (couleur = host_location)")
    plt.xticks(rotation=45, ha="right")
    plt.grid(True, axis='y')


    import matplotlib.patches as mpatches
    handles = [mpatches.Patch(color=colors_map[loc], label=loc) for loc in unique_locations]
    plt.legend(handles=handles, title="Host Location", bbox_to_anchor=(1.05, 1), loc='upper left')

    plt.savefig("boxplot_prix_bordeaux.png", dpi=300, bbox_inches="tight")
    plt.close()

