#!/usr/bin/env python3
import pandas as pd
import numpy as np
import sys

#pip install pandas 
file =  sys.argv[1]
usecol = ['id','name','host_id','host_name','host_response_rate','host_is_superhost',\
              'latitude','longitude','property_type','room_type','bathrooms','bedrooms',\
                'price','minimum_nights','maximum_nights','availability_365','number_of_reviews',\
                    'review_scores_rating','review_scores_cleanliness','license']
data = pd.read_csv(file,sep=",",usecols= usecol)
filter = data[data["room_type"]!="Private room"].copy()
filter['license'] = filter['license'].notna().astype(int)
filter.to_csv('data/pre_'+file,index=False)