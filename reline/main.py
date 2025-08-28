import os
import orjson
from reline import Pipeline
from pathlib import Path

current_dir = Path(__file__).parent.resolve()
file_path = current_dir / 'data.json'

try:
    with file_path.open('r', encoding='utf-8') as file:
        data = orjson.loads(file.read())
except UnicodeDecodeError as e:
    print(f"Failed to decode {file_path}: {e}")
    raise
except orjson.JSONDecodeError as e:
    print(f"Failed to parse JSON {file_path}: {e}")
    raise

def normalize_paths(obj):
    if isinstance(obj, dict):
        return {k: normalize_paths(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [normalize_paths(item) for item in obj]
    elif isinstance(obj, str):
        try:
            if os.path.exists(obj):
                return str(Path(obj).resolve())
        except UnicodeEncodeError:
            print(f"Failed encoding path: {obj}")
            return obj
    return obj

data = normalize_paths(data)

try:
    Pipeline.from_json(data).process_linear()
except Exception as e:
    print(f"Failed executing pipeline: {e}")
    raise