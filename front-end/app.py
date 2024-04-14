from flask import Flask, send_from_directory, jsonify, request
import requests
from flask_cors import CORS

app = Flask(__name__, static_folder='../front-end/static')
CORS(app)

# Define route for the root URL
@app.route('/')
def index():
    # Proxy the request to the back-end server
    backend_url = 'http://localhost:5000/'
    response = requests.get(backend_url)

    ### Testing
    
    # Print out the response content, status code, and headers
    print("Response Content:", response.content)
    print("Status Code:", response.status_code)
    print("Headers:", response.headers)
    
    # Return the response received from the back end
    return response.content, response.status_code, response.headers.items()

@app.route('/static/css/styles.css')
def send_css():
    return send_from_directory(app.static_folder, 'css/styles.css')

@app.route('/static/js/scripts.js')
def send_js():
    return send_from_directory(app.static_folder, 'js/scripts.js')


@app.route('/search')
def search():
    query = request.args.get('query')
    min_calories = request.args.get('minCalories')
    max_calories = request.args.get('maxCalories')
    
    backend_url = 'http://localhost:5000/api/meals'
    response = requests.get(backend_url, params={'query': query, 'minCalories': min_calories, 'maxCalories': max_calories})
    return jsonify(response.json())

@app.route('/recipe/<int:meal_id>')
def recipe(meal_id):
    backend_url = f'http://localhost:5000/api/recipe/{meal_id}'
    response = requests.get(backend_url)
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(debug=True, port=5001)
