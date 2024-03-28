const apiKey = 'b8e83c57184f4cbbbbcd4f01e59901ff';
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
    const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${searchInputTxt}&apiKey=${apiKey}`;

    // Fetch data from the API
    fetch(apiUrl)
        .then(response => response.json()) // respond only in json format
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
        });
}

// get recipe of the meal
function getMealRecipe(search) {
    search.preventDefault();
    if (search.target.classList.contains('recipe-button')) {
        let mealItem = search.target.parentElement.parentElement;
        fetch(`https://api.spoonacular.com/recipes/${mealItem.dataset.id}/information?apiKey=${apiKey}`)
            .then(response => response.json())
            .then(data => mealRecipeModal(data));
    }
}

// create modal modal
function mealRecipeModal(meal) {
    let html = `
        <h2 class="recipe-title">${meal.title}</h2>
        <p class="recipe-category">${meal.dishTypes.join(', ')}</p>
        <div class="recipe-instructions">
            <h3>Instructions:</h3>
            <p>${meal.instructions}</p>
        </div>
        <div class="recipe-meal-image">
            <img src="${meal.image}" alt="image of food">
        </div>
        <div class="recipe-link">
            <a href="${meal.sourceUrl}" target="_blank">View Recipe</a>
        </div>
    `;
    mealDetailsContent.innerHTML = html;
    mealDetailsContent.parentElement.classList.add('showRecipe');
}
