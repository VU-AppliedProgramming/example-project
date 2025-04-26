// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Navigation & UI Elements
    const navLinks = document.querySelectorAll('nav a');
    const recipeModal = document.getElementById('recipe-modal');
    const createRecipeModal = document.getElementById('create-recipe-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal, .close-form');
    
    // Search Elements
    const searchForm = document.getElementById('search-form');
    const searchQuery = document.getElementById('search-query');
    const minCalories = document.getElementById('min-calories');
    const maxCalories = document.getElementById('max-calories');
    const searchResults = document.getElementById('search-results');
    
    // Random Recipe Elements
    const randomRecipeBtn = document.getElementById('random-recipe-btn');
    const randomRecipeResult = document.getElementById('random-recipe-result');
    
    // Favorites Elements
    const favoritesSearchInput = document.getElementById('favorites-search');
    const searchFavoritesBtn = document.getElementById('search-favorites-btn');
    const createRecipeBtn = document.getElementById('create-recipe-btn');
    const createRecipeForm = document.getElementById('create-recipe-form');
    const favoritesList = document.getElementById('favorites-list');
    
    // Timer Elements
    const timerMinutes = document.getElementById('timer-minutes');
    const timerSeconds = document.getElementById('timer-seconds');
    const timerInput = document.getElementById('timer-input');
    const timerStartBtn = document.getElementById('timer-start');
    const timerPauseBtn = document.getElementById('timer-pause');
    const timerResetBtn = document.getElementById('timer-reset');
    
    // Event Listeners
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Modal Close Buttons
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            recipeModal.style.display = 'none';
            createRecipeModal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside of modal content
    window.addEventListener('click', (e) => {
        if (e.target === recipeModal) {
            recipeModal.style.display = 'none';
        }
        if (e.target === createRecipeModal) {
            createRecipeModal.style.display = 'none';
        }
    });
    
    // Search Form
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        searchRecipes();
    });
    
    // Random Recipe Button
    randomRecipeBtn.addEventListener('click', getRandomRecipe);
    
    // Favorites Search
    searchFavoritesBtn.addEventListener('click', searchFavorites);
    favoritesSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchFavorites();
        }
    });
    
    // Create Recipe Button
    createRecipeBtn.addEventListener('click', () => {
        // Reset form for new recipe
        createRecipeForm.reset();
        document.getElementById('create-recipe-title').textContent = 'Create New Recipe';
        document.getElementById('recipe-id').value = '';
        createRecipeModal.style.display = 'block';
    });
    
    // Create Recipe Form
    createRecipeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveRecipe();
    });
    
    // Timer Controls
    timerStartBtn.addEventListener('click', startTimer);
    timerPauseBtn.addEventListener('click', pauseTimer);
    timerResetBtn.addEventListener('click', resetTimer);
    
    // Load favorites on page load
    loadFavorites();
});

// API Functions

