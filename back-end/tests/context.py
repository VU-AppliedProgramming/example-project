import sys
from pathlib import Path

# Add the root directory to the Python path
root_dir = str(Path(__file__).parent.parent)
sys.path.append(root_dir)

try:
    from app import app
    # from favorite_recipe import Favorite_Recipe, Feast_Finder
    from feast_finder import Feast_Finder, Recipe, check_recipe_fields
except ImportError as e:
    print(f"Error importing modules: {e}")
    print(f"Current sys.path: {sys.path}")
    raise