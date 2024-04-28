document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('search-button');
    const mealList = document.getElementById('meal');
    const mealDetailsContent = document.querySelector('.meal-details-content');
    const recipeCloseButton = document.getElementById('recipe-close-button');
    const calorieFilterCheckbox = document.getElementById('calorie-filter-checkbox');
    const minCaloriesInput = document.getElementById('min-calories');
    const maxCaloriesInput = document.getElementById('max-calories');
    const randomButton = document.getElementById('random-button');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const resetButton = document.getElementById('resetButton');
    const closeButton = document.getElementById('closeButton');
    const timerDisplay = document.getElementById('timerDisplay');

    let timer;
    let startTime;
    let elapsedTime = 0;
    let isRunning = false;

    // Initially hide the pause, reset, and close buttons
    pauseButton.style.display = 'none';
    resetButton.style.display = 'none';
    closeButton.style.display = 'none';

    startButton.addEventListener('click', startTimer);
    pauseButton.addEventListener('click', pauseTimer);
    resetButton.addEventListener('click', resetTimer);
    closeButton.addEventListener('click', closeTimer);

    function startTimer() {
        if (!isRunning) {
            isRunning = true;
            startTime = Date.now() - elapsedTime;
            timer = setInterval(function() {
                elapsedTime = Date.now() - startTime;
                displayTime(elapsedTime);
            }, 1000); // Change interval to 1000ms (1 second)

            // Show the pause, reset, and close buttons
            pauseButton.style.display = 'inline-block';
            resetButton.style.display = 'inline-block';
            closeButton.style.display = 'inline-block';
        }
    }

    function pauseTimer() {
        if (isRunning) {
            isRunning = false;
            clearInterval(timer);
        }
    }

    function resetTimer() {
        pauseTimer();
        elapsedTime = 0;
        displayTime(elapsedTime);
    }

    function closeTimer() {
        // Hide the pause, reset, and close buttons
        pauseButton.style.display = 'none';
        resetButton.style.display = 'none';
        closeButton.style.display = 'none';

        // Clear the timer display
        timerDisplay.textContent = '';
    }

    function displayTime(milliseconds) {
        let minutes = Math.floor(milliseconds / 60000);
        let seconds = Math.floor((milliseconds % 60000) / 1000);

        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Event listeners
    searchButton.addEventListener('click', getMealList);
    mealList.addEventListener('click', handleMealListClick);
    randomButton.addEventListener('click', getRandomRecipe);
    recipeCloseButton.addEventListener('click', () => {
        mealDetailsContent.parentElement.classList.remove('showRecipe');
    });

    // Initially hide the calorie input fields
    if (!calorieFilterCheckbox.checked) {
        minCaloriesInput.style.display = 'none';
        maxCaloriesInput.style.display = 'none';
    }

    calorieFilterCheckbox.addEventListener('change', () => {
        // Toggle visibility of calorie input fields based on checkbox state
        if (calorieFilterCheckbox.checked) {
            // Show the calorie input fields if the checkbox is checked
            minCaloriesInput.style.display = 'inline-block';
            maxCaloriesInput.style.display = 'inline-block';
        } else {
            // Hide the calorie input fields if the checkbox is unchecked
            minCaloriesInput.style.display = 'none';
            maxCaloriesInput.style.display = 'none';
        }
    });

    // Function to handle clicks on the meal list
    function handleMealListClick(event) {
        const target = event.target;
        if (target.classList.contains('recipe-button')) {
            event.preventDefault();
            const mealItem = target.closest('.meal-item');
            if (mealItem) {
                const mealId = mealItem.dataset.id;
                fetch(`/api/recipe/${mealId}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => mealRecipeModal(data))
                    .catch(error => {
                        console.error('Error fetching recipe:', error);
                        alert('Failed to fetch recipe details. Please try again later.');
                    });
            }
        }
    }

    // Function to fetch meal list based on ingredients
    function getMealList() {
        let searchInputTxt = document.getElementById('search-input').value.trim();
        let url = `/api/meals?query=${searchInputTxt}`;

        // Add calorie filter parameters if checkbox is checked and inputs have values
        if (calorieFilterCheckbox.checked && minCaloriesInput.value && maxCaloriesInput.value) {
            let minCalories = minCaloriesInput.value.trim();
            let maxCalories = maxCaloriesInput.value.trim();
            url += `&minCalories=${minCalories}&maxCalories=${maxCalories}`;
        }

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                let html = '';
                if (data.results) {
                    data.results.forEach(meal => {
                        html += `
                            <div class="meal-item" data-id="${meal.id}">
                                <div class="meal-img">
                                    <img src="${meal.image}" alt="${meal.title}">
                                </div>
                                <div class="meal-name">
                                    <h3>${meal.title}</h3>
                                    <a href="#" class="recipe-button"> Get Recipe</a>
                                </div>
                            </div>
                        `;
                    });
                    mealList.classList.remove('notFound');
                } else {
                    html = `Sorry, we didn't find any meal that matches your search`;
                    mealList.classList.add('notFound');
                }
                mealList.innerHTML = html;
            })
            .catch(error => {
                console.error('Error fetching meals:', error);
            });
    }

    function mealRecipeModal(meal) {
        let instructions = meal.instructions ? meal.instructions : "No instructions available for this recipe";
        let ingredientsHTML = meal.extendedIngredients.map(ingredient => {
            return `<li>${ingredient.original}</li>`;
        }).join('');
    
        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${meal.title}</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;500;600;700;800;900&display=swap">
            <link rel="stylesheet" type="text/css" href="http://127.0.0.1:5001/static/css/recipe.css">
        </head>
        <body>
            <h2 class="recipe-title">${meal.title}</h2>
            <div class="recipe-instructions">
                <h3>Instructions:</h3>
                <p>${instructions}</p>
            </div>
            <div class="recipe-ingredients">
                <h3>Ingredients:</h3>
                <ul>${ingredientsHTML}</ul>
            </div>
            <div class="recipe-meal-image">
                <img src="${meal.image}" alt="image of food">
            </div>
            <div class="recipe-link">
                <a href="${meal.sourceUrl}" target="_blank">View Recipe</a>
            </div>
        </body>
        </html>
        `;

    
        let newWindow = window.open();
        newWindow.document.write(html);
    }


    // Function to fetch and display a random recipe
    function getRandomRecipe(event) {
        event.preventDefault();
        fetch('/api/random')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                mealRecipeModal(data);
            })
            .catch(error => {
                console.error('Error fetching random recipe:', error);
            });
    }

    // Function to get price breakdown
    function getPriceBreakdown(meal_id) {
        fetch(`/api/recipes/${meal_id}/priceBreakdownWidget`)
            .then(response => {
                console.log('Response status:', response.status);
                return response.text()
            })
            .then(data => {
                console.log('HTML content:', data);

            })
            .catch(error => console.error('Error fetching price breakdown:', error));
    }
});



