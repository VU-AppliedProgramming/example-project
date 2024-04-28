from flask import Flask, render_template, jsonify, request
import os
import requests
from flask_cors import CORS
import matplotlib as plt

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

@app.route('/api/random')
def get_random_recipe():
    url = f'https://api.spoonacular.com/recipes/random?apiKey={API_KEY}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch random recipe'}), 500
    
    data = response.json()
    return jsonify(data['recipes'][0])

@app.route('/api/price_breakdown_widget/<int:meal_id>')
def get_price_breakdown_widget(meal_id):
    url = f'https://api.spoonacular.com/recipes/{meal_id}/priceBreakdownWidget?apiKey={API_KEY}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch price breakdown widget'}), 500
    
    return response.text, 200, {'Content-Type': 'text/html'}

def create_pie_chart(response_text):
    '''
    Example output:  

    Cost per Serving: $1.74
    Ingredient
    90 grams whey protein
    150 grams frozen strawberries
    150 grams frozen blueberries
    3 bananas
    1 pomegranate
    60 grams walnuts
    30 grams pumpkin seeds
    30 grams flaxseed
    180 grams granola
    Price
    $2.51
    $1.34
    $1.18
    $0.47
    $1.56
    $1.44
    $0.54
    $0.18
    $1.22
    $10.43
    charttable
    
    '''

    # Parse the response text
    lines = response_text.split('\n')[1:-1]  # Exclude the first and last lines
    ingredients_with_prices = [(line.split()[1:], float(line.split()[-1][1:])) for line in lines]
    
    # Extract ingredients and prices
    ingredients = [item[0] for item in ingredients_with_prices]
    prices = [item[1] for item in ingredients_with_prices]
    
    # Create pie chart
    plt.figure(figsize=(8, 8))
    plt.pie(prices, labels=ingredients, autopct='%1.1f%%', startangle=140)
    plt.title('Ingredient Prices')
    plt.axis('equal')
    plt.savefig('pie_chart.png') 
    plt.close()  

if __name__ == '__main__':
    app.run(debug=True)
