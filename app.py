# Import necessary libraries
from flask import Flask, render_template, jsonify, request
import requests

# Create the Flask app
app = Flask(__name__)

# Spoonacular API key
API_KEY = '25f10c03748a4a99bed2f8dfb40d284f'

# Define route to render index.html
@app.route('/')
def index():
    return render_template('index.html')

# Route to get meals based on ingredients with pagination and calorie filter
@app.route('/api/meals')
def get_meals():
    # Get the query parameter 'query' from the request
    query = request.args.get('query')
    # Get calorie filter parameters
    min_calories = request.args.get('minCalories', type=int)
    max_calories = request.args.get('maxCalories', type=int)
    # Construct the URL for Spoonacular API
    url = f'https://api.spoonacular.com/recipes/complexSearch?query={query}&apiKey={API_KEY}'
    # Add calorie filter parameters to the URL if provided
    if min_calories is not None and max_calories is not None:
        url += f'&minCalories={min_calories}&maxCalories={max_calories}'
    # Send a GET request to the Spoonacular API
    response = requests.get(url)
    # Convert the response to JSON format
    data = response.json()
    # Return the JSON response
    return jsonify(data)

# Route to get recipe details based on meal ID
@app.route('/api/recipe/<int:meal_id>')
def get_recipe(meal_id):
    # Construct the URL for Spoonacular API to get recipe details by ID
    url = f'https://api.spoonacular.com/recipes/{meal_id}/information?apiKey={API_KEY}'
    # Send a GET request to the Spoonacular API
    response = requests.get(url)
    # Convert the response to JSON format
    data = response.json()
    # Return the JSON response
    return jsonify(data)

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
