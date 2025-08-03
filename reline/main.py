import os
from reline import Pipeline
import json

current_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(current_dir, 'data.json')


with open(file_path, 'r') as file:
    data = json.load(file)

Pipeline.from_json(data).process_linear()