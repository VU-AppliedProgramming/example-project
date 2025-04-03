import json
import pytest
import requests
from app import app
from favrecipes import FavRecipes, Recipe

# dummy response class to simulate external API calls
class DummyResponse:
    def __init__(self, json_data=None, status_code=200, content=b"", text=""):
        """
        A mock response to simulate 'requests.get' in tests.
        
        :param json_data: JSON data to return on .json()
        :param status_code: HTTP status code to mimic
        :param content: Binary content (used for image data)
        :param text: Text content (used for HTML or plain text)
        """
        self._json_data = json_data
        self.status_code = status_code
        self.content = content
        self.text = text

    def json(self):
        return self._json_data

@pytest.fixture
def client(tmp_path):
    """
    A pytest fixture that provides a Flask test client with a new FavRecipes instance.
    
    :param tmp_path: A pytest-provided temporary directory path
    :return: A Flask test client configured for testing
    """
    test_file = tmp_path / "test_recipes.json"
    app.fav_recipes = FavRecipes(str(test_file))  # each test uses a new file
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

# --------------------- Internal Endpoints (CRUD) Tests --------------------- #

def test_health_check(client):
    """
    Test the /health endpoint to verify that the server is running.

    - The response status code should be 200.
    - The response data should be "OK".
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.data.decode("utf-8") == "OK"


def test_test_endpoint(client):
    """
    Test the /test endpoint to verify that it returns a JSON object.

    - The response status code should be 200.
    - The returned data should be a dictionary (JSON object).
    """
    response = client.get("/test")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, dict)


def test_add_to_favorites(client):
    """
    Test the /add_to_favorites endpoint for successfully adding a recipe.

    - The response status code should be 200.
    - The response should contain a "message" key indicating success.
    """
    form_data = {
        "recipe_title": "TestRecipeUnique1",
        "recipe_instructions": "Test instructions for unique1",
        "recipe_ingredients": "ingredient1, ingredient2",
        "recipe_image": "http://example.com/unique1.jpg",
        "recipe_id": "123"
    }
    response = client.post("/add_to_favorites", data=form_data)
    json_data = response.get_json()
    assert response.status_code == 200
    assert "message" in json_data


def test_show_one_favorite(client):
    """
    Test the /show_one_favorite/<recipe_id> endpoint to retrieve a specific favorite recipe.

    - Adds a recipe using /add_to_favorites with a unique title.
    - Sends a GET request to /show_one_favorite/<title>.
    - Expects the response to have a 200 status and the recipe data.
    """
    unique_title = "TestRecipeUnique2"
    form_data = {
        "recipe_title": unique_title,
        "recipe_instructions": "Test instructions for unique2",
        "recipe_ingredients": "ingredient1, ingredient2",
        "recipe_image": "http://example.com/unique2.jpg",
        "recipe_id": "234"
    }
    # add to favorites
    client.post("/add_to_favorites", data=form_data)

    # retrieve it
    response = client.get(f"/show_one_favorite/{unique_title}")
    assert response.status_code == 200
    data = response.get_json()
    # the JSON should include the key "TestRecipeUnique2" with its details
    assert unique_title in data


def test_create_recipe(client):
    """
    Test the /create_recipe endpoint for creating a new recipe.

    - First creation with a unique title should return status 201 and a success message.
    - Trying to create the same recipe again should return 409 and an error.
    """
    form_data = {
        "r_title": "CreateTestUnique3",
        "r_instructions": "Instructions for unique3",
        "r_ingredients": "ingredientA, ingredientB",
        "r_image": "http://example.com/unique3.jpg",
        "r_id": "456"
    }
    # first creation
    response = client.post("/create_recipe", data=form_data)
    assert response.status_code == 201  # expecting "Created"
    data = response.get_json()
    assert "message" in data

    # duplicate creation should fail with 409
    response = client.post("/create_recipe", data=form_data)
    assert response.status_code == 409
    data = response.get_json()
    assert "error" in data


def test_delete_recipe(client):
    """
    Test the /delete_recipe endpoint for deleting a recipe.

    - First deletion of the recipe should return status 200 with a success message.
    - Trying to delete the same recipe again should return 404 with an error.
    """
    form_data = {
        "r_title": "DeleteTestUnique4",
        "r_instructions": "Instructions for unique4",
        "r_ingredients": "ingredientX, ingredientY",
        "r_image": "http://example.com/unique4.jpg",
        "r_id": "789"
    }
    # create it
    client.post("/create_recipe", data=form_data)

    # delete it
    response = client.delete("/delete_recipe", json={"r_title": "DeleteTestUnique4"})
    assert response.status_code == 200
    data = response.get_json()
    assert "message" in data

    # trying to delete again should fail
    response = client.delete("/delete_recipe", json={"r_title": "DeleteTestUnique4"})
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data


def test_update_recipe(client):
    """
    Test the /update_recipe_instructions endpoint for updating a recipe's instructions.

    - First creation of a recipe with a unique title.
    - Then update its instructions, expecting a 200 status and success message.
    - Attempting to update a nonexistent recipe should return 404.
    """
    form_data = {
        "r_title": "UpdateTestUnique5",
        "r_instructions": "Old instructions for unique5",
        "r_ingredients": "ingredientM, ingredientN",
        "r_image": "http://example.com/unique5.jpg",
        "r_id": "321"
    }
    # create
    client.post("/create_recipe", data=form_data)

    # update the instructions
    update_data = {"r_title": "UpdateTestUnique5", "r_instructions": "New instructions for unique5"}
    response = client.put("/update_recipe_instructions", json=update_data)
    assert response.status_code == 200
    data = response.get_json()
    assert "message" in data

    # try to update a nonexistent recipe
    response = client.put("/update_recipe_instructions", json={"r_title": "Nonexistent", "r_instructions": "Test"})
    assert response.status_code == 404

# --------------------- External API Tests via monkeypatch --------------------- #

def test_get_meals(client, monkeypatch):
    """
    Test that the /api/meals endpoint returns a valid meal list for a query, using mocked requests.
    """
    def dummy_get(url, *args, **kwargs):
        if "complexSearch" in url:
            return DummyResponse(json_data={"results": [{"id": 1, "title": "Meal1"}]}, status_code=200)
        return DummyResponse(status_code=404)
    
    monkeypatch.setattr(requests, "get", dummy_get)
    response = client.get("/api/meals?query=pasta")
    data = response.get_json()
    assert response.status_code == 200
    assert "results" in data


def test_get_recipe(monkeypatch, client):
    """
    Test that the /api/recipe/<id> endpoint returns the correct recipe details, using mocked requests.
    """
    def dummy_get(url, *args, **kwargs):
        if "information" in url:
            return DummyResponse(json_data={"id": 1, "title": "Fake Recipe"}, status_code=200)
        return DummyResponse(status_code=404)
    
    monkeypatch.setattr(requests, "get", dummy_get)
    response = client.get("/api/recipe/1")
    data = response.get_json()
    assert response.status_code == 200
    assert data.get("title") == "Fake Recipe"


def test_get_random_recipe(monkeypatch, client):
    """
    Test that the /api/random endpoint returns a random recipe, using mocked requests.
    """
    def dummy_get(url, *args, **kwargs):
        if "random" in url:
            return DummyResponse(json_data={"recipes": [{"id": 2, "title": "Random Recipe"}]}, status_code=200)
        return DummyResponse(status_code=404)
    
    monkeypatch.setattr(requests, "get", dummy_get)
    response = client.get("/api/random")
    data = response.get_json()
    assert response.status_code == 200
    assert data.get("title") == "Random Recipe"


def test_price_breakdown_widget(monkeypatch, client):
    """
    Test that the /api/price_breakdown_widget/<meal_id> endpoint returns correct image data, using mocked requests.
    """
    def dummy_get(url, *args, **kwargs):
        if "priceBreakdownWidget.png" in url:
            return DummyResponse(status_code=200, content=b"fake_image_data")
        return DummyResponse(status_code=404)
    
    monkeypatch.setattr(requests, "get", dummy_get)
    response = client.get("/api/price_breakdown_widget/1")
    assert response.status_code == 200
    assert response.data == b"fake_image_data"


def test_price_breakdown(monkeypatch, client):
    """
    Test that the /api/price_breakdown/<meal_id> endpoint parses HTML to extract ingredients and prices, using mocked requests.
    """
    fake_html = """
        <div id="spoonacularPriceBreakdownTable">
            <div style="float:left;max-width:80%">ingredient1 ingredient2</div>
            <div style="text-align:right;display:inline-block;float:left;padding-left:1em">price1 price2</div>
        </div>
    """

    def dummy_get(url, *args, **kwargs):
        if "priceBreakdownWidget" in url:
            return DummyResponse(status_code=200, text=fake_html)
        return DummyResponse(status_code=404)
    
    monkeypatch.setattr(requests, "get", dummy_get)
    response = client.get("/api/price_breakdown/1")
    assert response.status_code == 200
    data = response.get_json()
    ingredients, prices = data
    assert isinstance(ingredients, list)
    assert isinstance(prices, list)
    
    # check that the dummy HTML data was parsed correctly
    assert "ingredient1" in ingredients[0]
    assert "price1" in prices[0]


def test_get_recipe_info(monkeypatch, client):
    """
    Test that the /api/recipe/info/<meal_id> endpoint returns correct recipe info, using mocked requests.
    """
    def dummy_get(url, *args, **kwargs):
        if "information" in url:
            return DummyResponse(json_data={"id": 1, "title": "Info Recipe"}, status_code=200)
        return DummyResponse(status_code=404)
    
    monkeypatch.setattr(requests, "get", dummy_get)
    response = client.get("/api/recipe/info/1")
    data = response.get_json()
    assert response.status_code == 200
    assert data.get("title") == "Info Recipe"