// Function to search recipes from API
async function searchRecipes() {
    const searchQuery = document.getElementById('search-query');
    const minCalories = document.getElementById('min-calories');
    const maxCalories = document.getElementById('max-calories');
    const searchResults = document.getElementById('search-results');
    
    const query = searchQuery.value.trim();
    if (!query) return;
    
    // Show loading indicator
    searchResults.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    
    let url = `/api/meals?query=${encodeURIComponent(query)}`;
    
    // Add calorie parameters if specified
    const minCal = minCalories.value.trim();
    const maxCal = maxCalories.value.trim();
    if (minCal && maxCal) {
        url += `&minCalories=${minCal}&maxCalories=${maxCal}`;
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            searchResults.innerHTML = `<div class="error-message">Error: ${data.error}</div>`;
            return;
        }
        
        displaySearchResults(data.results || []);
    } catch (error) {
        searchResults.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

// Function to display search results
function displaySearchResults(results) {
    const searchResults = document.getElementById('search-results');
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No recipes found. Try different keywords.</div>';
        return;
    }
    
    let html = '';
    results.forEach(recipe => {
        html += `
            <div class="recipe-card fade-in">
                <div class="recipe-image">
                    <img src="${recipe.image}" alt="${recipe.title}">
                </div>
                <div class="recipe-content">
                    <h3>${recipe.title}</h3>
                    <div class="recipe-buttons">
                        <button class="btn-secondary" onclick="viewRecipeDetails(${recipe.id})">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                        <button class="btn-primary" onclick="addToFavoritesFromSearch(${recipe.id})">
                            <i class="fas fa-heart"></i> Favorite
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    searchResults.innerHTML = html;
}

// Function to get random recipe
async function getRandomRecipe() {
    const randomRecipeResult = document.getElementById('random-recipe-result');
    
    // Show loading indicator
    randomRecipeResult.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    
    try {
        const response = await fetch('/api/random');
        const recipe = await response.json();
        
        if (recipe.error) {
            randomRecipeResult.innerHTML = `<div class="error-message">Error: ${recipe.error}</div>`;
            return;
        }
        
        randomRecipeResult.innerHTML = `
            <div class="recipe-card slide-up">
                <div class="recipe-image">
                    <img src="${recipe.image}" alt="${recipe.title}">
                </div>
                <div class="recipe-content">
                    <h3>${recipe.title}</h3>
                    <p>${recipe.readyInMinutes} minutes | ${recipe.servings} servings</p>
                    <div class="recipe-buttons">
                        <button class="btn-secondary" onclick="viewRecipeDetails(${recipe.id})">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                        <button class="btn-primary" onclick="addToFavoritesFromSearch(${recipe.id})">
                            <i class="fas fa-heart"></i> Favorite
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        randomRecipeResult.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

// Function to view recipe details
async function viewRecipeDetails(recipeId) {
    const recipeModal = document.getElementById('recipe-modal');
    const recipeModalContent = document.getElementById('recipe-modal-content');
    const recipePriceBreakdown = document.getElementById('recipe-price-breakdown');
    
    // Show loading indicator
    recipeModalContent.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    recipePriceBreakdown.innerHTML = '';
    recipeModal.style.display = 'block';
    
    try {
        // Fetch recipe details
        const response = await fetch(`/api/recipe/info/${recipeId}`);
        const recipe = await response.json();
        
        if (recipe.error) {
            recipeModalContent.innerHTML = `<div class="error-message">Error: ${recipe.error}</div>`;
            return;
        }
        
        // Format ingredients
        const ingredientsList = recipe.extendedIngredients.map(ingredient => 
            `<li>${ingredient.original}</li>`
        ).join('');
        
        // Format instructions
        let instructionsHtml = '<ol>';
        if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
            const steps = recipe.analyzedInstructions[0].steps;
            steps.forEach(step => {
                instructionsHtml += `<li>${step.step}</li>`;
            });
        } else if (recipe.instructions) {
            // Split instructions by periods if it's a string
            const instructionSteps = recipe.instructions.split('.');
            instructionSteps.forEach(step => {
                if (step.trim()) {
                    instructionsHtml += `<li>${step.trim()}.</li>`;
                }
            });
        } else {
            instructionsHtml += '<li>No instructions available.</li>';
        }
        instructionsHtml += '</ol>';
        
        // Create recipe detail HTML
        recipeModalContent.innerHTML = `
            <div class="recipe-detail">
                <div class="recipe-detail-header">
                    <h2>${recipe.title}</h2>
                    <p>Ready in ${recipe.readyInMinutes} minutes | ${recipe.servings} servings</p>
                </div>
                
                <img src="${recipe.image}" alt="${recipe.title}" class="recipe-detail-image">
                
                <div class="recipe-detail-section">
                    <h3>Ingredients</h3>
                    <ul>${ingredientsList}</ul>
                </div>
                
                <div class="recipe-detail-section">
                    <h3>Instructions</h3>
                    ${instructionsHtml}
                </div>
                
                <div class="recipe-detail-actions">
                    <button class="btn-primary" onclick="addToFavoritesFromSearch(${recipe.id})">
                        <i class="fas fa-heart"></i> Add to Favorites
                    </button>
                </div>
            </div>
        `;
        
        // Fetch price breakdown
        fetchPriceBreakdown(recipeId);
        
    } catch (error) {
        recipeModalContent.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

// Function to fetch price breakdown
async function fetchPriceBreakdown(recipeId) {
    const recipePriceBreakdown = document.getElementById('recipe-price-breakdown');
    
    try {
        // First try to get the detailed price breakdown
        const response = await fetch(`/api/price_breakdown/${recipeId}`);
        const data = await response.json();
        
        if (data && Array.isArray(data) && data.length === 2) {
            const [ingredients, prices] = data;
            
            let priceHtml = '<div class="price-breakdown">';
            priceHtml += '<h3>Price Breakdown</h3>';
            priceHtml += '<div class="price-breakdown-content">';
            
            for (let i = 0; i < ingredients.length; i++) {
                if (ingredients[i] && prices[i]) {
                    priceHtml += `
                        <div class="price-item">
                            <span>${ingredients[i]}</span>
                            <span>${prices[i]}</span>
                        </div>
                    `;
                }
            }
            
            priceHtml += '</div></div>';
            recipePriceBreakdown.innerHTML = priceHtml;
        } else {
            // If detailed breakdown fails, try the image widget
            recipePriceBreakdown.innerHTML = `
                <div class="price-breakdown">
                    <h3>Price Breakdown</h3>
                    <img src="/api/price_breakdown_widget/${recipeId}" alt="Price Breakdown" class="price-breakdown-img">
                </div>
            `;
        }
    } catch (error) {
        recipePriceBreakdown.innerHTML = '<div class="error-message">Price breakdown not available</div>';
    }
}

// Function to add recipe to favorites from search results
async function addToFavoritesFromSearch(recipeId) {
    try {
        // First get the recipe details
        const response = await fetch(`/api/recipe/info/${recipeId}`);
        const recipe = await response.json();
        
        if (recipe.error) {
            alert(`Error: ${recipe.error}`);
            return;
        }
        
        // Format ingredients
        const ingredientsList = recipe.extendedIngredients.map(ingredient => 
            ingredient.original
        ).join('\n');
        
        // Format instructions
        let instructions = '';
        if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
            const steps = recipe.analyzedInstructions[0].steps;
            instructions = steps.map(step => step.step).join('\n');
        } else if (recipe.instructions) {
            instructions = recipe.instructions;
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('recipe_title', recipe.title);
        formData.append('recipe_instructions', instructions);
        formData.append('recipe_ingredients', ingredientsList);
        formData.append('recipe_image', recipe.image);
        formData.append('recipe_id', recipe.id);
        
        // Submit to add to favorites
        const saveResponse = await fetch('/feastFinder/recipes/favorites/add_to_favorites', {
            method: 'POST',
            body: formData
        });
        
        const result = await saveResponse.json();
        
        if (result.message) {
            alert(result.message);
            loadFavorites(); // Refresh favorites list
        } else if (result.error) {
            alert(`Error: ${result.error}`);
        }
        
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Function to load favorites
async function loadFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    
    try {
        const response = await fetch('/feastFinder/recipes/favorites/');
        const favorites = await response.json();
        
        if (Object.keys(favorites).length === 0) {
            favoritesList.innerHTML = '<div class="no-results">No favorite recipes yet. Add some!</div>';
            return;
        }
        
        let html = '';
        for (const recipeId in favorites) {
            const recipe = favorites[recipeId];
            html += `
                <div class="recipe-card fade-in" data-id="${recipeId}">
                    <div class="recipe-image">
                        <img src="${recipe.image || '/static/images/placeholder.jpg'}" alt="${recipe.title}">
                    </div>
                    <div class="recipe-content">
                        <h3>${recipe.title}</h3>
                        <div class="recipe-buttons">
                            <button class="btn-secondary" onclick="viewFavoriteDetails('${recipeId}')">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                            <button class="btn-secondary" onclick="editRecipe('${recipeId}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-primary" onclick="deleteRecipe('${recipeId}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        favoritesList.innerHTML = html;
    } catch (error) {
        favoritesList.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

// Function to search favorites
async function searchFavorites() {
    const favoritesSearchInput = document.getElementById('favorites-search');
    const favoritesList = document.getElementById('favorites-list');
    
    const query = favoritesSearchInput.value.trim();
    if (!query) {
        loadFavorites();
        return;
    }
    
    try {
        const response = await fetch(`/feastFinder/recipes/favorites/search?query=${encodeURIComponent(query)}`);
        const results = await response.json();
        
        if (Object.keys(results).length === 0) {
            favoritesList.innerHTML = '<div class="no-results">No matching recipes found in your favorites.</div>';
            return;
        }
        
        let html = '';
        for (const recipeId in results) {
            const recipe = results[recipeId];
            html += `
                <div class="recipe-card fade-in" data-id="${recipeId}">
                    <div class="recipe-image">
                        <img src="${recipe.image || '/static/images/placeholder.jpg'}" alt="${recipe.title}">
                    </div>
                    <div class="recipe-content">
                        <h3>${recipe.title}</h3>
                        <div class="recipe-buttons">
                            <button class="btn-secondary" onclick="viewFavoriteDetails('${recipeId}')">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                            <button class="btn-secondary" onclick="editRecipe('${recipeId}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-primary" onclick="deleteRecipe('${recipeId}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        favoritesList.innerHTML = html;
    } catch (error) {
        favoritesList.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

// Function to view favorite recipe details
async function viewFavoriteDetails(recipeId) {
    const recipeModal = document.getElementById('recipe-modal');
    const recipeModalContent = document.getElementById('recipe-modal-content');
    const recipePriceBreakdown = document.getElementById('recipe-price-breakdown');
    
    // Show loading indicator
    recipeModalContent.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    recipePriceBreakdown.innerHTML = '';
    recipeModal.style.display = 'block';
    
    try {
        // Fetch favorite recipe details
        const response = await fetch(`/feastFinder/recipes/favorites/${recipeId}`);
        const data = await response.json();
        
        if (!data[recipeId]) {
            recipeModalContent.innerHTML = `<div class="error-message">Recipe not found</div>`;
            return;
        }
        
        const recipe = data[recipeId];
        
        // Format ingredients
        const ingredientsList = recipe.ingredients.split('\n').map(ingredient => 
            `<li>${ingredient.trim()}</li>`
        ).join('');
        
        // Format instructions
        let instructionsHtml = '<ol>';
        const instructionSteps = recipe.instructions.split('\n');
        instructionSteps.forEach(step => {
            if (step.trim()) {
                instructionsHtml += `<li>${step.trim()}</li>`;
            }
        });
        instructionsHtml += '</ol>';
        
        // Create recipe detail HTML
        recipeModalContent.innerHTML = `
            <div class="recipe-detail">
                <div class="recipe-detail-header">
                    <h2>${recipe.title}</h2>
                </div>
                
                ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" class="recipe-detail-image">` : ''}
                
                <div class="recipe-detail-section">
                    <h3>Ingredients</h3>
                    <ul>${ingredientsList}</ul>
                </div>
                
                <div class="recipe-detail-section">
                    <h3>Instructions</h3>
                    ${instructionsHtml}
                </div>
                
                <div class="recipe-detail-actions">
                    <button class="btn-secondary" onclick="editRecipe('${recipeId}')">
                        <i class="fas fa-edit"></i> Edit Recipe
                    </button>
                    <button class="btn-primary" onclick="deleteRecipe('${recipeId}')">
                        <i class="fas fa-trash"></i> Delete Recipe
                    </button>
                </div>
            </div>
        `;
        
        // No price breakdown for favorite recipes
        recipePriceBreakdown.innerHTML = '';
        
    } catch (error) {
        recipeModalContent.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

// Function to edit recipe
async function editRecipe(recipeId) {
    const createRecipeModal = document.getElementById('create-recipe-modal');
    
    try {
        // Fetch recipe details
        const response = await fetch(`/feastFinder/recipes/favorites/${recipeId}`);
        const data = await response.json();
        
        if (!data[recipeId]) {
            alert('Recipe not found');
            return;
        }
        
        const recipe = data[recipeId];
        
        // Fill the form with recipe data
        document.getElementById('create-recipe-title').textContent = 'Edit Recipe';
        document.getElementById('recipe-id').value = recipeId;
        document.getElementById('recipe-title').value = recipe.title;
        document.getElementById('recipe-ingredients').value = recipe.ingredients;
        document.getElementById('recipe-instructions').value = recipe.instructions;
        document.getElementById('recipe-image').value = recipe.image || '';
        
        // Show the modal
        createRecipeModal.style.display = 'block';
        
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Function to save recipe (create new or update existing)
async function saveRecipe() {
    const createRecipeForm = document.getElementById('create-recipe-form');
    const recipeId = document.getElementById('recipe-id').value;
    
    const formData = {
        title: document.getElementById('recipe-title').value,
        ingredients: document.getElementById('recipe-ingredients').value,
        instructions: document.getElementById('recipe-instructions').value,
        image: document.getElementById('recipe-image').value || null
    };
    
    if (recipeId) {
        // Update existing recipe
        formData.recipe_id = recipeId;
        
        try {
            const response = await fetch('/feastFinder/recipes/favorites/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.message) {
                alert(result.message);
                document.getElementById('create-recipe-modal').style.display = 'none';
                loadFavorites(); // Refresh the favorites list
            } else if (result.error) {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    } else {
        // Create new recipe
        try {
            const response = await fetch('/feastFinder/recipe/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.message) {
                alert(result.message);
                document.getElementById('create-recipe-modal').style.display = 'none';
                loadFavorites(); // Refresh the favorites list
            } else if (result.error) {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
}

// Function to delete recipe
async function deleteRecipe(recipeId) {
    if (confirm('Are you sure you want to delete this recipe from your favorites?')) {
        try {
            const response = await fetch('/feastFinder/recipes/favorites/', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ recipe_id: recipeId })
            });
            
            const result = await response.json();
            
            if (result.message) {
                alert(result.message);
                
                // Close modal if it's open
                document.getElementById('recipe-modal').style.display = 'none';
                
                // Refresh favorites list
                loadFavorites();
            } else if (result.error) {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
}

// Timer functionality
let timerInterval;
let totalSeconds = 0;
let timerRunning = false;

function startTimer() {
    const timerInput = document.getElementById('timer-input');
    const timerStartBtn = document.getElementById('timer-start');
    const timerPauseBtn = document.getElementById('timer-pause');
    
    if (!timerRunning) {
        // If timer is not already running and there's no previous timer
        if (totalSeconds === 0) {
            // Get minutes from input
            const minutes = parseInt(timerInput.value);
            if (isNaN(minutes) || minutes <= 0) {
                alert('Please enter a valid number of minutes');
                return;
            }
            totalSeconds = minutes * 60;
        }
        
        // Update button states
        timerStartBtn.disabled = true;
        timerPauseBtn.disabled = false;
        
        // Start the timer
        timerRunning = true;
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            totalSeconds--;
            updateTimerDisplay();
            
            if (totalSeconds <= 0) {
                // Timer finished
                clearInterval(timerInterval);
                timerRunning = false;
                timerStartBtn.disabled = false;
                timerPauseBtn.disabled = true;
                
                // Play sound alert
                playTimerAlert();
                
                // Show alert
                alert('Timer finished!');
            }
        }, 1000);
    }
}

function pauseTimer() {
    const timerStartBtn = document.getElementById('timer-start');
    const timerPauseBtn = document.getElementById('timer-pause');
    
    clearInterval(timerInterval);
    timerRunning = false;
    timerStartBtn.disabled = false;
    timerPauseBtn.disabled = true;
}

function resetTimer() {
    const timerStartBtn = document.getElementById('timer-start');
    const timerPauseBtn = document.getElementById('timer-pause');
    const timerMinutes = document.getElementById('timer-minutes');
    const timerSeconds = document.getElementById('timer-seconds');
    
    clearInterval(timerInterval);
    timerRunning = false;
    totalSeconds = 0;
    
    timerMinutes.textContent = '00';
    timerSeconds.textContent = '00';
    
    timerStartBtn.disabled = false;
    timerPauseBtn.disabled = true;
}

function updateTimerDisplay() {
    const timerMinutes = document.getElementById('timer-minutes');
    const timerSeconds = document.getElementById('timer-seconds');
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    timerMinutes.textContent = minutes.toString().padStart(2, '0');
    timerSeconds.textContent = seconds.toString().padStart(2, '0');
}

function playTimerAlert() {
    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play beep sound
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.5;
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}