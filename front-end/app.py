from flask import Flask, jsonify, render_template, request, Response
import requests
from flask_cors import CORS
from typing import Tuple, Union

app = Flask(__name__)
CORS(app)

BACKEND_ENDPOINT = 'http://localhost:5000'

@app.route('/check_backend')
def check_backend() -> Tuple[str, int]:
    """
    Endpoint to check the status of the backend server.
    Returns:
        Tuple[str, int]: A tuple containing a message indicating the server status and an HTTP status code.
    """

    try:
        response = requests.get(f'{BACKEND_ENDPOINT}/health')
        if response.status_code == 200:
            return 'Back end server is running.', 200
        else:
            return 'Back end server is not running.', 500
    except requests.exceptions.ConnectionError:
        return 'Unable to connect to back end server.', 500

@app.route('/')
def index() -> str:
    """
    Render the index.html template.
    """

    return render_template('index.html')

@app.route('/get_test_data', methods=['GET', 'POST'])
def get_test_data() -> str:
    """
    Endpoint to retrieve favorites data from the backend server.
    Returns:
        str: Rendered HTML template with favorites data.
    """
    
    backend_url = f'{BACKEND_ENDPOINT}/test'
    response = requests.get(backend_url)
    recipes = response.json()
    return render_template('test.html', results=recipes)



@app.route('/show_one_favorite', methods=['GET', 'POST'])
def show_one_fav() -> str:
    """
    Endpoint to display information about a single favorite recipe.
    Returns:
        str: Rendered HTML template with recipe information.
    """

    recipe_id = request.form['recipe_id']
    backend_url = f'{BACKEND_ENDPOINT}/show_one_favorite/{recipe_id}' 
    response = requests.get(backend_url)
    recipe = response.json()
    return render_template('onefavourite.html', recipe=recipe)



@app.route('/add_to_favorites', methods=['GET', 'POST'])
def add_to_favorites() -> Union[str, dict]:
    """
    Endpoint to add a recipe to the favorites list.
    Returns:
        Union[str, dict]: JSON response indicating the success or failure of the operation.
    """

    if request.method == 'POST':
        recipe_title = request.form['recipe_title']
        recipe_instructions = request.form['recipe_instructions']
        recipe_ingredients = request.form['recipe_ingredients']
        recipe_image = request.form['recipe_image']
        recipe_id = request.form['recipe_id']

        backend_url = f'{BACKEND_ENDPOINT}/add_to_favorites'
        data = {
            'recipe_title': recipe_title,
            'recipe_instructions': recipe_instructions,
            'recipe_ingredients': recipe_ingredients,
            'recipe_image': recipe_image,
            'recipe_id': recipe_id
        }
        response = requests.post(backend_url, data=data)

        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to add recipe to favorites"})


@app.route('/create_my_recipe', methods=['GET', 'POST'])
def create_rec() -> str:
    """
    Render the addfav.html template.
    """

    return render_template('addfav.html')

@app.route('/delete_my_recipe', methods=['GET', 'POST'])
def delete_rec() -> str:
    """
    Render the test.html template so we stay on the same page after deletion.
    """

    return render_template('test.html')

@app.route('/update_my_recipe', methods=['GET', 'POST'])
def update_rec() -> str:
    """
    Render the changeinstructions.html template.
    """

    return render_template('changeinstructions.html')


@app.route('/api/meals', methods=['POST', 'GET'])
def search() -> Union[str, Response]:
    """
    Endpoint to search for meals based on user input and optional calorie limits.
    Returns:
        Union[str, Response]: Rendered HTML template with search results or JSON response with meals data.
    """

    if request.method == 'POST':
        data = request.form
    elif request.method == 'GET':
        data = request.args
    else:
        return jsonify({'error': 'Method not allowed'}), 405
    
    word_user = data.get('wordUser') or data.get('query')
    min_calories = data.get('minCalories')
    max_calories = data.get('maxCalories')
    
    if not word_user:
        return jsonify({'error': 'Missing parameter: wordUser or query'}), 400
    
    backend_url = f'{BACKEND_ENDPOINT}/api/meals'
    response = requests.get(backend_url, params={'query': word_user, 'minCalories': min_calories, 'maxCalories': max_calories})
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch meals'}), 500
    
    meals = response.json().get('results', [])
    
    if request.method == 'POST':
        return render_template('results.html', results=meals)
    else:
        return jsonify(meals)

@app.route('/api/recipe/<meal_id>', methods=['POST'])
def recipe(meal_id: str) -> str:
    """
    Endpoint to retrieve information about a specific recipe.
    Args:
        meal_id (str): The ID of the recipe.
    Returns:
        str: Rendered HTML template with recipe information.
    """

    backend_url = f'{BACKEND_ENDPOINT}/api/recipe/{meal_id}'
    response = requests.get(backend_url)
    meal = response.json()
    print(meal)
    return render_template('onerecipe.html', meal=meal)

@app.route('/api/random', methods=['POST'])
def get_random_recipe() -> str:
    """
    Endpoint to retrieve a random recipe.
    Returns:
        str: Rendered HTML template with recipe information.
    """

    backend_url = f'{BACKEND_ENDPOINT}/api/random'
    response = requests.get(backend_url)
    meal = response.json()
    return render_template('onerecipe.html', meal=meal)

@app.route('/api/price_breakdown_widget/<int:meal_id>', methods=['GET', 'POST'])
def get_price_breakdown_widget(meal_id: int) -> Union[str, Response]:
    """
    Endpoint to retrieve the price breakdown widget for a specific meal.
    Args:
        meal_id (int): The ID of the meal.
    Returns:
        Union[str, Response]: Rendered HTML template with widget data or image data.
    """

    backend_url = f'{BACKEND_ENDPOINT}/api/price_breakdown_widget/{meal_id}'
    response = requests.get(backend_url)
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch price breakdown widget'}), 500
    
    if 'image/png' in response.headers.get('content-type', ''):
        image_data = response.content
        return Response(image_data, content_type='image/png')
    else:
        data = response.text
        return render_template('price_breakdown_widget.html', data=data)

@app.route('/clean_html', methods=['POST'])
def clean_html() -> str:
    """
    Endpoint to clean HTML content.
    Returns:
        str: JSON response with cleaned HTML data.
    """

    html_string = request.data.decode("utf-8")
    backend_url = f'{BACKEND_ENDPOINT}/clean_html'
    response = requests.post(backend_url, data=html_string)
    return jsonify(response.json())


###################################
###################################


@app.route('/api/price_breakdown/<int:meal_id>',methods=['POST', 'GET'])
def get_price_breakdown(meal_id: int) -> Union[str, Response]:
    """
    Endpoint to retrieve the price breakdown data for a specific meal.
    Args:
        meal_id (int): The ID of the meal.
    Returns:
        Union[str, Response]: JSON response with price breakdown data or an error message.
    """
    
    backend_url = f'{BACKEND_ENDPOINT}/api/price_breakdown/{meal_id}'
    response = requests.get(backend_url)
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch price breakdown data'}), 500
    
    data = response.json()
    
    return jsonify(data), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)
