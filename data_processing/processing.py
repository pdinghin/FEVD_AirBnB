#!/usr/bin/env python3


import pandas as pd
import json
import sys 

file = sys.argv[1]
usecols = ['id','price','review_scores_rating','section_id']
df = pd.read_csv(file, usecols=usecols)

df['price'] = (
    df['price']
    .astype(str)                   
    .str.replace('€', '', regex=False)
    .str.replace('$', '', regex=False)
    .str.replace(',', '.', regex=False)
    .str.strip()                   
)

df['price'] = pd.to_numeric(df['price'], errors='coerce')
df['review_scores_rating'] = pd.to_numeric(df['review_scores_rating'], errors='coerce')

def top_ids(group, column, ascending=False):
    ids = group.sort_values(column, ascending=ascending)['id'].dropna().tolist()
    return ids[:5]


result = []
section_json = {}

for section_id, group in df.groupby('section_id'):
    avg_price = group['price'].mean()
    avg_rating = group['review_scores_rating'].mean()

    section_json[section_id] = {
        "top_price_high": top_ids(group, "price", ascending=False),
        "top_price_low": top_ids(group, "price", ascending=True),
        "top_rating_high": top_ids(group, "review_scores_rating", ascending=False),
        "top_rating_low": top_ids(group, "review_scores_rating", ascending=True),
        "avg_price": round(avg_price, 2) if pd.notna(avg_price) else None,
        "avg_rating": round(avg_rating, 2) if pd.notna(avg_rating) else None
    }

    result.append({
        "section_id": section_id,
        "avg_price": avg_price,
        "avg_rating": avg_rating
    })

with open("../data/bordeaux_final_process.json", "w", encoding="utf-8") as f:
    json.dump(section_json, f, ensure_ascii=False, indent=4)

avg_df = pd.DataFrame(result)

percentiles = [i / 7 for i in range(7)] + [0.95]

global_stats = {
    "price": (
        avg_df['avg_price']
        .dropna()
        .quantile(percentiles)
        .round(2)
        .tolist()
    ),
    "rating": (
        avg_df['avg_rating']
        .dropna()
        .quantile(percentiles)
        .round(2)
        .tolist()
    )
}

with open("../data/global_stats.json", "w", encoding="utf-8") as f:
    json.dump(global_stats, f, ensure_ascii=False, indent=4)



