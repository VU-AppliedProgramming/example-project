const searchButton = document.getElementById('search-button');
const mealList = document.getElementById('meal');
const mealDetailsContent = document.querySelector('.meal-details-content');
const recipeCloseButton = document.getElementById('recipe-close-button');

// event listeners
searchButton.addEventListener('click', getMealList);
mealList.addEventListener('click', getMealRecipe);
recipeCloseButton.addEventListener('click', () => {
    mealDetailsContent.parentElement.classList.remove('showRecipe');
});

// get meal list that matches input ingredients
function getMealList() {
    let searchInputTxt = document.getElementById('search-input').value.trim();
    // Construct the URL dynamically based on user input
    const apiUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${searchInputTxt}`;

    // Fetch data from the API
    fetch(apiUrl)
        .then(response => response.json()) // respond only in json format
        .then(data => {
            let html = '';
            if (data.meals) {
                data.meals.forEach(meal => {
                    html += `
                        <div class="meal-item" data-id="${meal.idMeal}">
                            <div class="meal-img">
                                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                            </div>
                            <div class="meal-name">
                                <h3>${meal.strMeal}</h3>
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
        });
}

// get recipe of the meal
function getMealRecipe(search) {
    search.preventDefault();
    if (search.target.classList.contains('recipe-button')) {
        let mealItem = search.target.parentElement.parentElement;
        fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealItem.dataset.id}`)
            .then(response => response.json())
            .then(data => mealRecipeModal(data.meals));
    }
}

// create modal modal
function mealRecipeModal(meal) {
    console.log(meal);
    meal = meal[0];
    let html = `
        <h2 class="recipe-title">${meal.strMeal}</h2>
        <p class="recipe-category">${meal.strCategory}</p>
        <div class="recipe-instructions">
            <h3>Instructions:</h3>
            <p>${meal.strInstructions}</p>
        </div>
        <div class="${meal.strMealThumb}">
            <img src="images/food.webp" alt="image of food">
        </div>
        <div class="recipe-link">
            <a href=${meal.strYoutube} target="_blank">Watch Video</a>
        </div>
    `;
    mealDetailsContent.innerHTML = html;
    mealDetailsContent.parentElement.classList.add('showRecipe');
}
