#!/bin/bash

ENV_NAME="fouille_env"
PYTHON_VERSION="3"
python$PYTHON_VERSION -m venv $ENV_NAME
source $ENV_NAME/bin/activate

pip install numpy pandas geopandas matplotlib
pip install scikit-learn seaborn