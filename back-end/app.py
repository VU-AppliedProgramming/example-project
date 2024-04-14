from flask import Flask, render_template, jsonify, request
import os
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Spoonacular API key
API_KEY = os.environ.get('API_KEY')

@app.route('/api/meals')
def get_meals():
    query = request.args.get('query')
    min_calories = request.args.get('minCalories', type=int)
    max_calories = request.args.get('maxCalories', type=int)
    
    url = f'https://api.spoonacular.com/recipes/complexSearch?query={query}&apiKey={API_KEY}'
    if min_calories is not None and max_calories is not None:
        url += f'&minCalories={min_calories}&maxCalories={max_calories}'
    
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch meals'}), 500
    
    data = response.json()
    return jsonify(data)

@app.route('/api/recipe/<int:meal_id>')
def get_recipe(meal_id):
    url = f'https://api.spoonacular.com/recipes/{meal_id}/information?apiKey={API_KEY}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch recipe'}), 500
    
    data = response.json()
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
