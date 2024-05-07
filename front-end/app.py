from flask import Flask, jsonify, render_template, request
import requests
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

BACKEND_ENDPOINT = 'http://localhost:5000'

@app.route('/check_backend')
def check_backend():
    try:
        response = requests.get(f'{BACKEND_ENDPOINT}/health')
        if response.status_code == 200:
            return 'Back end server is running.', 200
        else:
            return 'Back end server is not running.', 500
    except requests.exceptions.ConnectionError:
        return 'Unable to connect to back end server.', 500

@app.route('/')
def index():
    print(BACKEND_ENDPOINT)
    return render_template('index.html')

@app.route('/get_test_data', methods=['GET', 'POST'])
def get_test_data():
    backend_url = f'{BACKEND_ENDPOINT}/test'
    response = requests.get(backend_url)
    recipes = response.json()
    print(type(recipes))
    return render_template('test.html', results=recipes)

@app.route('/show_one_favorite', methods=['GET', 'POST'])
def show_one_fav():
    backend_url = f'{BACKEND_ENDPOINT}/test'
    response = requests.get(backend_url)
    recipes = response.json()
    return render_template('onefavourite.html', results=recipes)

@app.route('/create_my_recipe', methods=['GET', 'POST'])
def create_rec():
    return render_template('addfav.html')

@app.route('/delete_my_recipe', methods=['GET', 'POST'])
def delete_rec():
    return render_template('deletefav.html')

@app.route('/update_my_recipe', methods=['GET', 'POST'])
def update_rec():
    return render_template('changeinstructions.html')

    
@app.route('/api/meals', methods=['POST'])
def search():
    data = request.form
    min_calories = data.get('minCalories')
    max_calories = data.get('maxCalories')
    
    backend_url = f'{BACKEND_ENDPOINT}/api/meals'
    response = requests.get(backend_url, params={'query': data['wordUser'], 'minCalories': min_calories, 'maxCalories': max_calories})
    meals = response.json()['results']
    return render_template('results.html', results=meals)


@app.route('/api/recipe/<meal_id>', methods=['POST'])
def recipe(meal_id):
    backend_url = f'{BACKEND_ENDPOINT}/api/recipe/{meal_id}'
    response = requests.get(backend_url)
    meal = response.json()
    print(meal)
    return render_template('onerecipe.html', meal=meal)

@app.route('/api/random', methods=['POST'])
def get_random_recipe():
    backend_url = f'{BACKEND_ENDPOINT}/api/random'
    response = requests.get(backend_url)
    meal = response.json()
    return render_template('onerecipe.html', meal=meal)

@app.route('/api/price_breakdown_widget/<int:meal_id>')
def get_price_breakdown_widget(meal_id):
    backend_url = f'{BACKEND_ENDPOINT}/api/price_breakdown_widget/{meal_id}'
    response = requests.get(backend_url)
    print(response.text) 
    return response.text

@app.route('/clean_html', methods=['POST'])
def clean_html():
    html_string = request.data.decode("utf-8")
    backend_url = f'{BACKEND_ENDPOINT}/clean_html'
    response = requests.post(backend_url, data=html_string)
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(debug=True, port=5001)
