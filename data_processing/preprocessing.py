#!/usr/bin/env python3
import pandas as pd
import numpy as np
import sys

import json
from shapely.geometry import shape, Point


csv_file =  sys.argv[1]

geojson_file = "../epci-243300316-sections.json"  

usecol = [
    'id','name','host_id','host_name','host_response_rate','host_is_superhost',
    'latitude','longitude','property_type','room_type','bathrooms','bedrooms',
    'price','minimum_nights','maximum_nights','number_of_reviews',
    'review_scores_rating','review_scores_cleanliness','license'
]


data = pd.read_csv(csv_file, sep=",", usecols=usecol)

with open(geojson_file, "r", encoding="utf-8") as f:
    geojson = json.load(f)


polygons = []
for feature in geojson["features"]:
    geom = shape(feature["geometry"])     
    prop_id = feature["properties"]["id"]
    polygons.append((geom, prop_id))

def find_properties_id(row):
    point = Point(row["longitude"], row["latitude"])

    for polygon, prop_id in polygons:
        if polygon.contains(point):
            return prop_id

    return None 


data["properties_id"] = data.apply(find_properties_id, axis=1)

data.to_csv("../data/data_with_properties_id.csv", index=False)
