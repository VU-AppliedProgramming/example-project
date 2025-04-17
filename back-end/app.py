from flask import Flask, jsonify, request, Response
import os
import requests
from flask_cors import CORS
import re
from feast_finder import Feast_Finder, Recipe, check_recipe_fields
from typing import Union, Tuple, Optional, List
import random

try: 
    from BeautifulSoup import BeautifulSoup
except ImportError:
    from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

# Spoonacular API key
API_KEY = os.environ.get('API_KEY')
SPOONACULAR_API = "https://api.spoonacular.com/recipes/"

# Default storage file (only used if not overridden in testing)
app.feast_finder = Feast_Finder('myfavrecipes.json')
app.feast_finder.load_recipes()

@app.route('/health')
def health_check():
    """
    This endpoint checks if the back end server is running or not.
    Returns:
        Tuple[str, int]: A tuple containing a message indicating the server status and an HTTP status code.
    """

    return 'OK', 200

@app.route('/feastFinder/recipes/favorites/')
def get_favorite_recipes():
    """
    Endpoint to retrieve recipes from favorites.
    Returns:
        Response: JSON response containing the favorite recipes.
    """
        
    recipes = app.feast_finder.get_favorite_recipes()

    serialized_recipes = {recipe: recipes[recipe].__dict__ for recipe in recipes}
    return jsonify(serialized_recipes)

@app.route('/feastFinder/recipes/favorites/<recipe_id>')
def get_favorite_recipe_by_id(recipe_id: str) -> Response:
    """
    Endpoint to display information about a single favorite recipe based on its ID.
    Args:
        recipe_id (str): The ID of the recipe to retrieve.
    Returns:
        Response: JSON response containing information about the requested recipe.
    """
    favorite_recipes = app.feast_finder.get_favorite_recipes()

    if recipe_id in favorite_recipes:
        return jsonify({recipe_id: favorite_recipes[recipe_id].__dict__})
    else:
        return jsonify({"error": "Recipe not found"})
    
### CRUD OPERATIONS ###

@app.route('/feastFinder/recipes/favorites/add_to_favorites', methods=['POST'])
def add_to_favorites() -> Response:
    """
    Endpoint to add a recipe to the favorites.
    Returns:
        Response: JSON response indicating the success or failure of the operation.
    """

    recipe_title = request.form['recipe_title']
    recipe_instructions = request.form['recipe_instructions']
    recipe_ingredients = request.form['recipe_ingredients']
    recipe_image = request.form['recipe_image']
    recipe_id = request.form['recipe_id']

    recipe = Recipe(recipe_title, recipe_instructions, recipe_ingredients, recipe_image, id = recipe_id)
    success = app.feast_finder.add_recipe(recipe)

    if success:
        return jsonify({"message": "Recipe added to favorites successfully"})
    else:
        return jsonify({"error": "Failed to add recipe to favorites"})

@app.route('/feastFinder/recipe/', methods=['POST'])
def create_recipe() -> Response:
    """
    Endpoint to create a new recipe and add it to the favorites.
    Returns:
        Response: JSON response indicating the success or failure of the operation.
    """    
    check, msgs = check_recipe_fields(request.json)

    if check:
        recipe_id: str = app.feast_finder.get_id(request.json.get('recipe_id', None))

        recipe = Recipe(request.json['title'], request.json['instructions'], request.json['ingredients'], request.json.get('image', None), id=recipe_id)
        if app.feast_finder.add_recipe(recipe):
            return jsonify({"message": f"Recipe added successfully with id {recipe.recipe_id}"}), 201
        else:
            return jsonify({"error": "Recipe with this title already exists"}), 409
    else:
        return jsonify({"error": msgs}), 400

@app.route('/feastFinder/recipes/favorites/', methods=['DELETE'])
def delete_recipe() -> Response:
    """
    Endpoint to delete a recipe from the favorites list.
    Returns:
        Response: JSON response indicating the success or failure of the operation.
    """
    recipe_id = request.json['recipe_id']
    if app.feast_finder.delete_recipe(recipe_id):
        return jsonify({"message": "Recipe deleted successfully"}), 200

    return jsonify({"error": "Recipe with this title does not exist"}), 404

@app.route('/feastFinder/recipes/favorites/', methods=['PUT'])
def update_recipe() -> Response:
    """
    Endpoint to update the instructions of a recipe in the favorites.
    Returns:
        Response: JSON response indicating the success or failure of the operation.
    """
    recipe_id = request.json['recipe_id']
    new_instructions = request.json['instructions']

    if app.feast_finder.update_recipe(recipe_id, new_instructions):
        return jsonify({"message": "Recipe instructions updated successfully"}), 200

    return jsonify({"error": "Recipe with this title does not exist"}), 404

