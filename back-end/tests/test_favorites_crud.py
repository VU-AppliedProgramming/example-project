import pytest
import os
import json
from pathlib import Path
from typing import Any, Dict
from context import app, Feast_Finder, Recipe, check_recipe_fields
from flask.testing import FlaskClient
from unittest.mock import patch, MagicMock

FAVORITE_RECIPES_ENDPOINT = "/feastFinder/recipes/favorites/"
CREATE_RECIPE_ENDPOINT = "/feastFinder/recipe/"

"""
Test suite for verifying custom recipe creation and modification functionalities.
"""


###############################################################################
#                                                                             #
#                   TESTING MODE FOR THE FLASK APP                            #
#                                                                             #
###############################################################################

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


###############################################################################
#                                                                             #
#                   RECIPE CREATION TESTS                                     #
#                                                                             #
###############################################################################


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

def test_create_duplicate_recipe(client_fixture: FlaskClient) -> None:
    """
    Test that the API prevents the creation of duplicate recipes with the same ID.
    
    Args:
        client_fixture: Flask test client
    """

    # first create a recipe with ID "7777"
    recipe = Recipe("Tiramisu", "Mix ingredients, layer, chill", "Coffee, Mascarpone, Ladyfingers", "http://example.com/image.jpg", id="7777")
    response = client_fixture.post(
        CREATE_RECIPE_ENDPOINT,
        json=recipe.__dict__,
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 201  # created

    # try to create another recipe with the same ID
    duplicate_recipe = Recipe("Different Recipe", "Different instructions", "Different ingredients", "http://example.com/diff.jpg", id="7777")
    response_duplicate = client_fixture.post(
        CREATE_RECIPE_ENDPOINT,
        json=duplicate_recipe.__dict__,
        headers={'Content-Type': 'application/json'}
    )
    
    response_data = response_duplicate.get_json()
    
    # either the status code should be 409 OR the message should indicate success with a new ID
    if response_duplicate.status_code == 201:
        assert "Recipe added successfully with id" in response_data.get("message")
        assert "7777" not in response_data.get("message")  # shouldn't use the duplicate ID
    else:
        assert response_duplicate.status_code == 409  # should be conflict
        assert "already exists" in response_data.get("error", "")


###############################################################################
#                                                                             #
#                   RECIPE UPDATE TESTS                                       #
#                                                                             #
###############################################################################


def test_update_recipe_success(client_fixture: FlaskClient) -> None:
    """
    Test successful update of an existing recipe's ingredients.
    
    Args:
        client_fixture: Flask test client
    """

    # create a recipe to update later
    recipe = Recipe("Pancakes", "Mix flour, eggs, milk", "Flour, Eggs, Milk", "http://example.com/pancakes.jpg", id="8888")
    response = client_fixture.post(
        CREATE_RECIPE_ENDPOINT,
        json=recipe.__dict__,
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 201  # created

    update_data: Dict[str, Any] = {
        "recipe_id": "8888",
        "instructions": "Mix flour, eggs, milk thoroughly and add vanilla extract"
    }
    update_response = client_fixture.put(FAVORITE_RECIPES_ENDPOINT, json=update_data)
    assert update_response.status_code == 200  # ok
    
    # get the updated recipe
    response = client_fixture.get(f"{FAVORITE_RECIPES_ENDPOINT}8888")
    recipe_after_update = response.get_json()
    
    #check that the recipe exists and was updated correctly
    assert "8888" in recipe_after_update
    assert recipe_after_update["8888"]["instructions"] == "Mix flour, eggs, milk thoroughly and add vanilla extract"


def test_update_nonexistent_recipe(client_fixture: FlaskClient) -> None:
    """
    Test that updating a recipe that does not exist returns an error.
    
    Args:
        client_fixture: Flask test client
    """

    update_data: Dict[str, Any] = {
        "recipe_id": "nonexistent_id",
        "instructions": "New instructions that won't be applied"
    }
    update_response = client_fixture.put(FAVORITE_RECIPES_ENDPOINT, json=update_data)
    assert update_response.status_code == 404  # not found
    update_response_data: Dict[str, Any] = update_response.get_json()
    assert update_response_data.get("error") == "Recipe with this title does not exist"



###############################################################################
#                                                                             #
#                   RECIPE DELETION TESTS                                     #
#                                                                             #
###############################################################################


def test_delete_recipe(client_fixture: FlaskClient) -> None:
    """
    Test deleting an existing recipe from the favorites list by ID.
    Verifies the correct status code, success message, and that the recipe is removed.
    
    Args:
        client_fixture: Flask test client
    """

    recipe = Recipe("Test Delete", "Instructions to be deleted", "Ingredients to be deleted", "http://example.com/delete.jpg", id="9999")

    response = client_fixture.post(
        CREATE_RECIPE_ENDPOINT,
        json=recipe.__dict__,
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 201  # created

    # delete the recipe by ID
    data = {'recipe_id': '9999'}
    del_response = client_fixture.delete(FAVORITE_RECIPES_ENDPOINT, json=data)
    assert del_response.status_code == 200  # ok
    assert del_response.get_json().get("message") == "Recipe deleted successfully"

    # confirm that it no longer appears in favorites
    response_after_del = client_fixture.get(FAVORITE_RECIPES_ENDPOINT)
    recipes_after_del = response_after_del.get_json()
    assert "9999" not in recipes_after_del


def test_delete_nonexistent_recipe(client_fixture: FlaskClient) -> None:
    """
    Test that deleting a recipe that doesn't exist returns a 404 error.
    
    Args:
        client_fixture: Flask test client
    """

    data = {'recipe_id': 'fake_recipe_id'}
    del_response = client_fixture.delete(FAVORITE_RECIPES_ENDPOINT, json=data)
    assert del_response.status_code == 404  # not found
    assert del_response.get_json().get("error") == "Recipe with this title does not exist"


###############################################################################
#                                                                             #
#                   MANDATORY FAVORITES RECIPE FIELDS TESTS                   #
#                                                                             #
###############################################################################


def test_create_recipe_missing_title(client_fixture: FlaskClient) -> None:
    """
    Test that creating a recipe without the 'title' field 
    returns a 400 status code and an error message indicating
    the missing 'title' requirement.
    
    Args:
        client_fixture: Flask test client
    """

    incomplete_data: Dict[str, str] = {
        'instructions': "Some instructions",
        'ingredients': "Some ingredients"
        # 'title' is missing here
    }
    response = client_fixture.post(
        CREATE_RECIPE_ENDPOINT,
        json=incomplete_data,
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 400  # bad request
    response_data: Dict[str, Any] = response.get_json()
    assert "title is required" in response_data.get("error")


def test_create_recipe_missing_instructions(client_fixture: FlaskClient) -> None:
    """
    Test that creating a recipe without the 'instructions' field 
    returns a 400 status code and an error message indicating
    the missing 'instructions' requirement.
    
    Args:
        client_fixture: Flask test client
    """

    incomplete_data: Dict[str, str] = {
        'title': "No Instructions",
        'ingredients': "Some ingredients"
        # 'instructions' is missing here
    }
    response = client_fixture.post(
        CREATE_RECIPE_ENDPOINT,
        json=incomplete_data,
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 400  # bad request
    response_data: Dict[str, Any] = response.get_json()
    assert "instructions is required" in response_data.get("error")


def test_create_recipe_missing_ingredients(client_fixture: FlaskClient) -> None:
    """
    Test that creating a recipe without the 'ingredients' field 
    returns a 400 status code and an error message indicating
    the missing 'ingredients' requirement.
    
    Args:
        client_fixture: Flask test client
    """

    incomplete_data: Dict[str, str] = {
        'title': "No Ingredients",
        'instructions': "Some instructions"
        # 'ingredients' is missing here
    }
    response = client_fixture.post(
        CREATE_RECIPE_ENDPOINT,
        json=incomplete_data,
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 400  # bad request
    response_data: Dict[str, Any] = response.get_json()
    assert "ingredients is required" in response_data.get("error")


###############################################################################
#                                                                             #
#                   RECIPE SEARCH TESTS IN GENERAL/FAVORITES                  #
#                                                                             #
###############################################################################


def make_sample_recipes(client_fixture: FlaskClient) -> None:
    """
    Helper function to make a few sample recipes for testing.
    
    Args:
        client_fixture: Flask test client
    """

    recipes = [
        Recipe("Pasta Carbonara", "Cook pasta, mix with eggs and cheese", "Pasta, Eggs, Cheese, Bacon", "http://example.com/carbonara.jpg", id="1001"),
        Recipe("Chicken Pasta", "Cook chicken and pasta, mix together", "Chicken, Pasta, Sauce", "http://example.com/chickenpasta.jpg", id="1002"),
        Recipe("Vegetable Soup", "Chop vegetables, add to pot with broth", "Carrots, Celery, Onion, Broth", "http://example.com/soup.jpg", id="1003"),
        Recipe("Chocolate Cake", "Mix ingredients, bake at 350F", "Flour, Sugar, Cocoa, Eggs", "http://example.com/cake.jpg", id="1004")
    ]
    
    for recipe in recipes:
        client_fixture.post(
            "/feastFinder/recipe/",
            json=recipe.__dict__,
            headers={'Content-Type': 'application/json'}
        )


@patch('requests.get')
def test_get_meals_search(mock_get, client_fixture: FlaskClient) -> None:
    """
    Test the general search endpoint with mocked Spoonacular API response.
    
    Args:
        mock_get: Mocked requests.get function
        client_fixture: Flask test client
    """

    # mock the API response
    mock_response = MagicMock()
    mock_response.status_code = 200 # ok

    mock_response.json.return_value = {
        "results": [
            {
                "id": 123456,
                "title": "Spaghetti Bolognese",
                "image": "http://example.com/spaghetti.jpg"
            },
            {
                "id": 654321,
                "title": "Pasta Primavera",
                "image": "http://example.com/primavera.jpg"
            }
        ],
        "totalResults": 2
    }

    mock_get.return_value = mock_response
    
    # test the endpoint
    response = client_fixture.get('/api/meals?query=pasta&minCalories=100&maxCalories=500')
    
    # check the response
    assert response.status_code == 200 # ok
    data = response.get_json()
    
    # check if we actually retrieved the recipes
    assert "results" in data
    assert len(data["results"]) == 2
    
    # check first recipe details
    first_recipe = data["results"][0]
    assert first_recipe["id"] == 123456
    assert first_recipe["title"] == "Spaghetti Bolognese"
    assert first_recipe["image"] == "http://example.com/spaghetti.jpg"
    
    # check second recipe details
    second_recipe = data["results"][1]
    assert second_recipe["id"] == 654321
    assert second_recipe["title"] == "Pasta Primavera"
    assert second_recipe["image"] == "http://example.com/primavera.jpg"
    
    # confirm that totalResults matches expected value (2)
    assert data["totalResults"] == 2
    
    # check that the mock was called with the correct URL components
    mock_get.assert_called_once()
    call_args = mock_get.call_args[0][0]
    
    # some extra check to make sure all params are there
    assert 'api.spoonacular.com/recipes' in call_args
    assert 'complexSearch' in call_args
    assert 'query=pasta' in call_args
    assert 'apiKey=' in call_args
    assert 'minCalories=100' in call_args
    assert 'maxCalories=500' in call_args


@patch('requests.get')
def test_get_meals_search_api_error(mock_get, client_fixture: FlaskClient) -> None:
    """
    Test the search endpoint handling API errors.
    
    Args:
        mock_get: Mocked requests.get function
        client_fixture: Flask test client
    """

    # mock an API error
    mock_response = MagicMock()
    mock_response.status_code = 500 # server error
    mock_get.return_value = mock_response
    
    # test the endpoint
    response = client_fixture.get('/api/meals?query=pasta')
    
    # check the response
    assert response.status_code == 500 # server error
    
    data = response.get_json()
    
    assert "error" in data
    assert data["error"] == "Failed to fetch meals"
    
    # check that the mock was called correctly
    mock_get.assert_called_once()
    call_args = mock_get.call_args[0][0]
    assert 'complexSearch?query=pasta' in call_args


def test_search_favorite_recipes(client_fixture: FlaskClient) -> None:
    """
    Test searching for recipes within favorites based on query terms.
    
    Args:
        client_fixture: Flask test client
    """

    # create sample recipes
    make_sample_recipes(client_fixture)
    
    # test searching for pasta related recipes
    response = client_fixture.get('/feastFinder/recipes/favorites/search?query=pasta')
    
    assert response.status_code == 200 # ok
    data = response.get_json()
    
    # should find our two pasta recipes
    assert len(data) == 2
    recipe_titles = [data[recipe_id]["title"] for recipe_id in data]
    assert "Pasta Carbonara" in recipe_titles
    assert "Chicken Pasta" in recipe_titles
    
    # search for chocolate (should find only the cake)
    response = client_fixture.get('/feastFinder/recipes/favorites/search?query=chocolate')
    
    assert response.status_code == 200 # ok
    data = response.get_json()
    
    # some extra checks
    assert len(data) == 1
    recipe_id = list(data.keys())[0]
    assert data[recipe_id]["title"] == "Chocolate Cake"
    
    # search with no results
    response = client_fixture.get('/feastFinder/recipes/favorites/search?query=burger')
    
    assert response.status_code == 200 # ok
    data = response.get_json()
    assert len(data) == 0



###############################################################################
#                                                                             #
#                   PRICE BREAKDOWN WIDGET TESTS                              #
#                                                                             #
###############################################################################


@patch('requests.get')
def test_get_price_breakdown(mock_get, client_fixture: FlaskClient) -> None:
    """
    Test the price breakdown endpoint with a mocked Spoonacular API response.
    
    Args:
        mock_get: Mocked requests.get function
        client_fixture: Flask test client
    """

    # mock the API response
    mock_response = MagicMock()
    mock_response.status_code = 200

    mock_response.text = """
    <div id="spoonacularPriceBreakdownTable">
        <div style="float:left;max-width:80%">
            <span>Pasta</span>
            <span>Tomato Sauce</span>
            <span>Ground Beef</span>
        </div>
        <div style="text-align:right;display:inline-block;float:left;padding-left:1em">
            <span>$1.20</span>
            <span>$0.80</span>
            <span>$3.50</span>
        </div>
    </div>
    """

    mock_get.return_value = mock_response
    
    # test the endpoint
    response = client_fixture.get('/api/price_breakdown/123456')
    
    # check the response
    assert response.status_code == 200 # ok
    data = response.get_json()
    
    # should be a tuple of ingredients and prices
    assert len(data) == 2
    ingredients, prices = data
    
    # extra checks
    assert len(ingredients) == 3
    assert "Pasta" in ingredients
    assert "Tomato Sauce" in ingredients
    assert "Ground Beef" in ingredients
    
    assert len(prices) == 3
    assert "$1.20" in prices
    assert "$0.80" in prices
    assert "$3.50" in prices
    
    # check that the mock was called with the correct URL
    mock_get.assert_called_once()
    call_args = mock_get.call_args[0][0]
    assert '123456/priceBreakdownWidget' in call_args


@patch('requests.get')
def test_get_price_breakdown_api_error(mock_get, client_fixture: FlaskClient) -> None:
    """
    Test the price breakdown endpoint handling API errors.
    
    Args:
        mock_get: Mocked requests.get function
        client_fixture: Flask test client
    """

    # mock an API error
    mock_response = MagicMock()
    mock_response.status_code = 500 # server error
    mock_get.return_value = mock_response
    
    # test the endpoint
    response = client_fixture.get('/api/price_breakdown/123456')
    
    # check the response status code
    assert response.status_code == 500 # server error
    
    data = response.get_json()
    
    assert "error" in data
    assert data["error"] == "Failed to fetch price breakdown widget"
    
    # check that the mock was called with the correct URL
    mock_get.assert_called_once()
    call_args = mock_get.call_args[0][0]
    assert '123456/priceBreakdownWidget' in call_args
    assert 'apiKey=' in call_args