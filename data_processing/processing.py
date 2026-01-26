#!/usr/bin/env python3

import numpy as np
import pandas as pd
import json
import sys 




def nan_to_null(obj):

    if isinstance(obj, float) and pd.isna(obj):
        return None
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, dict):
        return {k: nan_to_null(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [nan_to_null(v) for v in obj]
    return obj

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


file = sys.argv[1]
df = pd.read_csv(file)

df['review_scores_rating'] = pd.to_numeric(df['review_scores_rating'], errors='coerce')
result = []
section_json = {}

for section_id, group in df.groupby('section_id'):
    avg_price = group['price'].mean()
    avg_rating = group['review_scores_rating'].mean()
    avg_price_per_bed = group['price_per_bed'].mean()
    price_count = group['price'].count()
    rating_count = group['review_scores_rating'].count()
    price_bed_count = group['price_per_bed'].count()
    section_json[section_id] = {
    "top_price_high": top_rows(group, "price", ascending=False) if pd.notna(avg_price) else [],
    "top_price_low": top_rows(group, "price", ascending=True) if pd.notna(avg_price) else [],
    "top_rating_high": top_rows(group, "review_scores_rating", ascending=False) if pd.notna(avg_rating) else [],
    "top_rating_low": top_rows(group, "review_scores_rating", ascending=True) if pd.notna(avg_rating) else [],
    "top_price_per_bed_high": top_rows(group, "price_per_bed", ascending=False) if pd.notna(avg_price_per_bed) else [],
    "top_price_per_bed_low": top_rows(group, "price_per_bed", ascending=True) if pd.notna(avg_price_per_bed) else [],
    "avg_price": round(avg_price, 2) if pd.notna(avg_price) else None,
    "avg_rating": round(avg_rating, 2) if pd.notna(avg_rating) else None,
    "avg_price_per_bed": round(avg_price_per_bed, 2) if pd.notna(avg_price_per_bed) else None,
    "num_price": price_count,
    "num_rating": rating_count,
    "num_price_per_bed": price_bed_count
    }


    result.append({
        "section_id": section_id,
        "avg_price": avg_price,
        "avg_rating": avg_rating,
        "avg_price_per_bed": avg_price_per_bed
    })
    
section_json = nan_to_null(section_json)
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



