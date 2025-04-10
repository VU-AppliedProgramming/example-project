// scripts.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const FRONTEND_BASE_URL = 'http://localhost:5001'; // Your front-end Flask app
    const BACKEND_BASE_URL = 'http://localhost:5002'; // Your back-end Flask app

    // --- DOM References ---
    const searchSection = document.getElementById('search-section');
    const resultsSection = document.getElementById('results-section');
    const recipeDetailSection = document.getElementById('recipe-detail-section');
    const favoritesSection = document.getElementById('favorites-section');
    const allSections = [searchSection, resultsSection, recipeDetailSection, favoritesSection];

    const searchForm = document.getElementById('search-form');
    const searchQueryInput = document.getElementById('search-query');
    const minCaloriesInput = document.getElementById('min-calories');
    const maxCaloriesInput = document.getElementById('max-calories');
    const randomRecipeBtn = document.getElementById('random-recipe-btn');
    const resultsGrid = document.getElementById('results-grid');
    const backToSearchBtn = document.getElementById('back-to-search-btn');
    const backToResultsBtn = document.getElementById('back-to-results-btn');

    // Recipe Detail Elements
    const recipeTitle = document.getElementById('recipe-title');
    const recipeImage = document.getElementById('recipe-image');
    const recipeSummary = document.getElementById('recipe-summary');
    const recipeIngredients = document.getElementById('recipe-ingredients');
    const recipeInstructions = document.getElementById('recipe-instructions');
    const addToFavoritesBtn = document.getElementById('add-to-favorites-btn');
    const fetchPriceBtn = document.getElementById('fetch-price-btn');
    const priceDetailsDiv = document.getElementById('price-details');
    const priceIngredientsUl = document.getElementById('price-ingredients');
    const priceCostsUl = document.getElementById('price-costs');
    const priceTotalP = document.getElementById('price-total');
    // const priceWidgetImg = document.getElementById('price-widget-img');

    // Favorites Elements
    const favoritesList = document.getElementById('favorites-list');
    const createNewFavoriteBtn = document.getElementById('create-new-favorite-btn');
    const createFavoriteModal = document.getElementById('create-favorite-modal');
    const createFavoriteForm = document.getElementById('create-favorite-form');
    const updateFavoriteModal = document.getElementById('update-favorite-modal');
    const updateFavoriteForm = document.getElementById('update-favorite-form');
    const updateTitleInput = document.getElementById('update-r_title');
    const updateInstructionsInput = document.getElementById('update-r_instructions');


    // Navigation Links
    const homeLink = document.getElementById('home-link');
    const navSearchLink = document.getElementById('nav-search-link');
    const navFavoritesLink = document.getElementById('nav-favorites-link');

    // --- State ---
    let currentRecipeDetails = null; // Store details of the recipe being viewed
    let lastSearchResults = []; // Store last search results for back navigation
    let currentView = 'search'; // 'search', 'results', 'detail', 'favorites'

    // --- Utility Functions ---
    const showSection = (sectionToShow) => {
        allSections.forEach(section => {
            if (section) {
                section.classList.add('hidden');
            }
        });
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
        }
        // Scroll to top might be useful
        window.scrollTo(0, 0);
    };

    const displayError = (message, container = resultsGrid) => {
        console.error("Error:", message);
        if (container) {
             container.innerHTML = `<p class="error-message">Error: ${message}. Please try again later.</p>`;
        } else {
            alert(`Error: ${message}`); // Fallback
        }
    };

    // --- API Call Functions ---

    // Fetch search results (via front-end proxy)
    const searchRecipes = async (query, minCal, maxCal) => {
        const params = new URLSearchParams();
        params.append('query', query);
        if (minCal) params.append('minCalories', minCal);
        if (maxCal) params.append('maxCalories', maxCal);

        // We use GET here as the proxy endpoint /api/meals supports GET
        const url = `${FRONTEND_BASE_URL}/api/meals?${params.toString()}`;

        try {
            const response = await fetch(url, { method: 'GET' }); // Change to GET
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json(); // The proxy endpoint returns JSON for GET
            lastSearchResults = data; // Assuming data is the array of results
            displaySearchResults(data);
            currentView = 'results';
        } catch (error) {
            displayError(`Failed to search recipes: ${error.message}`, resultsGrid);
            showSection(resultsSection); // Show results section even on error to display message
            currentView = 'results';
        }
    };

    // Get random recipe (via front-end proxy)
    const getRandomRecipe = async () => {
        // The front-end proxy /api/random uses POST, but fetches from back-end GET /api/random
        // Let's trigger the detail view directly after getting the ID
        try {
             // First, get the random recipe data (which includes the ID) from the backend via the frontend proxy
            const randomResponse = await fetch(`${FRONTEND_BASE_URL}/api/random`, { method: 'POST' });
             if (!randomResponse.ok) {
                 const errorData = await randomResponse.json().catch(() => ({ error: `HTTP error! status: ${randomResponse.status}` }));
                 throw new Error(errorData.error || `Failed to fetch random recipe info: Status ${randomResponse.status}`);
             }
             const meal = await randomResponse.json(); // Proxy returns the meal json directly

             if (meal && meal.id) {
                 // Now display this recipe directly
                 await getRecipeDetails(meal.id, true); // Pass flag indicating it's a random recipe
             } else {
                 throw new Error('Random recipe data is invalid.');
             }

        } catch (error) {
            displayError(`Failed to get random recipe: ${error.message}`, resultsGrid);
            showSection(resultsSection); // Show error in results area
            currentView = 'results';
        }
    };


    // Get full recipe details (via front-end proxy which calls back-end)
    const getRecipeDetails = async (mealId, isRandom = false) => {
        // We need to call the proxy's /api/recipe/info/<meal_id> which returns JSON
        const url = `${FRONTEND_BASE_URL}/api/recipe/info/${mealId}`;
        try {
             // Using GET as the proxy endpoint supports GET
            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.error || `Failed to fetch recipe details: Status ${response.status}`);
            }
            const mealData = await response.json();
            currentRecipeDetails = mealData; // Store for potential 'add to favorites'
            displayRecipeDetails(mealData);
            if (isRandom) {
                backToResultsBtn.classList.add('hidden'); // Hide back button if coming from random
            } else {
                 backToResultsBtn.classList.remove('hidden'); // Show back button if coming from results
            }
            currentView = 'detail';
        } catch (error) {
            displayError(`Failed to load recipe details: ${error.message}`);
            showSection(resultsSection); // Go back to results on error
             currentView = 'results';
        }
    };

    // Get price breakdown (via front-end proxy)
    const getPriceBreakdown = async (mealId) => {
        const url = `${FRONTEND_BASE_URL}/api/price_breakdown/${mealId}`;
         priceDetailsDiv.classList.remove('hidden');
         priceIngredientsUl.innerHTML = '<li>Loading...</li>';
         priceCostsUl.innerHTML = '';
         priceTotalP.textContent = 'Total Cost: calculating...';
         // priceWidgetImg.classList.add('hidden'); // Hide image initially

        try {
            // Use GET, as the proxy endpoint supports GET
            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
                 throw new Error(errorData.error || `Failed to fetch price breakdown: Status ${response.status}`);
            }
            const data = await response.json(); // Proxy returns JSON [ingredients, prices]

            if (data && Array.isArray(data) && data.length === 2) {
                 const [ingredients, prices] = data;
                 priceIngredientsUl.innerHTML = ingredients.map(ing => `<li>${ing}</li>`).join('');
                 priceCostsUl.innerHTML = prices.slice(0, -1).map(price => `<li>${price}</li>`).join(''); // Exclude total from prices list
                 priceTotalP.textContent = `Total Cost: ${prices[prices.length - 1] || 'N/A'}`;

                 // Optionally fetch and display the widget image too
                 // const widgetUrl = `${FRONTEND_BASE_URL}/api/price_breakdown_widget/${mealId}`;
                 // priceWidgetImg.src = widgetUrl;
                 // priceWidgetImg.classList.remove('hidden');

             } else {
                 throw new Error('Invalid price breakdown data format received.');
             }
        } catch (error) {
             displayError(`Failed to load price breakdown: ${error.message}`, priceIngredientsUl);
             priceCostsUl.innerHTML = '';
             priceTotalP.textContent = 'Total Cost: Error';
        }
    };

     // --- Favorite CRUD Operations (Directly to Backend API) ---

     // Fetch all favorites (via front-end proxy /get_test_data)
     const loadFavorites = async () => {
         const url = `${FRONTEND_BASE_URL}/get_test_data`; // Proxy endpoint
         try {
             const response = await fetch(url, { method: 'GET' }); // Use GET
             if (!response.ok) {
                 // This endpoint renders HTML, so handle non-OK differently
                 throw new Error(`Failed to load favorites page: Status ${response.status}`);
             }
             // Since the proxy returns HTML for this route, we can't easily get JSON.
             // For a SPA feel, ideally the backend /test endpoint should be called directly.
             // Let's call the backend /test directly for JSON data.
             const backendUrl = `${BACKEND_BASE_URL}/test`;
             const backendResponse = await fetch(backendUrl);
             if (!backendResponse.ok) {
                const errorData = await backendResponse.json().catch(() => ({ error: `HTTP error! status: ${backendResponse.status}` }));
                throw new Error(errorData.error || `Failed to fetch favorites: Status ${backendResponse.status}`);
             }
             const favorites = await backendResponse.json();
             displayFavorites(favorites);
             currentView = 'favorites';
         } catch (error) {
             displayError(`Failed to load favorites: ${error.message}`, favoritesList);
             showSection(favoritesSection); // Ensure section is visible for error message
             currentView = 'favorites';
         }
     };

    // Add recipe to favorites (using front-end proxy /add_to_favorites)
    const addFavorite = async (recipeData) => {
        if (!recipeData) {
            alert("No recipe details available to add.");
            return;
        }

        // Extract ingredients correctly
        const ingredients = Array.from(recipeData.extendedIngredients || []).map(ing => ing.original);

        const formData = new FormData();
        formData.append('recipe_title', recipeData.title || 'Untitled');
        formData.append('recipe_id', recipeData.id ? String(recipeData.id) : `custom_${Date.now()}`); // Ensure ID is string
        formData.append('recipe_instructions', recipeData.instructions || 'No instructions provided.');
        // Join ingredients array into a string (assuming backend expects a string)
        formData.append('recipe_ingredients', ingredients.join('\n'));
        formData.append('recipe_image', recipeData.image || '');

        const url = `${FRONTEND_BASE_URL}/add_to_favorites`; // Proxy endpoint

        try {
             // Use POST as defined in the proxy app
            const response = await fetch(url, {
                method: 'POST',
                body: formData // Sending as form data
            });
            const result = await response.json();
            if (!response.ok) {
                 throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }
            alert(result.message || "Recipe added to favorites!");
            addToFavoritesBtn.disabled = true; // Disable button after adding
            addToFavoritesBtn.textContent = "Added!";
        } catch (error) {
            displayError(`Failed to add to favorites: ${error.message}`);
            // Don't change section on error here
        }
    };

    // Create a new favorite recipe from scratch (direct to backend /create_recipe)
    const createFavorite = async (event) => {
        event.preventDefault();
        const formData = new FormData(createFavoriteForm);
        const url = `${BACKEND_BASE_URL}/create_recipe`; // Direct backend endpoint

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
             if (!response.ok) { // Check for 201 Created or other success codes if needed
                 throw new Error(result.error || `HTTP error! status: ${response.status}`);
             }
            alert(result.message || "Recipe created successfully!");
            createFavoriteModal.classList.add('hidden');
            createFavoriteForm.reset();
            loadFavorites(); // Refresh favorites list
        } catch (error) {
            displayError(`Failed to create recipe: ${error.message}`);
            // Keep modal open on error
        }
    };


     // Update favorite recipe instructions (direct to backend /update_recipe_instructions)
     const updateFavorite = async (event) => {
         event.preventDefault();
         const title = updateTitleInput.value;
         const instructions = updateInstructionsInput.value;
         const url = `${BACKEND_BASE_URL}/update_recipe_instructions`; // Direct backend endpoint

         try {
             const response = await fetch(url, {
                 method: 'PUT',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 // Backend expects r_title and r_instructions in JSON body
                 body: JSON.stringify({
                     r_title: title,
                     r_instructions: instructions
                 })
             });
             const result = await response.json();
             if (!response.ok) {
                 throw new Error(result.error || `HTTP error! status: ${response.status}`);
             }
             alert(result.message || "Instructions updated successfully!");
             updateFavoriteModal.classList.add('hidden');
             loadFavorites(); // Refresh favorites list
         } catch (error) {
             displayError(`Failed to update recipe: ${error.message}`);
             // Keep modal open on error
         }
     };

    // Delete favorite recipe (direct to backend /delete_recipe)
    const deleteFavorite = async (recipeTitle) => {
        if (!confirm(`Are you sure you want to delete the recipe "${recipeTitle}"?`)) {
            return;
        }
        const url = `${BACKEND_BASE_URL}/delete_recipe`; // Direct backend endpoint

        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Backend expects r_title in JSON body
                body: JSON.stringify({ r_title: recipeTitle })
            });
            const result = await response.json();
            if (!response.ok) {
                 throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }
            alert(result.message || "Recipe deleted successfully!");
            loadFavorites(); // Refresh favorites list
        } catch (error) {
            displayError(`Failed to delete recipe: ${error.message}`);
            // Show error, but don't change view
        }
    };

    // --- DOM Manipulation Functions ---

    const createRecipeCard = (recipe, isFavorite = false) => {
        const card = document.createElement('article');
        card.classList.add('recipe-card');
        // Use different keys for search results vs favorites
        const title = isFavorite ? recipe.title : recipe.title;
        const image = isFavorite ? recipe.image : recipe.image; // Assuming favorite has 'image', search has 'image'
        const id = isFavorite ? recipe.recipe_id : recipe.id; // Favorites use 'recipe_id', search uses 'id'

        card.innerHTML = `
            <img src="${image || 'placeholder.jpg'}" alt="${title}" loading="lazy">
            <div class="recipe-card-content">
                <h3>${title}</h3>
                <div class="button-group">
                    ${!isFavorite ? `<button class="btn btn-primary view-details-btn" data-id="${id}">View Details</button>` : ''}
                     ${isFavorite ? `<button class="btn btn-primary view-fav-details-btn" data-id="${id}" data-title="${title}">View Details</button>` : ''}
                    ${isFavorite ? `<button class="btn btn-secondary update-fav-btn" data-title="${title}">Update</button>` : ''}
                    ${isFavorite ? `<button class="btn btn-danger delete-fav-btn" data-title="${title}">Delete</button>` : ''}
                </div>
            </div>
        `;

         // Add event listeners for buttons within the card
         if (!isFavorite) {
             card.querySelector('.view-details-btn').addEventListener('click', () => getRecipeDetails(id));
         } else {
             card.querySelector('.view-fav-details-btn').addEventListener('click', () => {
                 // Need to fetch favorite details separately if needed, or display stored info
                 // Let's assume clicking view on a favorite shows the stored data for simplicity now
                 // Or better: fetch its details using the ID. Let's try fetching.
                 getRecipeDetails(id); // Use the standard detail fetcher
             });
             card.querySelector('.update-fav-btn').addEventListener('click', () => {
                // Pre-fill and show update modal
                updateTitleInput.value = title;
                // Find the current instructions (need the full favorite object here)
                // This requires the `loadFavorites` function to store the full objects or refetch
                // Let's assume `recipe.instructions` exists from the loaded favorites data
                updateInstructionsInput.value = recipe.instructions || '';
                updateFavoriteModal.classList.remove('hidden');
             });
             card.querySelector('.delete-fav-btn').addEventListener('click', () => deleteFavorite(title));
         }

        return card;
    };

    const displaySearchResults = (results) => {
        showSection(resultsSection);
        resultsGrid.innerHTML = ''; // Clear previous results
        if (!results || results.length === 0) {
            resultsGrid.innerHTML = '<p>No recipes found. Try different keywords or adjust calories.</p>';
            backToSearchBtn.classList.remove('hidden');
            return;
        }
        results.forEach(recipe => {
            resultsGrid.appendChild(createRecipeCard(recipe, false));
        });
         backToSearchBtn.classList.remove('hidden'); // Show back button
    };

    const displayRecipeDetails = (meal) => {
        showSection(recipeDetailSection);
        recipeTitle.textContent = meal.title || 'Recipe Details';
        recipeImage.src = meal.image || 'placeholder.jpg';
        recipeImage.alt = meal.title || 'Recipe Image';
        recipeSummary.innerHTML = meal.summary || 'No summary available.'; // Use innerHTML for potential HTML tags

        // Ingredients
        recipeIngredients.innerHTML = '';
        if (meal.extendedIngredients && meal.extendedIngredients.length > 0) {
            meal.extendedIngredients.forEach(ing => {
                const li = document.createElement('li');
                li.textContent = ing.original;
                recipeIngredients.appendChild(li);
            });
        } else {
            recipeIngredients.innerHTML = '<li>Ingredients not available.</li>';
        }

        // Instructions
        if (meal.instructions) {
             // Spoonacular instructions can contain HTML, so use innerHTML
             recipeInstructions.innerHTML = meal.instructions;
        } else if (meal.analyzedInstructions && meal.analyzedInstructions.length > 0) {
            // Fallback to analyzed instructions if plain instructions aren't available
            let instructionsHtml = '<ol>';
            meal.analyzedInstructions[0].steps.forEach(step => {
                instructionsHtml += `<li>${step.step}</li>`;
            });
            instructionsHtml += '</ol>';
            recipeInstructions.innerHTML = instructionsHtml;
        } else {
            recipeInstructions.innerHTML = '<p>Instructions not available.</p>';
        }

        // Reset and prepare Price Breakdown button
        fetchPriceBtn.disabled = false;
        fetchPriceBtn.textContent = 'Show Price Breakdown';
        fetchPriceBtn.dataset.id = meal.id;
        priceDetailsDiv.classList.add('hidden'); // Hide details initially
        priceIngredientsUl.innerHTML = '';
        priceCostsUl.innerHTML = '';
        priceTotalP.textContent = '';
       // priceWidgetImg.classList.add('hidden');

        // Reset and prepare Add to Favorites button
        addToFavoritesBtn.disabled = false;
        addToFavoritesBtn.textContent = 'Add to Favorites';
        addToFavoritesBtn.onclick = () => addFavorite(meal); // Use current meal data

    };

    const displayFavorites = (favoritesData) => {
         showSection(favoritesSection);
         favoritesList.innerHTML = ''; // Clear previous list
         // The backend /test returns a dictionary { title: {details} }
         const favoritesArray = Object.values(favoritesData);

         if (!favoritesArray || favoritesArray.length === 0) {
             favoritesList.innerHTML = '<p>You haven\'t saved any favorite recipes yet.</p>';
             return;
         }
         favoritesArray.forEach(recipe => {
             favoritesList.appendChild(createRecipeCard(recipe, true)); // Pass true for isFavorite
         });
     };


    // --- Event Listeners ---
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchQueryInput.value.trim();
        const minCal = minCaloriesInput.value.trim();
        const maxCal = maxCaloriesInput.value.trim();
        if (query) {
            searchRecipes(query, minCal, maxCal);
        } else {
            alert("Please enter a search term.");
        }
    });

    randomRecipeBtn.addEventListener('click', getRandomRecipe);

    fetchPriceBtn.addEventListener('click', (e) => {
         const mealId = e.target.dataset.id;
         if (mealId) {
             getPriceBreakdown(mealId);
             e.target.disabled = true; // Prevent multiple clicks while loading
             e.target.textContent = 'Loading Price...';
         }
    });

     // Navigation
     homeLink.addEventListener('click', (e) => {
         e.preventDefault();
         showSection(searchSection);
         currentView = 'search';
     });
     navSearchLink.addEventListener('click', (e) => {
         e.preventDefault();
         // If already in results or detail, just go back to search form
         showSection(searchSection);
         currentView = 'search';
     });
     navFavoritesLink.addEventListener('click', (e) => {
         e.preventDefault();
         loadFavorites(); // Fetch and display favorites
     });

     // Back buttons
     backToSearchBtn.addEventListener('click', () => {
         showSection(searchSection);
         currentView = 'search';
     });
      backToResultsBtn.addEventListener('click', () => {
         if (lastSearchResults.length > 0) {
             displaySearchResults(lastSearchResults); // Re-display last results
             currentView = 'results';
         } else {
             showSection(searchSection); // Fallback to search if no results history
             currentView = 'search';
         }
     });

     // Modals
     createNewFavoriteBtn.addEventListener('click', () => {
         createFavoriteForm.reset();
         createFavoriteModal.classList.remove('hidden');
     });

    // Close modal buttons (delegated listener or direct as in HTML)
    document.querySelectorAll('.modal .close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.add('hidden');
        });
    });
    // Close modal if clicking outside the content
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
        }
    });

    // Form submissions for modals
    createFavoriteForm.addEventListener('submit', createFavorite);
    updateFavoriteForm.addEventListener('submit', updateFavorite);


    // --- Initialization ---
    showSection(searchSection); // Start on the search page
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    // Optional: Check backend status on load
    // checkBackendStatus(); // Implement checkBackendStatus if needed
});

// Helper function to check backend status (optional)
// async function checkBackendStatus() {
//     const statusSpan = document.getElementById('backend-status');
//     if (!statusSpan) return;
//     try {
//         const response = await fetch('http://localhost:5001/check_backend'); // Call proxy checker
//         const text = await response.text();
//         statusSpan.textContent = text;
//         statusSpan.style.color = response.ok ? 'var(--success-color)' : 'var(--primary-color)';
//     } catch (error) {
//         statusSpan.textContent = 'Error connecting to backend.';
//         statusSpan.style.color = 'var(--primary-color)';
//     }
// }