from flask import Flask, jsonify, request,Response
import os
import requests
from flask_cors import CORS
import re
from favrecipes import FavRecipes, Recipe
from typing import Union, Tuple, Optional, List
try: 
    from BeautifulSoup import BeautifulSoup
except ImportError:
    from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

# Spoonacular API key
API_KEY = os.environ.get('API_KEY')

SPOONACULAR_API = "https://api.spoonacular.com/recipes/"

fav_recipes = FavRecipes('myfavrecipes.json')

@app.route('/health')
def health_check():
    """
    This endpoint checks if the back end server is running or not.
    Returns:
        Tuple[str, int]: A tuple containing a message indicating the server status and an HTTP status code.
    """

    return 'OK', 200

@app.route('/test')
def test():
    """
    Endpoint to retrieve recipes from favorites.
    Returns:
        Response: JSON response containing the favorite recipes.
    """

    recipes= fav_recipes.get_recipes()
    return jsonify(recipes)




@app.route('/show_one_favorite/<recipe_id>')
def s_one_fav(recipe_id: str) -> Response:
    """
    Endpoint to display information about a single favorite recipe based on its ID.
    Args:
        recipe_id (str): The ID of the recipe to retrieve.
    Returns:
        Response: JSON response containing information about the requested recipe.
    """

    recipes = fav_recipes.get_recipes()
    if recipe_id in recipes:
        return jsonify({recipe_id: recipes[recipe_id]})
    else:
        return jsonify({"error": "Recipe not found"})
    
### CRUD OPERATIONS ###

@app.route('/add_to_favorites', methods=['POST', 'GET'])
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

    recipe = Recipe(recipe_title,  recipe_id, recipe_instructions, recipe_ingredients, recipe_image)
    
    success = fav_recipes.add_recipe(recipe)
    
    if success:
        return jsonify({"message": "Recipe added to favorites successfully"})
    else:
        return jsonify({"error": "Failed to add recipe to favorites"})


@app.route('/create_recipe', methods=['POST'])
def create_recipe() -> Response:
    """
    Endpoint to create a new recipe and add it to the favorites.
    Returns:
        Response: JSON response indicating the success or failure of the operation.
    """

    recipe_title = request.form['r_title']
    recipe_id = request.form['r_id']
    recipe_instructions = request.form['r_instructions']
    recipe_ingredients = request.form['r_ingredients']
    recipe_image = request.form['r_image']

    recipe = Recipe(recipe_title,  recipe_id, recipe_instructions, recipe_ingredients, recipe_image)
    
    recipe_added = fav_recipes.add_recipe(recipe)
    
    if recipe_added:
        return jsonify({"message": "Recipe added successfully"}), 201
    else:
        return jsonify({"error": "Recipe with this title already exists"}), 409
    


@app.route('/delete_recipe', methods=['DELETE'])
def delete_recipe() -> Response:
    """
    Endpoint to delete a recipe from the favorites list.
    Returns:
        Response: JSON response indicating the success or failure of the operation.
    """

    data = request.get_json()
    r_title = data.get('r_title')

    recipes = fav_recipes.get_recipes()

    if r_title in recipes:
        recipe = Recipe(recipes[r_title]["title"], recipes[r_title]["recipe_id"], recipes[r_title]["instructions"], recipes[r_title]["ingredients"], recipes[r_title]["image"])

        if fav_recipes.delete_recipe(recipe):
            return jsonify({"message": "Recipe deleted successfully"}), 200
    return jsonify({"error": "Recipe with this title does not exist"}), 404
    

@app.route('/update_recipe_instructions', methods=['PUT'])
def update_recipe() -> Response:
    """
    Endpoint to update the instructions of a recipe in the favorites.
    Returns:
        Response: JSON response indicating the success or failure of the operation.
    """

    data = request.get_json()
    r_title = data.get('r_title')
    new_instructions = data.get('r_instructions')

    recipes = fav_recipes.get_recipes()

    if r_title in recipes:
        recipe = Recipe(recipes[r_title]["title"], recipes[r_title]["recipe_id"], recipes[r_title]["instructions"], recipes[r_title]["ingredients"], recipes[r_title]["image"])

        if fav_recipes.update_recipe(recipe, new_instructions):
            return jsonify({"message": "Ingredients updated successfully"}), 200
    return jsonify({"error": "Recipe with this title does not exist"}), 404


### CRUD OPERATIONS ###

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
    
    data = response.json()
    return data

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
    
    image_data = response.content
    return Response(image_data, content_type='image/png')

def clean_html_response(html: str) -> Tuple[Optional[List[str]], Optional[List[str]]]:
    """
    Helper function to clean HTML response and extract ingredients and prices.
    Args:
        input_string (str): The HTML string to be cleaned.
    Returns:
        Tuple[Optional[List[str]], Optional[List[str]]]: A tuple containing lists of ingredients and prices, or None if not found.
    """

    parsed_html = BeautifulSoup(html, "html.parser")

    # Extracting ingredients
    ingredients_container = parsed_html.find('div', attrs={'id': 'spoonacularPriceBreakdownTable'}).find('div', style=lambda value: value and 'float:left;max-width:80%' in value)
    ingredients = [ingredient.strip() for ingredient in ingredients_container.stripped_strings]

    # Extracting prices
    prices_container = parsed_html.find('div', attrs={'id': 'spoonacularPriceBreakdownTable'}).find('div', style=lambda value: value and 'text-align:right;display:inline-block;float:left;padding-left:1em' in value)
    prices = [price.strip() for price in prices_container.stripped_strings]

    return ingredients, prices


@app.route('/api/price_breakdown/<int:meal_id>')
def get_price_breakdown(meal_id):
    url = f'{SPOONACULAR_API}/{meal_id}/priceBreakdownWidget?apiKey={API_KEY}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch price breakdown widget'}), 500
    
    #return response.text, 200, {'Content-Type': 'text/html'}
    #price_info = clean_html_response(response.text)

    return jsonify(clean_html_response(response.text))
    


'''

@app.route('/clean_html', methods=['POST'])
def clean_html():
    html_string = request.data.decode("utf-8")
    ingredient_names, prices = clean_html_response(html_string)
    
    pie_chart_image_base64 = create_pie_chart(ingredient_names, prices) 

    return jsonify({'pie_chart_image_base64': pie_chart_image_base64})


def create_pie_chart(labels, values):
    values = [float(v) for v in values]

    plt.figure(figsize=(15, 8))
    patches, _, _ = plt.pie(values, labels=None, startangle=140, autopct=lambda p: '${:.2f}'.format(p * sum(values) / 100), pctdistance=0.85)

    plt.legend(patches, labels, loc="best")
    plt.title("Ingredients Distribution")
    plt.axis('equal')

    # Save the pie chart as a PNG image
    img_data = io.BytesIO()
    plt.savefig(img_data, format='png')
    img_data.seek(0)
    img_base64 = base64.b64encode(img_data.read()).decode('utf-8')

    return img_base64

'''

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
    
    data = response.json()
    return data



if __name__ == '__main__':
    app.run(debug=True)





###################################
###################################



### https://api.spoonacular.com/recipes/1082038/priceBreakdownWidget?apiKey=25f10c03748a4a99bed2f8dfb40d284f ### to check response
