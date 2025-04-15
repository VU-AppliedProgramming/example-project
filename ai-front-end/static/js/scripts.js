document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const searchForm = document.getElementById('search-form');
    const searchResults = document.getElementById('search-results');
    const searchLoader = document.getElementById('search-loader');
    const noResults = document.getElementById('no-results');
    const randomRecipeBtn = document.getElementById('random-recipe-btn');
    const randomRecipeResult = document.getElementById('random-recipe-result');
    const randomRecipeLoader = document.getElementById('random-recipe-loader');
    const refreshFavoritesBtn = document.getElementById('refresh-favorites');
    const favoritesList = document.getElementById('favorites-list');
    const favoritesLoader = document.getElementById('favorites-loader');
    const noFavorites = document.getElementById('no-favorites');
    const createRecipeBtn = document.getElementById('create-recipe-btn');

    // Modals
    const recipeModal = document.getElementById('recipe-modal');
    const recipeDetailContent = document.getElementById('recipe-detail-content');
    const closeModal = recipeModal.querySelector('.close-modal'); // Corrected selector
    const addToFavoritesBtn = document.getElementById('add-to-favorites-btn');

    const createRecipeModal = document.getElementById('create-recipe-modal');
    const createRecipeForm = document.getElementById('create-recipe-form');
    const closeCreateModal = createRecipeModal.querySelector('.close-create-modal'); // Corrected selector

    const editRecipeModal = document.getElementById('edit-recipe-modal');
    const editRecipeForm = document.getElementById('edit-recipe-form');
    const closeEditModal = editRecipeModal.querySelector('.close-edit-modal'); // Corrected selector

    const priceBreakdownModal = document.getElementById('price-breakdown-modal');
    const priceBreakdownImg = document.getElementById('price-breakdown-img');
    const priceBreakdownData = document.getElementById('price-breakdown-data');
    const closePriceModal = priceBreakdownModal.querySelector('.close-price-modal'); // Corrected selector

    // Notification
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');

    // Timer elements
    const timerMinutes = document.getElementById('minutes');
    const timerSeconds = document.getElementById('seconds');
    const timerMinutesInput = document.getElementById('timer-minutes');
    const timerSecondsInput = document.getElementById('timer-seconds');
    const timerStartBtn = document.getElementById('timer-start');
    const timerPauseBtn = document.getElementById('timer-pause');
    const timerResetBtn = document.getElementById('timer-reset');

    // Current recipe for modal
    let currentRecipe = null;

    // Timer variables
    let timerInterval = null; // Renamed from timer for clarity
    let totalSeconds = 0;
    let isTimerRunning = false;

    // Navigation active state
    const navLinks = document.querySelectorAll('nav ul li a');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Prevent default jump
            // e.preventDefault();
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
            // Smooth scroll if href is an ID
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // --- Helper Functions ---

    function showNotification(message, isError = false) {
        notificationMessage.textContent = message;
        notification.className = 'notification show';
        if (isError) {
            notification.classList.add('error');
        } else {
            notification.classList.remove('error');
        }
        setTimeout(() => {
            notification.className = 'notification';
        }, 3000); // Hide after 3 seconds
    }

    function showLoader(loaderElement) {
        if (loaderElement) loaderElement.style.display = 'block';
    }

    function hideLoader(loaderElement) {
        if (loaderElement) loaderElement.style.display = 'none';
    }

    // --- Search Functionality ---

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const query = document.getElementById('search-query').value.trim();
        const minCalories = document.getElementById('min-calories').value;
        const maxCalories = document.getElementById('max-calories').value;

        if (!query) {
            showNotification('Please enter a search term.', true);
            return;
        }

        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        noResults.style.display = 'none';
        showLoader(searchLoader);

        let url = `/api/meals?query=${encodeURIComponent(query)}`;

        if (minCalories && maxCalories) {
            url += `&minCalories=${minCalories}&maxCalories=${maxCalories}`;
        } else if (minCalories) {
            url += `&minCalories=${minCalories}`;
        } else if (maxCalories) {
            url += `&maxCalories=${maxCalories}`;
        }


        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                hideLoader(searchLoader);
                if (data.results && data.results.length > 0) {
                    displaySearchResults(data.results);
                    searchResults.style.display = 'grid';
                } else {
                    noResults.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Error fetching search results:', error);
                hideLoader(searchLoader);
                showNotification('Error fetching search results. Please try again.', true);
            });
    });

    function displaySearchResults(results) {
        searchResults.innerHTML = ''; // Clear previous results

        results.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            recipeCard.innerHTML = `
                <div class="recipe-image">
                    <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
                </div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-actions">
                        <button class="action-btn view-recipe" data-id="${recipe.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </div>
            `;

            searchResults.appendChild(recipeCard);

            // Add event listener to view button
            recipeCard.querySelector('.view-recipe').addEventListener('click', function() {
                const recipeId = this.getAttribute('data-id');
                fetchRecipeDetails(recipeId);
            });
        });
    }

    // --- Random Recipe Functionality ---

    randomRecipeBtn.addEventListener('click', function() {
        randomRecipeResult.innerHTML = '';
        randomRecipeResult.style.display = 'none';
        showLoader(randomRecipeLoader);

        fetch('/api/random')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                hideLoader(randomRecipeLoader);
                if (data && data.id) {
                    displayRandomRecipe(data);
                    randomRecipeResult.style.display = 'block';
                } else {
                    throw new Error("Invalid random recipe data received.");
                }
            })
            .catch(error => {
                console.error('Error fetching random recipe:', error);
                hideLoader(randomRecipeLoader);
                showNotification('Error fetching random recipe. Please try again.', true);
            });
    });

    function displayRandomRecipe(recipe) {
        // Basic check for essential properties
        const imageUrl = recipe.image || 'static/images/placeholder.png'; // Fallback image
        const title = recipe.title || 'Unknown Recipe';
        const readyInMinutes = recipe.readyInMinutes || 'N/A';
        const servings = recipe.servings || 'N/A';

        randomRecipeResult.innerHTML = `
            <div class="recipe-detail-image">
                <img src="${imageUrl}" alt="${title}">
            </div>
            <div class="recipe-detail-content">
                <h2 class="recipe-detail-title">${title}</h2>
                <div class="recipe-stats">
                    <div class="recipe-stat"><i class="fas fa-clock"></i> Ready in ${readyInMinutes} min</div>
                    <div class="recipe-stat"><i class="fas fa-utensils"></i> Serves ${servings}</div>
                    ${recipe.vegetarian ? '<div class="recipe-stat"><i class="fas fa-leaf"></i> Vegetarian</div>' : ''}
                    ${recipe.vegan ? '<div class="recipe-stat"><i class="fas fa-seedling"></i> Vegan</div>' : ''}
                    ${recipe.glutenFree ? '<div class="recipe-stat"><i class="fas fa-bread-slice"></i> Gluten-Free</div>' : ''}
                    ${recipe.dairyFree ? '<div class="recipe-stat"><i class="fas fa-cheese"></i> Dairy-Free</div>' : ''}
                </div>
                <div class="recipe-actions-large">
                    <button class="btn btn-primary view-full-recipe" data-id="${recipe.id}">
                        <i class="fas fa-eye"></i> View Full Recipe
                    </button>
                    <button class="btn btn-secondary view-price-breakdown" data-id="${recipe.id}">
                        <i class="fas fa-dollar-sign"></i> Price Breakdown
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        const viewFullBtn = randomRecipeResult.querySelector('.view-full-recipe');
        if (viewFullBtn) {
            viewFullBtn.addEventListener('click', function() {
                const recipeId = this.getAttribute('data-id');
                fetchRecipeDetails(recipeId);
            });
        }

        const priceBreakdownBtn = randomRecipeResult.querySelector('.view-price-breakdown');
        if (priceBreakdownBtn) {
            priceBreakdownBtn.addEventListener('click', function() {
                const recipeId = this.getAttribute('data-id');
                viewPriceBreakdown(recipeId);
            });
        }
    }

    // --- Recipe Detail Modal Functionality ---

    function fetchRecipeDetails(recipeId) {
        recipeDetailContent.innerHTML = '<div class="loader-small"></div>'; // Show a small loader inside modal
        recipeModal.style.display = 'block';
        currentRecipe = null; // Reset current recipe

        fetch(`/api/recipe/info/${recipeId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.id) {
                    currentRecipe = data; // Store the fetched recipe details
                    displayRecipeDetails(data);
                } else {
                    throw new Error("Invalid recipe detail data received.");
                }
            })
            .catch(error => {
                console.error('Error fetching recipe details:', error);
                recipeDetailContent.innerHTML = '<p class="error-message">Error loading recipe details. Please try again.</p>';
                showNotification('Error fetching recipe details.', true);
            });
    }

    function displayRecipeDetails(recipe) {
        // Extract ingredients safely
        const ingredients = (recipe.extendedIngredients || []).map(ingredient => ingredient.original || 'Unknown ingredient');

        // Extract instructions safely
        let instructions = [];
        if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0 && recipe.analyzedInstructions[0].steps) {
            instructions = recipe.analyzedInstructions[0].steps.map(step => step.step || 'Instruction step missing');
        } else if (recipe.instructions) {
            // Basic split for plain text instructions
            instructions = recipe.instructions.split('\n').map(line => line.trim()).filter(line => line);
        }
         if (instructions.length === 0) {
            instructions.push("No instructions available for this recipe.");
        }


        const imageUrl = recipe.image || 'static/images/placeholder.png';
        const title = recipe.title || 'Unknown Recipe';
        const readyInMinutes = recipe.readyInMinutes || 'N/A';
        const servings = recipe.servings || 'N/A';

        // *** COMPLETE THE HTML STRUCTURE HERE ***
        recipeDetailContent.innerHTML = `
            <div class="recipe-detail-image">
                <img src="${imageUrl}" alt="${title}">
            </div>
            <div class="recipe-detail-main-content">
                <h2 class="recipe-detail-title">${title}</h2>
                <div class="recipe-stats">
                    <div class="recipe-stat"><i class="fas fa-clock"></i> Ready in ${readyInMinutes} min</div>
                    <div class="recipe-stat"><i class="fas fa-utensils"></i> Serves ${servings}</div>
                    ${recipe.vegetarian ? '<div class="recipe-stat"><i class="fas fa-leaf"></i> Vegetarian</div>' : ''}
                    ${recipe.vegan ? '<div class="recipe-stat"><i class="fas fa-seedling"></i> Vegan</div>' : ''}
                    ${recipe.glutenFree ? '<div class="recipe-stat"><i class="fas fa-bread-slice"></i> Gluten-Free</div>' : ''}
                    ${recipe.dairyFree ? '<div class="recipe-stat"><i class="fas fa-cheese"></i> Dairy-Free</div>' : ''}
                </div>

                <div class="recipe-detail-section">
                    <h3>Ingredients</h3>
                    <ul class="ingredients-list">
                        ${ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                </div>

                <div class="recipe-detail-section">
                    <h3>Instructions</h3>
                    <ol class="instructions-list">
                        ${instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                    </ol>
                </div>
                 <div class="recipe-actions-large modal-specific-actions">
                     <button class="btn btn-secondary view-price-breakdown" data-id="${recipe.id}">
                          <i class="fas fa-dollar-sign"></i> Price Breakdown
                      </button>
                 </div>
            </div>
        `; // *** END OF COMPLETED HTML ***

        // *** ADD EVENT LISTENER FOR PRICE BREAKDOWN BUTTON WITHIN MODAL ***
        const priceBreakdownBtnModal = recipeDetailContent.querySelector('.view-price-breakdown');
         if (priceBreakdownBtnModal) {
            priceBreakdownBtnModal.addEventListener('click', function() {
                 const recipeId = this.getAttribute('data-id');
                 viewPriceBreakdown(recipeId);
             });
        } else {
             console.warn("Price breakdown button not found inside recipe detail modal content.");
        }
    }


    // --- Price Breakdown Modal Functionality ---

    function viewPriceBreakdown(recipeId) {
        // Show modal and potentially a loader
        priceBreakdownModal.style.display = 'block';
        priceBreakdownImg.style.display = 'none'; // Hide previous image
        priceBreakdownData.innerHTML = '<div class="loader-small"></div>'; // Show loader

        // Set the image source directly - browser fetches it
        priceBreakdownImg.src = `/api/price_breakdown_widget/${recipeId}`;
        priceBreakdownImg.onload = () => { priceBreakdownImg.style.display = 'block'; }; // Show when loaded
        priceBreakdownImg.onerror = () => {
            priceBreakdownImg.style.display = 'none'; // Hide if error
            // Optionally show a placeholder or error message for the image
            console.error('Failed to load price breakdown image.');
        };


        // Fetch the structured price data
        fetch(`/api/price_breakdown/${recipeId}`)
            .then(response => {
                 if (!response.ok) {
                     throw new Error(`HTTP error! status: ${response.status}`);
                 }
                return response.json();
            })
            .then(data => {
                // Data should be [ingredients, prices]
                if (Array.isArray(data) && data.length === 2 && Array.isArray(data[0]) && Array.isArray(data[1])) {
                     const ingredients = data[0];
                     const prices = data[1];

                    // Check if data looks reasonable (skip title/total if present)
                     let dataHtml = '<dl class="price-breakdown-list">';
                     let hasData = false;
                     for (let i = 0; i < ingredients.length; i++) {
                         // Simple check to skip summary lines often included by the backend parser
                         if (ingredients[i] && prices[i] && !ingredients[i].toLowerCase().includes('total')) {
                             dataHtml += `<dt>${ingredients[i]}</dt><dd>${prices[i]}</dd>`;
                             hasData = true;
                         }
                     }
                     dataHtml += '</dl>';

                    if (hasData) {
                        priceBreakdownData.innerHTML = dataHtml;
                    } else {
                        priceBreakdownData.innerHTML = '<p>Price breakdown data is not available or empty.</p>';
                    }
                } else {
                    throw new Error('Invalid price breakdown data format received.');
                }
            })
            .catch(error => {
                console.error('Error fetching price breakdown data:', error);
                priceBreakdownData.innerHTML = '<p class="error-message">Could not load price breakdown details.</p>';
                // Optionally hide the image as well if data fails
                // priceBreakdownImg.style.display = 'none';
            });
    }

    // --- Favorites Functionality ---

    function loadFavorites() {
        favoritesList.innerHTML = '';
        favoritesList.style.display = 'none';
        noFavorites.style.display = 'none';
        showLoader(favoritesLoader);

        fetch('/test') // Assuming '/test' fetches all favorites
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
             })
            .then(data => {
                hideLoader(favoritesLoader);
                 if (data && Object.keys(data).length > 0) {
                    displayFavorites(data);
                    favoritesList.style.display = 'grid';
                 } else {
                    noFavorites.style.display = 'block';
                 }
             })
            .catch(error => {
                console.error('Error fetching favorites:', error);
                hideLoader(favoritesLoader);
                showNotification('Could not load your favorite recipes.', true);
                noFavorites.textContent = 'Error loading favorites.';
                noFavorites.style.display = 'block';
             });
     }

    function displayFavorites(recipes) {
        favoritesList.innerHTML = ''; // Clear previous favorites
        Object.values(recipes).forEach(recipe => { // Iterate through recipe objects
             const recipeCard = document.createElement('div');
             recipeCard.className = 'recipe-card favorite-card'; // Add specific class if needed
             recipeCard.innerHTML = `
                <div class="recipe-image">
                     <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
                 </div>
                 <div class="recipe-content">
                     <h3 class="recipe-title">${recipe.title}</h3>
                     </div>
                 <div class="recipe-actions">
                     <button class="action-btn view-fav-recipe" data-id="${recipe.recipe_id}" data-title="${recipe.title}">
                         <i class="fas fa-eye"></i> View
                     </button>
                      <button class="action-btn edit-recipe" data-title="${recipe.title}">
                          <i class="fas fa-edit"></i> Edit
                      </button>
                      <button class="action-btn delete-recipe" data-title="${recipe.title}">
                          <i class="fas fa-trash-alt"></i> Delete
                      </button>
                 </div>
             `;
             favoritesList.appendChild(recipeCard);

             // Add event listeners for favorite actions
            recipeCard.querySelector('.view-fav-recipe').addEventListener('click', function() {
                const recipeId = this.getAttribute('data-id');
                // If favorite recipe only has basic info, fetch full details
                 if (recipeId && recipeId !== 'null' && !isNaN(parseInt(recipeId))) { // Check if it's a valid Spoonacular ID
                    fetchRecipeDetails(recipeId);
                 } else {
                     // If it's a user-created recipe without a Spoonacular ID, display from local data
                     displayFavoriteDetails(recipe); // You'll need to create this function
                 }
             });

             recipeCard.querySelector('.edit-recipe').addEventListener('click', function() {
                 openEditModal(recipe); // Pass the full recipe object
             });

             recipeCard.querySelector('.delete-recipe').addEventListener('click', function() {
                 const titleToDelete = this.getAttribute('data-title');
                 if (confirm(`Are you sure you want to delete "${titleToDelete}"?`)) {
                     deleteFavorite(titleToDelete);
                 }
             });
         });
     }

     // Function to display details for a favorite (especially user-created ones)
     function displayFavoriteDetails(recipe) {
        currentRecipe = recipe; // Set as current recipe for potential actions
        recipeDetailContent.innerHTML = `
            <div class="recipe-detail-image">
                <img src="${recipe.image}" alt="${recipe.title}">
            </div>
            <div class="recipe-detail-main-content">
                <h2 class="recipe-detail-title">${recipe.title}</h2>
                 </div>

                 <div class="recipe-detail-section">
                    <h3>Ingredients</h3>
                     <ul class="ingredients-list">
                         ${(recipe.ingredients || '').split('\n').map(item => item.trim()).filter(item => item).map(ingredient => `<li>${ingredient}</li>`).join('') || '<li>No ingredients listed.</li>'}
                     </ul>
                 </div>

                 <div class="recipe-detail-section">
                    <h3>Instructions</h3>
                     <ol class="instructions-list">
                         ${(recipe.instructions || '').split('\n').map(item => item.trim()).filter(item => item).map(instruction => `<li>${instruction}</li>`).join('') || '<li>No instructions listed.</li>'}
                     </ol>
                 </div>
                </div>
             `;
        recipeModal.style.display = 'block';
        // Hide 'Add to Favorites' button for favorites modal if it's already a favorite
        addToFavoritesBtn.style.display = 'none';
    }

    // Refresh Favorites Button
    refreshFavoritesBtn.addEventListener('click', loadFavorites);


    // *** ADD TO FAVORITES BUTTON LOGIC ***
    addToFavoritesBtn.addEventListener('click', function() {
         if (!currentRecipe || !currentRecipe.id) {
             showNotification('No recipe selected or recipe data missing.', true);
             return;
         }

         // Prepare data for the backend
        const formData = new FormData();
        formData.append('recipe_title', currentRecipe.title);
        formData.append('recipe_id', currentRecipe.id); // Use Spoonacular ID
        formData.append('recipe_image', currentRecipe.image || '');

        // Format ingredients and instructions as simple strings (newline separated)
        const ingredientsString = (currentRecipe.extendedIngredients || []).map(ing => ing.original).join('\n');
         let instructionsString = '';
         if (currentRecipe.analyzedInstructions && currentRecipe.analyzedInstructions.length > 0 && currentRecipe.analyzedInstructions[0].steps) {
             instructionsString = currentRecipe.analyzedInstructions[0].steps.map(step => step.step).join('\n');
         } else if (currentRecipe.instructions) {
            instructionsString = currentRecipe.instructions; // Assume it's already a suitable string
         }

        formData.append('recipe_ingredients', ingredientsString);
        formData.append('recipe_instructions', instructionsString);


        // Send request to backend
         fetch('/add_to_favorites', {
             method: 'POST',
             body: formData
         })
         .then(response => response.json())
         .then(data => {
             if (data.message) {
                 showNotification(data.message);
                 recipeModal.style.display = 'none'; // Close modal on success
                 loadFavorites(); // Refresh the favorites list
             } else if (data.error) {
                 showNotification(data.error, true);
             } else {
                 showNotification('An unknown error occurred.', true);
             }
         })
         .catch(error => {
             console.error('Error adding to favorites:', error);
             showNotification('Failed to add recipe to favorites. Check console.', true);
         });
     });

    // --- Create Recipe Modal ---
     createRecipeBtn.addEventListener('click', () => {
        createRecipeForm.reset(); // Clear form
        createRecipeModal.style.display = 'block';
    });

     createRecipeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);

         // Basic validation (can be enhanced)
         if (!formData.get('r_title') || !formData.get('r_id') || !formData.get('r_ingredients') || !formData.get('r_instructions') || !formData.get('r_image')) {
            showNotification('Please fill in all fields.', true);
            return;
         }


        fetch('/create_recipe', {
             method: 'POST',
             body: formData
         })
        .then(response => {
             // Check status code for success (201) or conflict (409)
             if (response.status === 201) {
                 return response.json().then(data => ({ success: true, message: data.message }));
             } else if (response.status === 409) {
                 return response.json().then(data => ({ success: false, message: data.error }));
             } else {
                 // Other errors
                 return response.json().then(data => Promise.reject(data.error || 'Failed to create recipe.'));
             }
         })
        .then(result => {
            showNotification(result.message, !result.success);
             if (result.success) {
                 createRecipeModal.style.display = 'none';
                 loadFavorites(); // Refresh list
             }
         })
         .catch(error => {
            console.error('Error creating recipe:', error);
            showNotification(`Error: ${error}`, true);
         });
     });

    // --- Edit Recipe Modal ---
    function openEditModal(recipe) {
        // Populate the edit form
         document.getElementById('edit_r_title').value = recipe.title; // Hidden input stores title
        document.getElementById('edit_r_instructions').value = recipe.instructions || ''; // Populate textarea
        editRecipeModal.style.display = 'block';
     }

     editRecipeForm.addEventListener('submit', function(e) {
         e.preventDefault();
         const titleToUpdate = document.getElementById('edit_r_title').value;
         const newInstructions = document.getElementById('edit_r_instructions').value;

         if (!titleToUpdate || newInstructions.trim() === '') {
             showNotification('Instructions cannot be empty.', true);
             return;
         }

        fetch('/update_recipe_instructions', {
             method: 'PUT',
             headers: {
                 'Content-Type': 'application/json',
             },
             body: JSON.stringify({
                 r_title: titleToUpdate,
                 r_instructions: newInstructions
             })
         })
         .then(response => {
             if (response.status === 200) {
                 return response.json().then(data => ({ success: true, message: data.message }));
             } else if (response.status === 404) {
                 return response.json().then(data => ({ success: false, message: data.error }));
             } else {
                 return response.json().then(data => Promise.reject(data.error || 'Failed to update recipe.'));
             }
         })
         .then(result => {
            showNotification(result.message, !result.success);
             if (result.success) {
                 editRecipeModal.style.display = 'none';
                 loadFavorites(); // Refresh list
             }
         })
         .catch(error => {
            console.error('Error updating recipe:', error);
            showNotification(`Error: ${error}`, true);
         });
     });


    // --- Delete Favorite Recipe ---
    function deleteFavorite(recipeTitle) {
        fetch('/delete_recipe', {
             method: 'DELETE',
             headers: {
                 'Content-Type': 'application/json',
             },
             body: JSON.stringify({ r_title: recipeTitle })
         })
        .then(response => {
             if (response.status === 200) {
                 return response.json().then(data => ({ success: true, message: data.message }));
             } else if (response.status === 404) {
                 return response.json().then(data => ({ success: false, message: data.error }));
             } else {
                 return response.json().then(data => Promise.reject(data.error || 'Failed to delete recipe.'));
             }
         })
        .then(result => {
            showNotification(result.message, !result.success);
             if (result.success) {
                 loadFavorites(); // Refresh the list
             }
         })
         .catch(error => {
            console.error('Error deleting recipe:', error);
            showNotification(`Error: ${error}`, true);
         });
     }


    // --- Modal Closing Logic ---
     function closeModalHandler(modal) {
         modal.style.display = 'none';
         // Reset specific modal states if necessary
         if (modal === recipeModal) {
            recipeDetailContent.innerHTML = ''; // Clear content
            currentRecipe = null; // Clear current recipe
            addToFavoritesBtn.style.display = 'block'; // Ensure add button is visible again by default
         }
         if (modal === priceBreakdownModal) {
             priceBreakdownImg.src = ''; // Clear image
             priceBreakdownData.innerHTML = ''; // Clear data
         }
     }

    closeModal.addEventListener('click', () => closeModalHandler(recipeModal));
    closeCreateModal.addEventListener('click', () => closeModalHandler(createRecipeModal));
    closeEditModal.addEventListener('click', () => closeModalHandler(editRecipeModal));
    closePriceModal.addEventListener('click', () => closeModalHandler(priceBreakdownModal));

     // Close modal if clicking outside the content
    window.addEventListener('click', function(event) {
        if (event.target === recipeModal) closeModalHandler(recipeModal);
        if (event.target === createRecipeModal) closeModalHandler(createRecipeModal);
        if (event.target === editRecipeModal) closeModalHandler(editRecipeModal);
        if (event.target === priceBreakdownModal) closeModalHandler(priceBreakdownModal);
     });

    // --- Cooking Timer Functionality ---

     function updateTimerDisplay() {
         const minutes = Math.floor(totalSeconds / 60);
         const seconds = totalSeconds % 60;
         timerMinutes.textContent = String(minutes).padStart(2, '0');
         timerSeconds.textContent = String(seconds).padStart(2, '0');
     }

    function startTimer() {
        if (isTimerRunning) return; // Prevent multiple intervals

        const minutes = parseInt(timerMinutesInput.value) || 0;
        const seconds = parseInt(timerSecondsInput.value) || 0;
        totalSeconds = (minutes * 60) + seconds;

         if (totalSeconds <= 0) {
            showNotification("Please set a valid timer duration.", true);
            return;
        }

        isTimerRunning = true;
        timerStartBtn.disabled = true;
        timerPauseBtn.disabled = false;
        timerMinutesInput.disabled = true;
        timerSecondsInput.disabled = true;

        updateTimerDisplay(); // Show initial time

        timerInterval = setInterval(() => {
             totalSeconds--;
             if (totalSeconds < 0) {
                 resetTimer();
                 showNotification("Time's up!", false);
                 // Optional: Play a sound
                 // const alarm = new Audio('path/to/alarm.mp3');
                 // alarm.play();
             } else {
                 updateTimerDisplay();
             }
         }, 1000);
     }

     function pauseTimer() {
         if (!isTimerRunning) return;
         clearInterval(timerInterval);
         isTimerRunning = false;
         timerStartBtn.disabled = false;
         timerPauseBtn.disabled = true;
         timerStartBtn.textContent = 'Resume'; // Change button text
     }

     function resetTimer() {
         clearInterval(timerInterval);
         isTimerRunning = false;
         totalSeconds = 0;
         timerMinutesInput.value = 5; // Default back to 5 mins
         timerSecondsInput.value = 0;
         updateTimerDisplay(); // Display 00:00
        timerStartBtn.disabled = false;
        timerPauseBtn.disabled = true;
        timerStartBtn.textContent = 'Start'; // Reset button text
         timerMinutesInput.disabled = false;
        timerSecondsInput.disabled = false;

    }

    timerStartBtn.addEventListener('click', startTimer);
    timerPauseBtn.addEventListener('click', pauseTimer);
    timerResetBtn.addEventListener('click', resetTimer);

    // --- Initial Load ---
    loadFavorites(); // Load favorites when the page loads
    updateTimerDisplay(); // Initialize timer display

}); // End of DOMContentLoaded