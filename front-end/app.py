from flask import Flask, send_from_directory, jsonify, render_template, request, redirect, url_for
import requests
from flask_cors import CORS
from urllib.parse import urlencode
import os

app = Flask(__name__)
CORS(app)

BACKEND_ENDPOINT = os.environ.get('ENDPOINT')

@app.route('/')
def index():
    print(BACKEND_ENDPOINT)
    return render_template('index.html')

@app.route('/example')
def example():
    return render_template('example.html')

@app.route('/read-form', methods=['POST'])
def read_form():
    data = request.form

    response = requests.get(f'{BACKEND_ENDPOINT}/api/meals2', params={'query': data['wordUser']})
    meals = response.json()['results']

    return render_template('results.html', results=meals)
    


@app.route('/api/meals')
def search():
    query = request.args.get('query')
    min_calories = request.args.get('minCalories')
    max_calories = request.args.get('maxCalories')
    
    backend_url = f'{BACKEND_ENDPOINT}/api/meals'
    response = requests.get(backend_url, params={'query': query, 'minCalories': min_calories, 'maxCalories': max_calories})
    print(response.json())
    # CHANGE HERE BY MARTON
    return render_template('results.html', results=response.json())


@app.route('/api/recipe/<meal_id>')
def recipe(meal_id):
    backend_url = f'{BACKEND_ENDPOINT}/api/recipe/{meal_id}'
    response = requests.get(backend_url)
    return jsonify(response.json())

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
