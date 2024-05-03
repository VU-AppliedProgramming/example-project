from flask import Flask, send_from_directory, jsonify, render_template, request, redirect, url_for
import requests
from flask_cors import CORS
from urllib.parse import urlencode
import os

app = Flask(__name__)
CORS(app)

BACKEND_ENDPOINT = 'http://localhost:5000'

@app.route('/')
def index():
    print(BACKEND_ENDPOINT)
    return render_template('index.html')

    
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

@app.route('/api/random')
def get_random_recipe():
    backend_url = f'{BACKEND_ENDPOINT}/api/random'
    response = requests.get(backend_url)
    return jsonify(response.json())

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
