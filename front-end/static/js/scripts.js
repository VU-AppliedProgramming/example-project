document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('search-button');
    const mealList = document.getElementById('meal');
    const mealDetailsContent = document.querySelector('.meal-details-content');
    const recipeCloseButton = document.getElementById('recipe-close-button');
    const calorieFilterCheckbox = document.getElementById('calorie-filter-checkbox');
    const minCaloriesInput = document.getElementById('min-calories');
    const maxCaloriesInput = document.getElementById('max-calories');
    const randomButton = document.getElementById('random-button');

    // Event listeners
    searchButton.addEventListener('click', getMealList);
    mealList.addEventListener('click', handleMealListClick);
    randomButton.addEventListener('click', getRandomRecipe);
    recipeCloseButton.addEventListener('click', () => {
        mealDetailsContent.parentElement.classList.remove('showRecipe');
    });

    calorieFilterCheckbox.addEventListener('change', () => {
        // Toggle visibility of calorie input fields
        minCaloriesInput.style.display = calorieFilterCheckbox.checked ? 'inline-block' : 'none';
        maxCaloriesInput.style.display = calorieFilterCheckbox.checked ? 'inline-block' : 'none';
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
        } else if (target.classList.contains('price-breakdown-button')) {
            event.preventDefault();
            const mealId = target.dataset.id;
            window.location.href = `/price_breakdown_page.html?mealId=${mealId}`;
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

    // Function to display meal recipe modal
    function mealRecipeModal(meal) {
        let instructions = meal.instructions ? meal.instructions : "No instructions available for this recipe";

        let ingredientsHTML = meal.extendedIngredients.map(ingredient => {
            return `<li>${ingredient.original}</li>`;
        }).join('');

        let html = `
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
            <div class="price-breakdown-link">
                <a href="#" class="price-breakdown-button" data-id="${meal.id}">Get Price Breakdown</a>
            </div>
        `;
        mealDetailsContent.innerHTML = html;
        mealDetailsContent.parentElement.classList.add('showRecipe');
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
});
