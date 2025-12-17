#!/usr/bin/env python3

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

import sys


arg = sys.argv[1]
data = pd.read_csv(arg)
no_licence = (data["license"] == 0).sum()
size = data.shape[0]
legal = size - no_licence 
no_licence_rate = no_licence / size
legal_rate = legal / size 


labels = ["Légal", "Supposé illégal"]
values = [legal_rate, no_licence_rate]

plt.bar(labels, values)
plt.ylabel("Valeurs en pourcentages")
plt.title("Répartition des annonces airBnb légal et supposé inégal")

plt.show()
