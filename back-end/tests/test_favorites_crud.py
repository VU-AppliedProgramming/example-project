import pytest
import os
import json
from pathlib import Path
from typing import Any, Dict
from context import app, Feast_Finder, Recipe, check_recipe_fields
from flask.testing import FlaskClient

FAVORITE_RECIPES_ENDPOINT = "/feastFinder/recipes/favorites/"
CREATE_RECIPE_ENDPOINT = "/feastFinder/recipe/"

"""
Test suite for verifying custom recipe creation and modification functionalities.
"""

@pytest.fixture
def client_fixture():
    """
    Set up testing mode for the Flask app.
    """
    # prepare a temporary test file and a fresh instance of FavRecipes before each test
    test_file = "test_favrecipes.json"

    # remove any pre-existing test file so we start with a clean slate
    if os.path.exists(test_file):
        os.remove(test_file)

    # override the app's FavRecipes instance to use our test file
    app.feast_finder = Feast_Finder(test_file)

    # init the testing client
    app.config['TESTING'] = True
    client = app.test_client()

    yield client

    # clean up the temporary test file after each test
    if os.path.exists(test_file):
        os.remove(test_file)


def test_create_recipe_success(client_fixture):
    """
    Test that a new recipe is successfully added to the favorites list.
    It checks the count increment and verifies the stored details.
    """

    recipe = Recipe("Spaghetti Bolognese", "Boil pasta, cook sauce", "Pasta, Tomato, Beef", "http://example.com/image.jpg", id="4321")

    # check how many recipes we have before adding a new one
    response = client_fixture.get(FAVORITE_RECIPES_ENDPOINT)
    recipes_before: Dict[str, Any] = response.get_json()
    count_before: int = len(recipes_before)

    # send a request to create the new recipe
    response = client_fixture.post(
        "/feastFinder/recipe/", 
        json=recipe.__dict__,
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 201  # <- created
    response_data: Dict[str, Any] = response.get_json()
    assert response_data.get("message") == "Recipe added successfully with id 4321"  # <- confirm the message also

    # verify that the total recipe count increased by one
    response = client_fixture.get(FAVORITE_RECIPES_ENDPOINT)
    recipes_after: Dict[str, Any] = response.get_json()
    assert len(recipes_after) == count_before + 1

    assert "4321" in recipes_after

    # verify details of the newly added recipe
    recipe = recipes_after["4321"]
    assert recipe["instructions"] == "Boil pasta, cook sauce"
    assert recipe["ingredients"] == "Pasta, Tomato, Beef"
    assert recipe["image"] == "http://example.com/image.jpg"


def test_create_recipe_with_existing_list(client_fixture):
    """
    Test creating a new recipe when the favorites list is already populated.
    """
    recipe = Recipe("Chicken Curry", "Cook chicken with curry spices", "Chicken, Curry, Onion, Garlic", "http://example.com/chickencurry.jpg", id = "99")

    # FIX: Why aren't we using the save_recipe()?
    # write the pre-existing recipe to the file
    with open("test_favrecipes.json", "w") as file:
        json.dump({recipe.recipe_id : recipe.__dict__}, file, indent=4)
    
    # reload the recipes from the file
    app.feast_finder.load_recipes()

    # get the current recipe count (should be >= 1)
    response = client_fixture.get(FAVORITE_RECIPES_ENDPOINT)
    recipes_before: Dict[str, Any] = response.get_json()
    count_before: int = len(recipes_before)
    assert count_before >= 1

    new_recipe = Recipe("Vegan Salad", "Mix all greens and add dressing", "Lettuce, Spinach, Cucumber, Dressing", "http://example.com/vegansalad.jpg", id="9876")
    # send create request for the new recipe
    response = client_fixture.post(CREATE_RECIPE_ENDPOINT, 
                                   json=new_recipe.__dict__, 
                                   headers={'Content-Type': 'application/json'})
    
    assert response.status_code == 201  # <- created

    # confirm the count has incremented by one.
    response = client_fixture.get(FAVORITE_RECIPES_ENDPOINT)
    recipes_after: Dict[str, Any] = response.get_json()

    assert len(recipes_after) == count_before + 1
    
    assert "9876" in recipes_after


def test_create_duplicate_recipe(client_fixture):
    """
    Test that the API prevents the creation of duplicate recipes.
    """
    recipe_data: Dict[str, Any] = {
        'r_title': "Tiramisu",
        'r_instructions': "Mix ingredients, layer, chill",
        'r_ingredients': "Coffee, Mascarpone, Ladyfingers"
    }

    # create the recipe for the first time.
    response = client_fixture.post(CREATE_RECIPE_ENDPOINT, data=recipe_data)
    assert response.status_code == 201  # <- created

    # try to create the same recipe again (should fail).
    response_duplicate = client_fixture.post(CREATE_RECIPE_ENDPOINT, data=recipe_data)
    assert response_duplicate.status_code == 409  # <- should give conflict
    response_dup_data: Dict[str, Any] = response_duplicate.get_json()
    assert response_dup_data.get("error") == "Recipe with this title already exists"


def test_update_recipe_success(client_fixture):
    """
    Test successful update of an existing recipe's instructions.
    """
    # create a recipe to update later
    # recipe_data: Dict[str, Any] = {
    #     'r_title': "Pancakes",
    #     'r_instructions': "Mix flour, eggs, milk",
    #     'r_ingredients': "Flour, Eggs, Milk"
    # }
    recipe = Recipe("Pancakes", "Mix flour, eggs, milk", "Flour, Eggs, Milk")
    response = client_fixture.post(CREATE_RECIPE_ENDPOINT, 
                                   json=recipe.__dict__,
                                   headers={'Content-Type': 'application/json'}
                                   )
    assert response.status_code == 201  # <- created

    # update data for the recipe instructions
    update_data: Dict[str, Any] = {
        "r_title": "Pancakes",
        "r_instructions": "Mix flour, eggs, milk thoroughly and add vanilla extract"
    }
    update_response = client_fixture.put(FAVORITE_RECIPES_ENDPOINT, json=update_data)
    assert update_response.status_code == 200 # <- ok
    update_response_data: Dict[str, Any] = update_response.get_json()
    assert update_response_data.get("message") == "Recipe instructions updated successfully"

    # retrieve the updated recipe to confirm changes
    response = client_fixture.get("/favorites")
    recipes_after_update: Dict[str, Any] = response.get_json()
    assert "Pancakes" in recipes_after_update
    assert recipes_after_update["Pancakes"]["instructions"] == \
        "Mix flour, eggs, milk thoroughly and add vanilla extract"


def test_update_nonexistent_recipe(client_fixture):
    """
    Test that updating a recipe that does not exist returns an error.
    """
    update_data: Dict[str, Any] = {
        "r_title": "nonexistent recipe",
        "r_instructions": "New instructions that won't be applied"
    }
    update_response = client_fixture.put(FAVORITE_RECIPES_ENDPOINT, json=update_data)
    assert update_response.status_code == 404 # <- not found
    update_response_data: Dict[str, Any] = update_response.get_json()
    assert update_response_data.get("error") == "Recipe with this title does not exist"


def test_delete_recipe(client_fixture):
    """
    Test deleting an existing recipe from the favorites list.
    Verifies the correct status code, success message, and that the recipe is removed from /favorites.
    """

    recipe_data = {
        'r_title': "Test Delete",
        'r_instructions': "Instructions to be deleted",
        'r_ingredients': "Ingredients to be deleted"
    }
    response = client_fixture.post(CREATE_RECIPE_ENDPOINT, data=recipe_data)
    assert response.status_code == 201

    data = {'r_title': 'Test Delete'}
    del_response = client_fixture.delete(FAVORITE_RECIPES_ENDPOINT, json=data)
    assert del_response.status_code == 200
    assert del_response.get_json().get("message") == "Recipe deleted successfully"

    # confirm that it no longer appears in /favorites
    response_after_del = client_fixture.get(FAVORITE_RECIPES_ENDPOINT)
    recipes_after_del = response_after_del.get_json()
    assert "Test Delete" not in recipes_after_del


def test_delete_nonexistent_recipe(client_fixture):
    """
    Test that deleting a recipe that doesn't exist returns a 404 error.
    """
    data = {'r_title': 'Fake Recipe'}
    del_response = client_fixture.delete(FAVORITE_RECIPES_ENDPOINT, json=data)
    assert del_response.status_code == 404 # <- not found
    assert del_response.get_json().get("error") == "Recipe with this title does not exist"


def test_create_recipe_missing_title(client_fixture: FlaskClient) -> None:
    """
    Test that creating a recipe without the 'r_title' field 
    returns a 400 status code and an error message indicating
    the missing 'r_title' requirement.
    """
    incomplete_data: Dict[str, str] = {
        'r_instructions': "Some instructions",
        'r_ingredients': "Some ingredients"
        # 'r_title' is omitted here
    }
    response = client_fixture.post(CREATE_RECIPE_ENDPOINT, data=incomplete_data)
    assert response.status_code == 400
    assert "r_title is required" in response.get_json()["error"]


def test_create_recipe_missing_instructions(client_fixture: FlaskClient) -> None:
    """
    Test that creating a recipe without the 'r_instructions' field 
    returns a 400 status code and an error message indicating
    the missing 'r_instructions' requirement.
    """
    incomplete_data: Dict[str, str] = {
        'r_title': "No Instructions",
        'r_ingredients': "Some ingredients"
        # 'r_instructions' is omitted here
    }
    response = client_fixture.post(CREATE_RECIPE_ENDPOINT, data=incomplete_data)
    assert response.status_code == 400
    assert "r_instructions is required" in response.get_json()["error"]


def test_create_recipe_missing_ingredients(client_fixture: FlaskClient) -> None:
    """
    Test that creating a recipe without the 'r_ingredients' field 
    returns a 400 status code and an error message indicating
    the missing 'r_ingredients' requirement.
    """
    incomplete_data: Dict[str, str] = {
        'r_title': "No Ingredients",
        'r_instructions': "Some instructions"
        # 'r_ingredients' is omitted here
    }
    response = client_fixture.post(CREATE_RECIPE_ENDPOINT, data=incomplete_data)
    assert response.status_code == 400
    assert "r_ingredients is required" in response.get_json()["error"]

