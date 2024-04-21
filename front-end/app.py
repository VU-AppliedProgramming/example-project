from flask import Flask, send_from_directory, jsonify, render_template, request
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/css/styles.css')
def send_css():
    return send_from_directory(app.static_folder, 'css/styles.css')

@app.route('/static/js/scripts.js')
def send_js():
    return send_from_directory(app.static_folder, 'js/scripts.js')

@app.route('/api/meals')
def search():
    query = request.args.get('query')
    min_calories = request.args.get('minCalories')
    max_calories = request.args.get('maxCalories')
    
    backend_url = 'http://localhost:5000/api/meals'
    response = requests.get(backend_url, params={'query': query, 'minCalories': min_calories, 'maxCalories': max_calories})
    return jsonify(response.json())

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

@app.route('/api/price_breakdown_widget')
def get_price_breakdown_widget():
    backend_url = f'http://localhost:5000/api/price_breakdown_widget'
    response = requests.get(backend_url)
    return response.text

if __name__ == '__main__':
    app.run(debug=True, port=5001)