### END OF CRUD OPERATIONS ###

@app.route('/api/meals')
def get_meals() -> Union[dict, Response]:
    """
    Endpoint to retrieve meals based on query parameters.
    Returns:
        Union[dict, Response]: JSON response containing the meals or an error message.
    """

    query = request.args.get('query')
    min_calories = request.args.get('minCalories', type=int)
    max_calories = request.args.get('maxCalories', type=int)

    url = f'{SPOONACULAR_API}/complexSearch?query={query}&apiKey={API_KEY}'
    if min_calories is not None and max_calories is not None:
        url += f'&minCalories={min_calories}&maxCalories={max_calories}'

    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch meals'}), 500

    return response.json()

@app.route('/api/recipe/<int:meal_id>')
def get_recipe(meal_id: int) -> Union[dict, Response]:
    """
    Endpoint to retrieve a recipe by its ID.
    Args:
        meal_id (int): The ID of the recipe.
    Returns:
        Union[dict, Response]: JSON response containing the recipe or an error message.
    """

    url = f'{SPOONACULAR_API}/{meal_id}/information?apiKey={API_KEY}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch recipe'}), 500

    return response.json()

@app.route('/api/random')
def get_random_recipe() -> Union[dict, Response]:
    """
    Endpoint to retrieve a random recipe.
    Returns:
        Union[dict, Response]: JSON response containing the random recipe or an error message.
    """

    url = f'{SPOONACULAR_API}/random?apiKey={API_KEY}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch random recipe'}), 500

    data = response.json()
    return jsonify(data['recipes'][0])

@app.route('/api/price_breakdown_widget/<int:meal_id>')
def get_price_breakdown_widget(meal_id: int) -> Union[Response, tuple]:
    """
    Endpoint to retrieve the price breakdown widget for a specific meal.
    Args:
        meal_id (int): The ID of the meal.
    Returns:
        Union[Response, tuple]: Response object containing the image data or an error message.
    """

    url = f'{SPOONACULAR_API}/{meal_id}/priceBreakdownWidget.png?apiKey={API_KEY}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch price breakdown widget'}), 500

    return Response(response.content, content_type='image/png')

def clean_html_response(html: str) -> Tuple[Optional[List[str]], Optional[List[str]]]:
    """
    Helper function to clean HTML response and extract ingredients and prices.
    Args:
        input_string (str): The HTML string to be cleaned.
    Returns:
        Tuple[Optional[List[str]], Optional[List[str]]]: A tuple containing lists of ingredients and prices, or None if not found.
    """

    parsed_html = BeautifulSoup(html, "html.parser")

    ingredients_container = parsed_html.find('div', id='spoonacularPriceBreakdownTable') \
        .find('div', style=lambda value: value and 'float:left;max-width:80%' in value)
    ingredients = [ingredient.strip() for ingredient in ingredients_container.stripped_strings]

    prices_container = parsed_html.find('div', id='spoonacularPriceBreakdownTable') \
        .find('div', style=lambda value: value and 'text-align:right;display:inline-block;float:left;padding-left:1em' in value)
    prices = [price.strip() for price in prices_container.stripped_strings]

    return ingredients, prices

@app.route('/api/price_breakdown/<int:meal_id>')
def get_price_breakdown(meal_id: int) -> jsonify:
    """
    Fetches the price breakdown widget for a meal from Spoonacular API.

    Parameters:
        meal_id (int): The ID of the meal for which the price breakdown widget is requested.

    Returns:
        jsonify: JSON response containing the price breakdown widget information.
    """

    url = f'{SPOONACULAR_API}/{meal_id}/priceBreakdownWidget?apiKey={API_KEY}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch price breakdown widget'}), 500

    data = clean_html_response(response.text)
    return jsonify(data), 200, {'Content-Type': 'application/json; charset=utf-8'}

@app.route('/api/recipe/info/<int:meal_id>')
def get_recipe_info(meal_id: int) -> Union[dict, Response]:
    """
    Endpoint to retrieve a recipe by its ID.
    Args:
        meal_id (int): The ID of the recipe.
    Returns:
        Union[dict, Response]: JSON response containing the recipe or an error message.
    """
    
    url = f'{SPOONACULAR_API}/{meal_id}/information?apiKey={API_KEY}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch recipe'}), 500

    return response.json()

if __name__ == '__main__':
    app.run(debug=True, port = 5002)
