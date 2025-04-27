/* FeastFinder front-end – updated for new back-end routes (2025-04-27) */
document.addEventListener('DOMContentLoaded', () => {

    /* ───────────────────────────── CONSTANTS ──────────────────────────── */
    const FAVORITES_BASE      = '/feastFinder/recipes/favorites/';
    const ADD_FAVORITE_URL    = '/feastFinder/recipes/favorites/add_to_favorites';
    const CREATE_RECIPE_URL   = '/feastFinder/recipe/';

    /* ───────────────────────────── DOM ELEMENTS ───────────────────────── */
    const searchForm           = document.getElementById('search-form');
    const searchResults        = document.getElementById('search-results');
    const searchLoader         = document.getElementById('search-loader');
    const noResults            = document.getElementById('no-results');

    const randomRecipeBtn      = document.getElementById('random-recipe-btn');
    const randomRecipeResult   = document.getElementById('random-recipe-result');
    const randomRecipeLoader   = document.getElementById('random-recipe-loader');

    const refreshFavoritesBtn  = document.getElementById('refresh-favorites');
    const favoritesList        = document.getElementById('favorites-list');
    const favoritesLoader      = document.getElementById('favorites-loader');
    const noFavorites          = document.getElementById('no-favorites');

    const createRecipeBtn      = document.getElementById('create-recipe-btn');
    const createRecipeModal    = document.getElementById('create-recipe-modal');
    const createRecipeForm     = document.getElementById('create-recipe-form');
    const closeCreateModal     = createRecipeModal.querySelector('.close-create-modal');

    const editRecipeModal      = document.getElementById('edit-recipe-modal');
    const editRecipeForm       = document.getElementById('edit-recipe-form');
    const closeEditModal       = editRecipeModal.querySelector('.close-edit-modal');

    const recipeModal          = document.getElementById('recipe-modal');
    const recipeDetailContent  = document.getElementById('recipe-detail-content');
    const closeModal           = recipeModal.querySelector('.close-modal');
    const addToFavoritesBtn    = document.getElementById('add-to-favorites-btn');

    const priceBreakdownModal  = document.getElementById('price-breakdown-modal');
    const priceBreakdownImg    = document.getElementById('price-breakdown-img');
    const priceBreakdownData   = document.getElementById('price-breakdown-data');
    const closePriceModal      = priceBreakdownModal.querySelector('.close-price-modal');

    const notification         = document.getElementById('notification');
    const notificationMessage  = document.getElementById('notification-message');

    /* Timer elements */
    const timerMinutes         = document.getElementById('minutes');
    const timerSeconds         = document.getElementById('seconds');
    const timerMinutesInput    = document.getElementById('timer-minutes');
    const timerSecondsInput    = document.getElementById('timer-seconds');
    const timerStartBtn        = document.getElementById('timer-start');
    const timerPauseBtn        = document.getElementById('timer-pause');
    const timerResetBtn        = document.getElementById('timer-reset');

    /* ──────────────────────────── STATE VARS ──────────────────────────── */
    let currentRecipe   = null;
    let timerInterval   = null;
    let totalSeconds    = 0;
    let isTimerRunning  = false;

    /* ──────────────────────────── NOTIFICATION ────────────────────────── */
    function showNotification(msg, error = false) {
        notificationMessage.textContent = msg;
        notification.className = 'notification show';
        notification.classList.toggle('error', error);
        setTimeout(() => notification.className = 'notification', 3000);
    }

    /* Helpers */
    const showLoader  = el => el && (el.style.display = 'block');
    const hideLoader  = el => el && (el.style.display = 'none');
    const isNumericId = id => /^\d+$/.test(id ?? '');

    /* ───────────────────────── SEARCH  ────────────────────────────────── */
    searchForm.addEventListener('submit', e => {
        e.preventDefault();
        const query        = document.getElementById('search-query').value.trim();
        const minCalories  = document.getElementById('min-calories').value;
        const maxCalories  = document.getElementById('max-calories').value;

        if (!query) { showNotification('Please enter a search term.', true); return; }

        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        noResults.style.display    = 'none';
        showLoader(searchLoader);

        let url = `/api/meals?query=${encodeURIComponent(query)}`;
        if (minCalories) url += `&minCalories=${minCalories}`;
        if (maxCalories) url += `&maxCalories=${maxCalories}`;

        fetch(url)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => {
                hideLoader(searchLoader);
                if (data.results?.length) { displaySearchResults(data.results); searchResults.style.display = 'grid'; }
                else                      { noResults.style.display = 'block'; }
            })
            .catch(() => { hideLoader(searchLoader); showNotification('Error fetching search results.', true); });
    });

    function displaySearchResults(results) {
        searchResults.innerHTML = '';
        results.forEach(r => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <div class="recipe-image"><img src="${r.image}" alt="${r.title}" loading="lazy"></div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${r.title}</h3>
                    <div class="recipe-actions">
                        <button class="action-btn view-recipe" data-id="${r.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </div>`;
            searchResults.appendChild(card);
            card.querySelector('.view-recipe')
                .addEventListener('click', () => fetchRecipeDetails(r.id));
        });
    }

    /* ───────────────────────── RANDOM RECIPE ──────────────────────────── */
    randomRecipeBtn.addEventListener('click', () => {
        randomRecipeResult.innerHTML = ''; randomRecipeResult.style.display = 'none';
        showLoader(randomRecipeLoader);

        fetch('/api/random')
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => { hideLoader(randomRecipeLoader); displayRandomRecipe(data); })
            .catch(() => { hideLoader(randomRecipeLoader); showNotification('Error fetching random recipe.', true); });
    });

    function displayRandomRecipe(recipe) {
        const img   = recipe.image || 'static/images/placeholder.png';
        const stats = `
            <div class="recipe-stat"><i class="fas fa-clock"></i> Ready in ${recipe.readyInMinutes ?? 'N/A'} min</div>
            <div class="recipe-stat"><i class="fas fa-utensils"></i> Serves ${recipe.servings ?? 'N/A'}</div>
            ${recipe.vegetarian ? '<div class="recipe-stat"><i class="fas fa-leaf"></i> Vegetarian</div>' : ''}
            ${recipe.vegan       ? '<div class="recipe-stat"><i class="fas fa-seedling"></i> Vegan</div>' : ''}
            ${recipe.glutenFree ? '<div class="recipe-stat"><i class="fas fa-bread-slice"></i> Gluten-Free</div>' : ''}
            ${recipe.dairyFree  ? '<div class="recipe-stat"><i class="fas fa-cheese"></i> Dairy-Free</div>' : ''}`.trim();

        randomRecipeResult.innerHTML = `
            <div class="recipe-detail-image"><img src="${img}" alt="${recipe.title}"></div>
            <div class="recipe-detail-content">
                <h2 class="recipe-detail-title">${recipe.title}</h2>
                <div class="recipe-stats">${stats}</div>
                <div class="recipe-actions-large">
                    <button class="btn btn-primary view-full-recipe"  data-id="${recipe.id}"><i class="fas fa-eye"></i> View Full Recipe</button>
                    <button class="btn btn-secondary view-price-breakdown" data-id="${recipe.id}"><i class="fas fa-dollar-sign"></i> Price Breakdown</button>
                </div>
            </div>`;
        randomRecipeResult.style.display = 'block';

        randomRecipeResult.querySelector('.view-full-recipe')
            .addEventListener('click', e => fetchRecipeDetails(e.currentTarget.dataset.id));
        randomRecipeResult.querySelector('.view-price-breakdown')
            .addEventListener('click', e => viewPriceBreakdown(e.currentTarget.dataset.id));
    }

    /* ───────────────────────── RECIPE DETAILS ─────────────────────────── */
    function fetchRecipeDetails(id) {
        recipeDetailContent.innerHTML = '<div class="loader"></div>';
        recipeModal.style.display = 'block';
        currentRecipe = null;

        fetch(`/api/recipe/info/${id}`)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => { currentRecipe = data; displayRecipeDetails(data); })
            .catch(() => { recipeDetailContent.innerHTML = '<p class="error-message">Error loading recipe.</p>'; });
    }

    function displayRecipeDetails(r) {
        const ingredients = (r.extendedIngredients ?? []).map(i => i.original);
        let instructions  = [];
        if (r.analyzedInstructions?.[0]?.steps?.length) {
            instructions = r.analyzedInstructions[0].steps.map(s => s.step);
        } else if (r.instructions) {
            instructions = r.instructions.split('\n').filter(Boolean);
        }
        if (!instructions.length) instructions = ['No instructions available.'];

        recipeDetailContent.innerHTML = `
            <div class="recipe-detail-image"><img src="${r.image || 'static/images/placeholder.png'}" alt="${r.title}"></div>
            <div class="recipe-detail-main-content">
                <h2 class="recipe-detail-title">${r.title}</h2>
                <div class="recipe-stats">
                    <div class="recipe-stat"><i class="fas fa-clock"></i> Ready in ${r.readyInMinutes ?? 'N/A'} min</div>
                    <div class="recipe-stat"><i class="fas fa-utensils"></i> Serves ${r.servings ?? 'N/A'}</div>
                    ${r.vegetarian ? '<div class="recipe-stat"><i class="fas fa-leaf"></i> Vegetarian</div>' : ''}
                    ${r.vegan ? '<div class="recipe-stat"><i class="fas fa-seedling"></i> Vegan</div>' : ''}
                    ${r.glutenFree ? '<div class="recipe-stat"><i class="fas fa-bread-slice"></i> Gluten-Free</div>' : ''}
                    ${r.dairyFree ? '<div class="recipe-stat"><i class="fas fa-cheese"></i> Dairy-Free</div>' : ''}
                </div>

                <div class="recipe-detail-section">
                    <h3>Ingredients</h3>
                    <ul class="ingredients-list">${ingredients.map(x => `<li>${x}</li>`).join('')}</ul>
                </div>

                <div class="recipe-detail-section">
                    <h3>Instructions</h3>
                    <ol class="instructions-list">${instructions.map(x => `<li>${x}</li>`).join('')}</ol>
                </div>

                <div class="recipe-actions-large modal-specific-actions">
                    <button class="btn btn-secondary view-price-breakdown" data-id="${r.id}"><i class="fas fa-dollar-sign"></i> Price Breakdown</button>
                </div>
            </div>`;

        recipeDetailContent.querySelector('.view-price-breakdown')
            .addEventListener('click', e => viewPriceBreakdown(e.currentTarget.dataset.id));
    }

    /* ───────────────────────── PRICE BREAKDOWN ────────────────────────── */
    function viewPriceBreakdown(id) {
        priceBreakdownModal.style.display = 'block';
        priceBreakdownImg.style.display   = 'none';
        priceBreakdownData.innerHTML      = '<div class="loader"></div>';
        priceBreakdownImg.src = `/api/price_breakdown_widget/${id}`;

        priceBreakdownImg.onload  = () => priceBreakdownImg.style.display = 'block';
        priceBreakdownImg.onerror = () => priceBreakdownImg.style.display = 'none';

        fetch(`/api/price_breakdown/${id}`)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(([ings, prices]) => {
                let html = '<dl class="price-breakdown-list">';
                ings.forEach((ing,i) => {
                    if (!/total/i.test(ing) && prices[i]) html += `<dt>${ing}</dt><dd>${prices[i]}</dd>`;
                });
                priceBreakdownData.innerHTML = html + '</dl>';
            })
            .catch(() => priceBreakdownData.innerHTML = '<p>Could not load price data.</p>');
    }

    /* ───────────────────────── FAVORITES CRUD ─────────────────────────── */
    function loadFavorites() {
        favoritesList.innerHTML = ''; favoritesList.style.display='none';
        noFavorites.style.display = 'none'; showLoader(favoritesLoader);

        fetch(FAVORITES_BASE)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => {
                hideLoader(favoritesLoader);
                if (Object.keys(data).length) { displayFavorites(Object.values(data)); favoritesList.style.display = 'grid'; }
                else                          { noFavorites.style.display = 'block'; }
            })
            .catch(() => { hideLoader(favoritesLoader); noFavorites.textContent='Error loading favorites.'; noFavorites.style.display='block'; });
    }

    function displayFavorites(recipes) {
        favoritesList.innerHTML = '';
        recipes.forEach(r => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <div class="recipe-image"><img src="${r.image}" alt="${r.title}" loading="lazy"></div>
                <div class="recipe-content"><h3 class="recipe-title">${r.title}</h3></div>
                <div class="recipe-actions favorite-actions">
                    <button class="action-btn view-fav-recipe" data-id="${r.recipe_id}"><i class="fas fa-eye"></i> View</button>
                    <button class="action-btn edit-recipe"     data-id="${r.recipe_id}" data-instr="${encodeURIComponent(r.instructions)}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="action-btn delete-recipe"   data-id="${r.recipe_id}"><i class="fas fa-trash-alt"></i> Delete</button>
                </div>`;
            favoritesList.appendChild(card);

            card.querySelector('.view-fav-recipe')
                .addEventListener('click', e => {
                    const id = e.currentTarget.dataset.id;
                    if (isNumericId(id)) fetchRecipeDetails(id);
                    else                 displayFavoriteDetails(r);
                });

            card.querySelector('.edit-recipe')
                .addEventListener('click', () => openEditModal(r));

            card.querySelector('.delete-recipe')
                .addEventListener('click', e => {
                    const id = e.currentTarget.dataset.id;
                    if (confirm('Delete this recipe?')) deleteFavorite(id);
                });
        });
    }

    /* display favorite recipe created by user (non-Spoonacular) */
    function displayFavoriteDetails(r) {
        currentRecipe = r;
        recipeDetailContent.innerHTML = `
            <div class="recipe-detail-image"><img src="${r.image}" alt="${r.title}"></div>
            <div class="recipe-detail-main-content">
                <h2 class="recipe-detail-title">${r.title}</h2>

                <div class="recipe-detail-section">
                    <h3>Ingredients</h3>
                    <ul class="ingredients-list">${r.ingredients.split('\n').filter(Boolean).map(x=>`<li>${x}</li>`).join('')}</ul>
                </div>
                <div class="recipe-detail-section">
                    <h3>Instructions</h3>
                    <ol class="instructions-list">${r.instructions.split('\n').filter(Boolean).map(x=>`<li>${x}</li>`).join('')}</ol>
                </div>
            </div>`;
        addToFavoritesBtn.style.display = 'none';
        recipeModal.style.display = 'block';
    }

    /* ADD to favorites (Spoonacular recipe) */
    addToFavoritesBtn.addEventListener('click', () => {
        if (!currentRecipe?.id) { showNotification('No recipe selected.', true); return; }

        const fd = new FormData();
        fd.append('recipe_title'     , currentRecipe.title);
        fd.append('recipe_id'        , currentRecipe.id);
        fd.append('recipe_image'     , currentRecipe.image || '');
        fd.append('recipe_ingredients', (currentRecipe.extendedIngredients ?? []).map(i=>i.original).join('\n'));
        let instr = '';
        if (currentRecipe.analyzedInstructions?.[0]?.steps?.length)
            instr = currentRecipe.analyzedInstructions[0].steps.map(s=>s.step).join('\n');
        else if (currentRecipe.instructions) instr = currentRecipe.instructions;
        fd.append('recipe_instructions', instr);

        fetch(ADD_FAVORITE_URL, { method:'POST', body:fd })
            .then(r => r.json())
            .then(res => {
                if (res.message) { showNotification(res.message); recipeModal.style.display='none'; loadFavorites(); }
                else             { showNotification(res.error || 'Failed.', true); }
            })
            .catch(() => showNotification('Failed to add recipe.', true));
    });

    /* CREATE recipe (user) – JSON payload */
    createRecipeBtn.addEventListener('click', () => { createRecipeForm.reset(); createRecipeModal.style.display='block'; });

    createRecipeForm.addEventListener('submit', e => {
        e.preventDefault();
        const payload = {
            title       : document.getElementById('cr_title').value.trim(),
            recipe_id   : document.getElementById('cr_id').value.trim() || null,
            ingredients : document.getElementById('cr_ingredients').value.trim(),
            instructions: document.getElementById('cr_instructions').value.trim(),
            image       : document.getElementById('cr_image').value.trim()
        };
        fetch(CREATE_RECIPE_URL, {
            method : 'POST',
            headers: { 'Content-Type':'application/json' },
            body   : JSON.stringify(payload)
        })
        .then(r => {
            if (r.status === 201) return r.json().then(d => ({ ok:true , msg:d.message }));
            if (r.status === 409) return r.json().then(d => ({ ok:false, msg:d.error }));
            return r.json().then(d => Promise.reject(d.error || 'Error'));
        })
        .then(res => {
            showNotification(res.msg, !res.ok);
            if (res.ok) { createRecipeModal.style.display='none'; loadFavorites(); }
        })
        .catch(err => showNotification(err, true));
    });

    /* EDIT recipe instructions */
    function openEditModal(r) {
        document.getElementById('edit_r_id').value           = r.recipe_id;
        document.getElementById('edit_r_instructions').value = r.instructions;
        editRecipeModal.style.display = 'block';
    }

    editRecipeForm.addEventListener('submit', e => {
        e.preventDefault();
        const recipe_id   = document.getElementById('edit_r_id').value;
        const instructions= document.getElementById('edit_r_instructions').value.trim();
        if (!instructions) { showNotification('Instructions cannot be empty.', true); return; }

        fetch(FAVORITES_BASE, {
            method : 'PUT',
            headers: { 'Content-Type':'application/json' },
            body   : JSON.stringify({ recipe_id, instructions })
        })
        .then(r => r.json().then(d => ({ status:r.status, data:d })))
        .then(({status,data})=>{
            if (status===200) { showNotification(data.message); editRecipeModal.style.display='none'; loadFavorites(); }
            else              { showNotification(data.error || 'Failed', true); }
        })
        .catch(() => showNotification('Error updating recipe.', true));
    });

    /* DELETE */
    function deleteFavorite(recipe_id) {
        fetch(FAVORITES_BASE, {
            method : 'DELETE',
            headers: { 'Content-Type':'application/json' },
            body   : JSON.stringify({ recipe_id })
        })
        .then(r => r.json().then(d => ({ status:r.status, data:d })))
        .then(({status,data}) => {
            if (status===200) { showNotification(data.message); loadFavorites(); }
            else              { showNotification(data.error || 'Failed', true); }
        })
        .catch(() => showNotification('Error deleting recipe.', true));
    }

    /* ───────────────────────── TIMER ──────────────────────────────────── */
    const updateTimerDisplay = () => {
        timerMinutes.textContent = String(Math.floor(totalSeconds/60)).padStart(2,'0');
        timerSeconds.textContent = String(totalSeconds%60).padStart(2,'0');
    };
    function startTimer() {
        if (isTimerRunning) return;
        const m = parseInt(timerMinutesInput.value)||0, s=parseInt(timerSecondsInput.value)||0;
        totalSeconds = m*60 + s;
        if (totalSeconds<=0) { showNotification('Set a valid duration.', true); return; }

        isTimerRunning = true;
        timerStartBtn.disabled = true; timerPauseBtn.disabled=false;
        timerMinutesInput.disabled = timerSecondsInput.disabled = true;
        updateTimerDisplay();
        timerInterval = setInterval(()=>{
            totalSeconds--;
            if (totalSeconds < 0) { resetTimer(); showNotification("Time's up!"); }
            else updateTimerDisplay();
        },1000);
    }
    const pauseTimer = () => { if (!isTimerRunning) return; clearInterval(timerInterval); isTimerRunning=false; timerStartBtn.disabled=false; timerPauseBtn.disabled=true; timerStartBtn.textContent='Resume'; };
    const resetTimer = () => {
        clearInterval(timerInterval); isTimerRunning=false; totalSeconds=0;
        timerMinutesInput.value=5; timerSecondsInput.value=0; updateTimerDisplay();
        timerStartBtn.disabled=false; timerPauseBtn.disabled=true; timerStartBtn.textContent='Start';
        timerMinutesInput.disabled = timerSecondsInput.disabled = false;
    };
    timerStartBtn.addEventListener('click',startTimer);
    timerPauseBtn.addEventListener('click',pauseTimer);
    timerResetBtn.addEventListener('click',resetTimer);

    /* ───────────────────────── MODAL CLOSE HANDLERS ───────────────────── */
    const closeModalHandler = m => { m.style.display='none';
        if (m===recipeModal){ recipeDetailContent.innerHTML=''; currentRecipe=null; addToFavoritesBtn.style.display='block'; }
        if (m===priceBreakdownModal){ priceBreakdownImg.src=''; priceBreakdownData.innerHTML=''; }
    };
    closeModal .addEventListener('click',()=>closeModalHandler(recipeModal));
    closeCreateModal.addEventListener('click',()=>closeModalHandler(createRecipeModal));
    closeEditModal  .addEventListener('click',()=>closeModalHandler(editRecipeModal));
    closePriceModal .addEventListener('click',()=>closeModalHandler(priceBreakdownModal));
    window.addEventListener('click',e=>{
        if (e.target===recipeModal) closeModalHandler(recipeModal);
        if (e.target===createRecipeModal) closeModalHandler(createRecipeModal);
        if (e.target===editRecipeModal)   closeModalHandler(editRecipeModal);
        if (e.target===priceBreakdownModal) closeModalHandler(priceBreakdownModal);
    });

    /* ───────────────────────── NAV ACTIVE LINK ───────────────────────── */
    document.querySelectorAll('nav ul li a').forEach(link=>{
        link.addEventListener('click',function(e){
            document.querySelectorAll('nav ul li a').forEach(l=>l.classList.remove('active'));
            this.classList.add('active');
            if (this.hash) { document.querySelector(this.hash)?.scrollIntoView({behavior:'smooth'}); }
        });
    });

    /* ───────────────────────── INITIALISE ─────────────────────────────── */
    loadFavorites();
    updateTimerDisplay();
    refreshFavoritesBtn.addEventListener('click',loadFavorites);

});   // DOMContentLoaded
