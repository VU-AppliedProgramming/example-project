import json
import os
import pytest
from favrecipes import Recipe, FavRecipes

@pytest.fixture
def temp_file(tmp_path):
    """
    Fixture to create a temporary file path for storing recipes.
    
    Ensures a clean state by deleting the file if it already exists.
    
    Returns:
        str: Path to the temporary JSON file.
    """

    # temporary file path for the recipes JSON
    file_path = tmp_path / "recipes.json"
    if file_path.exists():
        file_path.unlink()
    return str(file_path)

@pytest.fixture
def fav_recipes(temp_file):
    """
    Fixture to create a fresh instance of FavRecipes using a temporary file.
    
    Args:
        temp_file (str): Path to the temporary recipes JSON file.
    
    Returns:
        FavRecipes: An instance initialized with the temporary file.
    """

    return FavRecipes(temp_file)

@pytest.fixture
def sample_recipe():
    """
    Fixture to create a sample Recipe instance for use in tests.
    
    Returns:
        Recipe: A sample pancake recipe.
    """

    # sample Recipe instance for testing
    return Recipe(
        title="Pancakes",
        id=1,
        instructions="Mix ingredients and cook in a pan.",
        ingredients="Flour, Eggs, Milk, Sugar",
        image="http://example.com/pancakes.jpg"
    )

def test_add_recipe(fav_recipes, sample_recipe):
    """
    Test that a recipe is successfully added to the favorites.

    Verifies:
    - `add_recipe` returns True.
    - The recipe appears in the stored recipes.
    - The recipe data is correctly stored.
    """

    result = fav_recipes.add_recipe(sample_recipe)
    assert result is True
    recipes = fav_recipes.get_recipes()
    assert sample_recipe.title in recipes
    assert recipes[sample_recipe.title]["recipe_id"] == sample_recipe.id

def test_add_duplicate_recipe(fav_recipes, sample_recipe):
    """
    Test that adding a duplicate recipe (same title) fails.

    Verifies:
    - The first addition returns True.
    - The second addition returns False.
    """

    # add the same recipe twice
    result1 = fav_recipes.add_recipe(sample_recipe)
    result2 = fav_recipes.add_recipe(sample_recipe)
    assert result1 is True

    # second addition should fail due to duplicate title
    assert result2 is False

def test_delete_recipe(fav_recipes, sample_recipe):
    """
    Test deleting a recipe from the favorites.

    Verifies:
    - Recipe is successfully deleted after being added.
    - It no longer appears in the stored recipes.
    """

    # add and then delete a recipe
    fav_recipes.add_recipe(sample_recipe)
    result = fav_recipes.delete_recipe(sample_recipe)
    assert result is True

    recipes = fav_recipes.get_recipes()
    assert sample_recipe.title not in recipes

def test_delete_nonexistent_recipe(fav_recipes, sample_recipe):
    """
    Test deleting a recipe that does not exist.

    Verifies:
    - `delete_recipe` returns False for non-existent entries.
    """

    result = fav_recipes.delete_recipe(sample_recipe)
    assert result is False

def test_update_recipe(fav_recipes, sample_recipe):
    """
    Test updating the ingredients of an existing recipe.

    Verifies:
    - `update_recipe` returns True for a valid update.
    - Ingredients are updated in the stored recipes.
    """

    fav_recipes.add_recipe(sample_recipe)
    new_ingredients = "Flour, Eggs, Milk, Sugar, Vanilla"
    result = fav_recipes.update_recipe(sample_recipe, new_ingredients)
    assert result is True
    recipes = fav_recipes.get_recipes()
    assert recipes[sample_recipe.title]["ingredients"] == new_ingredients

def test_update_nonexistent_recipe(fav_recipes, sample_recipe):
    """
    Test updating a recipe that does not exist.

    Verifies:
    - `update_recipe` returns False when the recipe is not in the store.
    """

    result = fav_recipes.update_recipe(sample_recipe, "New Ingredients")
    assert result is False

def test_persistence(temp_file, sample_recipe):
    """
    Test persistence of recipes through file I/O.

    Verifies:
    - A recipe added by one instance of FavRecipes is persisted to disk.
    - A new instance reading from the same file sees the saved recipe.
    - The JSON file is correctly formatted and contains the expected entry.
    """

    # check that after adding a recipe and creating a new FavRecipes instance the recipe persists via the JSON file
    fav1 = FavRecipes(temp_file)
    fav1.add_recipe(sample_recipe)
    
    # create a new instance to force reloading from file
    fav2 = FavRecipes(temp_file)
    recipes = fav2.get_recipes()
    assert sample_recipe.title in recipes

    # check that the saved JSON file is properly formatted
    with open(temp_file, 'r') as f:
        data = json.load(f)
    assert sample_recipe.title in data
