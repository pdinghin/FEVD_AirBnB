#!/usr/bin/env python3


import pandas as pd
import json
import sys 



file = sys.argv[1]
df = pd.read_csv(file)

df['price'] = (
    df['price']
    .astype(str)                   
    .str.replace('€', '', regex=False)
    .str.replace('$', '', regex=False)
    .str.replace(',', '.', regex=False)
    .str.strip()                   
)

df['price'] = pd.to_numeric(df['price'], errors='coerce')
df['price_per_bed'] = df['price'].div(df['beds'].replace(0, pd.NA))

df['review_scores_rating'] = pd.to_numeric(df['review_scores_rating'], errors='coerce')

def top_ids(group, column, ascending=False):
    ids = group.sort_values(column, ascending=ascending)['id'].dropna().tolist()
    return ids[:5]

def top_rows(group, column, ascending=False):
    return (
        group
        .dropna(subset=[column]) 
        .sort_values(column, ascending=ascending)
        .head(5)
        .to_dict(orient="records")
    )

result = []
section_json = {}

for section_id, group in df.groupby('section_id'):
    avg_price = group['price'].mean()
    avg_rating = group['review_scores_rating'].mean()
    avg_price_per_bed = group['price_per_bed'].mean()

    section_json[section_id] = {
    "top_price_high": top_rows(group, "price", ascending=False) if pd.notna(avg_price) else [],
    "top_price_low": top_rows(group, "price", ascending=True) if pd.notna(avg_price) else [],
    "top_rating_high": top_rows(group, "review_scores_rating", ascending=False) if pd.notna(avg_rating) else [],
    "top_rating_low": top_rows(group, "review_scores_rating", ascending=True) if pd.notna(avg_rating) else [],
    "top_price_per_bed_high": top_rows(group, "price_per_bed", ascending=False) if pd.notna(avg_price_per_bed) else [],
    "top_price_per_bed_low": top_rows(group, "price_per_bed", ascending=True) if pd.notna(avg_price_per_bed) else [],
    "avg_price": round(avg_price, 2) if pd.notna(avg_price) else None,
    "avg_rating": round(avg_rating, 2) if pd.notna(avg_rating) else None,
    "avg_price_per_bed": round(avg_price_per_bed, 2) if pd.notna(avg_price_per_bed) else None
    }


    result.append({
        "section_id": section_id,
        "avg_price": avg_price,
        "avg_rating": avg_rating,
        "avg_price_per_bed": avg_price_per_bed
    })

with open("data/bordeaux_final_process.json", "w", encoding="utf-8") as f:
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
    ),
    "price_per_bed": (
        avg_df['avg_price_per_bed']
        .dropna()
        .quantile(percentiles)
        .round(2)
        .tolist()
    )
}

with open("data/global_stats.json", "w", encoding="utf-8") as f:
    json.dump(global_stats, f, ensure_ascii=False, indent=4)



