from flask import Flask, send_from_directory, jsonify, render_template, request, redirect, url_for
import requests
from flask_cors import CORS
from urllib.parse import urlencode

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/example')
def example():
    return render_template('example.html')

from urllib.parse import urlencode

@app.route('/api/meals')
def search():
    query = request.args.get('query')
    min_calories = request.args.get('minCalories')
    max_calories = request.args.get('maxCalories')
    backend_url = 'http://localhost:5000/api/meals'
    response = requests.get(backend_url, params={'query': query, 'minCalories': min_calories, 'maxCalories': max_calories})

    data = response.json()
    print(data)
    # Convert data to query string
    query_string = urlencode({'meals': data})
    # Redirect to /results with data as URL parameter
    return redirect(url_for('render_results') + '?' + query_string)


@app.route('/results')
def render_results():
    meals = request.args.get('meals')
    return render_template('results.html', meals=meals)

@app.route('/api/recipe/<meal_id>')
def recipe(meal_id):
    backend_url = f'http://localhost:5000/api/recipe/{meal_id}'
    response = requests.get(backend_url)
    return jsonify(response.json())

@app.route('/api/random')
def get_random_recipe():
    backend_url = f'http://localhost:5000/api/random'
    response = requests.get(backend_url)
    return jsonify(response.json())

@app.route('/api/price_breakdown_widget/<int:meal_id>')
def get_price_breakdown_widget(meal_id):
    backend_url = f'http://localhost:5000/api/price_breakdown_widget/{meal_id}'
    response = requests.get(backend_url)
    print(response.text) 
    return response.text

@app.route('/clean_html', methods=['POST'])
def clean_html():
    html_string = request.data.decode("utf-8")
    backend_url = 'http://localhost:5000/clean_html'
    response = requests.post(backend_url, data=html_string)
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(debug=True, port=5001)
