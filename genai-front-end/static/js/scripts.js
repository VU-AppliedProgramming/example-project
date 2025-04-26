document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const searchForm        = document.getElementById('search-form');
    const searchResults     = document.getElementById('search-results');
    const searchLoader      = document.getElementById('search-loader');
    const noResults         = document.getElementById('no-results');
    const randomRecipeBtn   = document.getElementById('random-recipe-btn');
    const randomRecipeResult= document.getElementById('random-recipe-result');
    const randomRecipeLoader= document.getElementById('random-recipe-loader');
    const refreshFavoritesBtn = document.getElementById('refresh-favorites');
    const favoritesList     = document.getElementById('favorites-list');
    const favoritesLoader   = document.getElementById('favorites-loader');
    const noFavorites       = document.getElementById('no-favorites');
    const createRecipeBtn   = document.getElementById('create-recipe-btn');
  
    const recipeModal       = document.getElementById('recipe-modal');
    const recipeDetailContent = document.getElementById('recipe-detail-content');
    const closeModal        = recipeModal.querySelector('.close-modal');
    const addToFavoritesBtn = document.getElementById('add-to-favorites-btn');
  
    const createRecipeModal = document.getElementById('create-recipe-modal');
    const createRecipeForm  = document.getElementById('create-recipe-form');
    const closeCreateModal  = createRecipeModal.querySelector('.close-create-modal');
  
    const editRecipeModal   = document.getElementById('edit-recipe-modal');
    const editRecipeForm    = document.getElementById('edit-recipe-form');
    const closeEditModal    = editRecipeModal.querySelector('.close-edit-modal');
  
    const priceBreakdownModal = document.getElementById('price-breakdown-modal');
    const priceBreakdownImg    = document.getElementById('price-breakdown-img');
    const priceBreakdownData   = document.getElementById('price-breakdown-data');
    const closePriceModal      = priceBreakdownModal.querySelector('.close-price-modal');
  
    const notification       = document.getElementById('notification');
    const notificationMessage= document.getElementById('notification-message');
  
    const timerMinutes      = document.getElementById('minutes');
    const timerSeconds      = document.getElementById('seconds');
    const timerMinutesInput = document.getElementById('timer-minutes');
    const timerSecondsInput = document.getElementById('timer-seconds');
    const timerStartBtn     = document.getElementById('timer-start');
    const timerPauseBtn     = document.getElementById('timer-pause');
    const timerResetBtn     = document.getElementById('timer-reset');
  
    let currentRecipe = null;
    let timerInterval = null;
    let totalSeconds  = 0;
    let isTimerRunning= false;
  
    // Nav link highlighting & smooth scroll
    document.querySelectorAll('nav ul li a').forEach(link => {
      link.addEventListener('click', function(e){
        document.querySelectorAll('nav ul li a').forEach(l=>l.classList.remove('active'));
        this.classList.add('active');
        const tgt = this.getAttribute('href');
        if(tgt.startsWith('#')) document.querySelector(tgt)?.scrollIntoView({behavior:'smooth'});
      });
    });
  
    // Helpers
    function showNotification(msg, isError=false){
      notificationMessage.textContent = msg;
      notification.className = 'notification show' + (isError?' error':'');
      setTimeout(()=> notification.className = 'notification', 3000);
    }
    function showLoader(el){ if(el) el.style.display = 'block'; }
    function hideLoader(el){ if(el) el.style.display = 'none'; }
  
    // SEARCH
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      const q   = document.getElementById('search-query').value.trim();
      const min = document.getElementById('min-calories').value;
      const max = document.getElementById('max-calories').value;
      if(!q){ showNotification('Please enter a search term.', true); return; }
  
      searchResults.innerHTML = '';
      searchResults.style.display = 'none';
      noResults.style.display = 'none';
      showLoader(searchLoader);
  
      let url = `/api/meals?query=${encodeURIComponent(q)}`;
      if(min) url += `&minCalories=${min}`;
      if(max) url += `&maxCalories=${max}`;
  
      fetch(url)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(data => {
          hideLoader(searchLoader);
          if(data.results?.length){
            renderSearchResults(data.results);
            searchResults.style.display = 'grid';
          } else {
            noResults.style.display = 'block';
          }
        })
        .catch(err => {
          hideLoader(searchLoader);
          showNotification('Error fetching search results.', true);
          console.error(err);
        });
    });
  
    function renderSearchResults(list){
      list.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
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
          </div>`;
        searchResults.appendChild(card);
        card.querySelector('.view-recipe').addEventListener('click', () => {
          fetchRecipeDetails(recipe.id);
        });
      });
    }
  
    // RANDOM
    randomRecipeBtn.addEventListener('click', () => {
      randomRecipeResult.innerHTML = '';
      randomRecipeResult.style.display = 'none';
      showLoader(randomRecipeLoader);
  
      fetch('/api/random')
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(data => {
          hideLoader(randomRecipeLoader);
          renderRandomRecipe(data);
          randomRecipeResult.style.display = 'block';
        })
        .catch(err => {
          hideLoader(randomRecipeLoader);
          showNotification('Error fetching random recipe.', true);
          console.error(err);
        });
    });
  
    function renderRandomRecipe(recipe){
      const imgUrl = recipe.image || '/static/images/placeholder.png';
      randomRecipeResult.innerHTML = `
        <div class="recipe-detail-image">
          <img src="${imgUrl}" alt="${recipe.title}">
        </div>
        <div class="recipe-detail-content">
          <h2 class="recipe-detail-title">${recipe.title}</h2>
          <div class="recipe-stats">
            <div class="recipe-stat"><i class="fas fa-clock"></i> Ready in ${recipe.readyInMinutes||'N/A'} min</div>
            <div class="recipe-stat"><i class="fas fa-utensils"></i> Serves ${recipe.servings||'N/A'}</div>
            ${recipe.vegetarian?'<div class="recipe-stat"><i class="fas fa-leaf"></i> Vegetarian</div>':''}
            ${recipe.vegan?'<div class="recipe-stat"><i class="fas fa-seedling"></i> Vegan</div>':''}
            ${recipe.glutenFree?'<div class="recipe-stat"><i class="fas fa-bread-slice"></i> Gluten-Free</div>':''}
            ${recipe.dairyFree?'<div class="recipe-stat"><i class="fas fa-cheese"></i> Dairy-Free</div>':''}
          </div>
          <div class="recipe-actions-large">
            <button class="btn btn-primary view-full-recipe" data-id="${recipe.id}">
              <i class="fas fa-eye"></i> View Full Recipe
            </button>
            <button class="btn btn-secondary view-price-breakdown" data-id="${recipe.id}">
              <i class="fas fa-dollar-sign"></i> Price Breakdown
            </button>
          </div>
        </div>`;
      randomRecipeResult.querySelector('.view-full-recipe')
        .addEventListener('click', () => fetchRecipeDetails(recipe.id));
      randomRecipeResult.querySelector('.view-price-breakdown')
        .addEventListener('click', () => viewPriceBreakdown(recipe.id));
    }
  
    // RECIPE DETAILS
    function fetchRecipeDetails(id){
      recipeDetailContent.innerHTML = '<div class="loader-small"></div>';
      recipeModal.style.display = 'block';
      currentRecipe = null;
  
      fetch(`/api/recipe/info/${id}`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(data => {
          currentRecipe = data;
          renderRecipeDetails(data);
        })
        .catch(err => {
          recipeDetailContent.innerHTML = '<p class="error-message">Error loading recipe details.</p>';
          showNotification('Error fetching recipe details.', true);
          console.error(err);
        });
    }
  
    function renderRecipeDetails(recipe){
      const ingredients = (recipe.extendedIngredients||[]).map(i=>i.original);
      let instructions = [];
      if(recipe.analyzedInstructions?.[0]?.steps){
        instructions = recipe.analyzedInstructions[0].steps.map(s=>s.step);
      } else if(recipe.instructions){
        instructions = recipe.instructions.split('\n').filter(Boolean);
      }
      if(!instructions.length) instructions = ['No instructions available.'];
      const imgUrl = recipe.image || '/static/images/placeholder.png';
  
      recipeDetailContent.innerHTML = `
        <div class="recipe-detail-image">
          <img src="${imgUrl}" alt="${recipe.title}">
        </div>
        <div class="recipe-detail-main-content">
          <h2 class="recipe-detail-title">${recipe.title}</h2>
          <div class="recipe-stats">
            <div class="recipe-stat"><i class="fas fa-clock"></i> Ready in ${recipe.readyInMinutes||'N/A'} min</div>
            <div class="recipe-stat"><i class="fas fa-utensils"></i> Serves ${recipe.servings||'N/A'}</div>
            ${recipe.vegetarian?'<div class="recipe-stat"><i class="fas fa-leaf"></i> Vegetarian</div>':''}
            ${recipe.vegan?'<div class="recipe-stat"><i class="fas fa-seedling"></i> Vegan</div>':''}
            ${recipe.glutenFree?'<div class="recipe-stat"><i class="fas fa-bread-slice"></i> Gluten-Free</div>':''}
            ${recipe.dairyFree?'<div class="recipe-stat"><i class="fas fa-cheese"></i> Dairy-Free</div>':''}
          </div>
          <div class="recipe-detail-section">
            <h3>Ingredients</h3>
            <ul class="ingredients-list">${ingredients.map(i=>`<li>${i}</li>`).join('')}</ul>
          </div>
          <div class="recipe-detail-section">
            <h3>Instructions</h3>
            <ol class="instructions-list">${instructions.map(i=>`<li>${i}</li>`).join('')}</ol>
          </div>
          <div class="recipe-actions-large modal-specific-actions">
            <button class="btn btn-secondary view-price-breakdown" data-id="${recipe.id}">
              <i class="fas fa-dollar-sign"></i> Price Breakdown
            </button>
          </div>
        </div>`;
      recipeDetailContent.querySelector('.view-price-breakdown')
        .addEventListener('click', () => viewPriceBreakdown(recipe.id));
    }
  
    // PRICE BREAKDOWN
    function viewPriceBreakdown(id){
      priceBreakdownModal.style.display = 'block';
      priceBreakdownImg.style.display = 'none';
      priceBreakdownData.innerHTML = '<div class="loader-small"></div>';
  
      priceBreakdownImg.src = `/api/price_breakdown_widget/${id}`;
      priceBreakdownImg.onload = () => priceBreakdownImg.style.display = 'block';
  
      fetch(`/api/price_breakdown/${id}`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(data => {
          if(Array.isArray(data) && data.length===2){
            const [ings, prcs] = data;
            let html = '<dl class="price-breakdown-list">', ok=false;
            ings.forEach((ing,i) => {
              if(ing && prcs[i] && !ing.toLowerCase().includes('total')){
                html += `<dt>${ing}</dt><dd>${prcs[i]}</dd>`; ok=true;
              }
            });
            html += '</dl>';
            priceBreakdownData.innerHTML = ok? html : '<p>No price data available.</p>';
          } else {
            priceBreakdownData.innerHTML = '<p>Error parsing price data.</p>';
          }
        })
        .catch(err => {
          priceBreakdownData.innerHTML = '<p class="error-message">Could not load price data.</p>';
          console.error(err);
        });
    }
  
    // FAVORITES
    function loadFavorites(){
      favoritesList.innerHTML = '';
      noFavorites.style.display = 'none';
      showLoader(favoritesLoader);
  
      fetch('/feastFinder/recipes/favorites/')
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(data => {
          hideLoader(favoritesLoader);
          if(Object.keys(data).length){
            renderFavorites(data);
            favoritesList.style.display = 'grid';
          } else {
            noFavorites.style.display = 'block';
          }
        })
        .catch(err => {
          hideLoader(favoritesLoader);
          showNotification('Could not load favorites.', true);
          noFavorites.textContent = 'Error loading favorites.';
          noFavorites.style.display = 'block';
          console.error(err);
        });
    }
  
    function renderFavorites(recipes){
      favoritesList.innerHTML = '';
      Object.entries(recipes).forEach(([id, recipe]) => {
        const card = document.createElement('div');
        card.className = 'recipe-card favorite-card';
        card.innerHTML = `
          <div class="recipe-image">
            <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
          </div>
          <div class="recipe-content">
            <h3 class="recipe-title">${recipe.title}</h3>
          </div>
          <div class="recipe-actions">
            <button class="action-btn view-fav-recipe" data-id="${id}">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="action-btn edit-recipe" data-id="${id}">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="action-btn delete-recipe" data-id="${id}">
              <i class="fas fa-trash-alt"></i> Delete
            </button>
          </div>`;
        favoritesList.appendChild(card);
  
        card.querySelector('.view-fav-recipe').addEventListener('click', e => {
          const rid = e.currentTarget.dataset.id;
          if(!isNaN(parseInt(rid))) {
            fetchRecipeDetails(rid);
          } else {
            displayFavoriteDetails({...recipe, id: rid});
          }
        });
        card.querySelector('.edit-recipe').addEventListener('click', e => {
          openEditModal(e.currentTarget.dataset.id, recipe);
        });
        card.querySelector('.delete-recipe').addEventListener('click', e => {
          const rid = e.currentTarget.dataset.id;
          if(confirm('Delete this recipe?')) deleteFavorite(rid);
        });
      });
    }
  
    function displayFavoriteDetails(recipe){
      currentRecipe = recipe;
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
            ${(recipe.ingredients||'').split('\n').filter(Boolean).map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
        <div class="recipe-detail-section">
          <h3>Instructions</h3>
          <ol class="instructions-list">
            ${(recipe.instructions||'').split('\n').filter(Boolean).map(i => `<li>${i}</li>`).join('')}
          </ol>
        </div>`;
      recipeModal.style.display = 'block';
      addToFavoritesBtn.style.display = 'none';
    }
  
    function openEditModal(id, recipe){
      document.getElementById('edit_recipe_id').value = id;
      document.getElementById('edit_r_instructions').value = recipe.instructions || '';
      editRecipeModal.style.display = 'block';
    }
  
    editRecipeForm.addEventListener('submit', e => {
      e.preventDefault();
      const rid   = document.getElementById('edit_recipe_id').value;
      const instr = document.getElementById('edit_r_instructions').value.trim();
      if(!instr){ showNotification('Instructions cannot be empty.', true); return; }
      fetch('/feastFinder/recipes/favorites/', {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({recipe_id: rid, instructions: instr})
      })
      .then(r => {
        if(r.ok) return r.json().then(d => ({ok:true,msg:d.message}));
        if(r.status===404) return r.json().then(d => ({ok:false,msg:d.error}));
        return Promise.reject('Update failed');
      })
      .then(res => {
        showNotification(res.msg, !res.ok);
        if(res.ok){ editRecipeModal.style.display='none'; loadFavorites(); }
      })
      .catch(err => {
        showNotification(`Error: ${err}`, true);
        console.error(err);
      });
    });
  
    function deleteFavorite(rid){
      fetch('/feastFinder/recipes/favorites/', {
        method: 'DELETE',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({recipe_id: rid})
      })
      .then(r => {
        if(r.ok) return r.json().then(d => ({ok:true,msg:d.message}));
        if(r.status===404) return r.json().then(d => ({ok:false,msg:d.error}));
        return Promise.reject('Delete failed');
      })
      .then(res => {
        showNotification(res.msg, !res.ok);
        if(res.ok) loadFavorites();
      })
      .catch(err => {
        showNotification(`Error: ${err}`, true);
        console.error(err);
      });
    }
  
    createRecipeBtn.addEventListener('click', ()=>{
      createRecipeForm.reset();
      createRecipeModal.style.display='block';
    });
  
    createRecipeForm.addEventListener('submit', e => {
      e.preventDefault();
      const title = document.getElementById('r_title').value.trim();
      const rid   = document.getElementById('r_id').value.trim() || null;
      const ings  = document.getElementById('r_ingredients').value.trim();
      const instr = document.getElementById('r_instructions').value.trim();
      const img   = document.getElementById('r_image').value.trim();
      if(!title||!ings||!instr||!img){
        showNotification('Please fill in all fields.', true);
        return;
      }
      fetch('/feastFinder/recipe/', {
        method: 'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({title, recipe_id: rid, ingredients: ings, instructions: instr, image: img})
      })
      .then(r => {
        if(r.status===201) return r.json().then(d => ({ok:true,msg:d.message}));
        return r.json().then(d => ({ok:false,msg:d.error||JSON.stringify(d)}));
      })
      .then(res => {
        showNotification(res.msg, !res.ok);
        if(res.ok){
          createRecipeModal.style.display='none';
          loadFavorites();
        }
      })
      .catch(err => {
        showNotification(`Error: ${err}`, true);
        console.error(err);
      });
    });
  
    addToFavoritesBtn.addEventListener('click', ()=>{
      if(!currentRecipe?.id){
        showNotification('No recipe selected.', true);
        return;
      }
      const fd = new FormData();
      fd.append('recipe_title', currentRecipe.title);
      fd.append('recipe_id', currentRecipe.id);
      fd.append('recipe_image', currentRecipe.image||'');
      const ingr = (currentRecipe.extendedIngredients||[]).map(i=>i.original).join('\n');
      let instr = '';
      if(currentRecipe.analyzedInstructions?.[0]?.steps){
        instr = currentRecipe.analyzedInstructions[0].steps.map(s=>s.step).join('\n');
      } else {
        instr = currentRecipe.instructions||'';
      }
      fd.append('recipe_ingredients', ingr);
      fd.append('recipe_instructions', instr);
  
      fetch('/feastFinder/recipes/favorites/add_to_favorites', {method:'POST', body:fd})
        .then(r => r.json())
        .then(d => {
          if(d.message){
            showNotification(d.message);
            recipeModal.style.display='none';
            loadFavorites();
          } else {
            showNotification(d.error||'Error adding favorite', true);
          }
        })
        .catch(err => {
          showNotification('Failed to add to favorites.', true);
          console.error(err);
        });
    });
  
    function closeModalHandler(modal){
      modal.style.display='none';
      if(modal===recipeModal){
        recipeDetailContent.innerHTML=''; currentRecipe=null; addToFavoritesBtn.style.display='block';
      }
      if(modal===priceBreakdownModal){
        priceBreakdownImg.src=''; priceBreakdownData.innerHTML='';
      }
    }
    closeModal.addEventListener('click', ()=>closeModalHandler(recipeModal));
    closeCreateModal.addEventListener('click', ()=>closeModalHandler(createRecipeModal));
    closeEditModal.addEventListener('click', ()=>closeModalHandler(editRecipeModal));
    closePriceModal.addEventListener('click', ()=>closeModalHandler(priceBreakdownModal));
    window.addEventListener('click', e => {
      if(e.target===recipeModal) closeModalHandler(recipeModal);
      if(e.target===createRecipeModal) closeModalHandler(createRecipeModal);
      if(e.target===editRecipeModal) closeModalHandler(editRecipeModal);
      if(e.target===priceBreakdownModal) closeModalHandler(priceBreakdownModal);
    });
  
    // Timer
    function updateTimerDisplay(){
      const m = Math.floor(totalSeconds/60);
      const s = totalSeconds % 60;
      timerMinutes.textContent = String(m).padStart(2,'0');
      timerSeconds.textContent = String(s).padStart(2,'0');
    }
    function startTimer(){
      if(isTimerRunning) return;
      const m = parseInt(timerMinutesInput.value)||0;
      const s = parseInt(timerSecondsInput.value)||0;
      totalSeconds = m*60 + s;
      if(totalSeconds<=0){
        showNotification('Please set a valid timer duration.', true);
        return;
      }
      isTimerRunning = true;
      timerStartBtn.disabled = true;
      timerPauseBtn.disabled = false;
      timerMinutesInput.disabled = true;
      timerSecondsInput.disabled = true;
      updateTimerDisplay();
      timerInterval = setInterval(()=>{
        totalSeconds--;
        if(totalSeconds<0){
          resetTimer();
          showNotification("Time's up!");
        } else {
          updateTimerDisplay();
        }
      }, 1000);
    }
    function pauseTimer(){
      if(!isTimerRunning) return;
      clearInterval(timerInterval);
      isTimerRunning = false;
      timerStartBtn.disabled = false;
      timerPauseBtn.disabled = true;
      timerStartBtn.textContent = 'Resume';
    }
    function resetTimer(){
      clearInterval(timerInterval);
      isTimerRunning = false;
      totalSeconds = 0;
      timerMinutesInput.value = 5;
      timerSecondsInput.value = 0;
      updateTimerDisplay();
      timerStartBtn.disabled = false;
      timerPauseBtn.disabled = true;
      timerStartBtn.textContent = 'Start';
      timerMinutesInput.disabled = false;
      timerSecondsInput.disabled = false;
    }
    timerStartBtn.addEventListener('click', startTimer);
    timerPauseBtn.addEventListener('click', pauseTimer);
    timerResetBtn.addEventListener('click', resetTimer);
  
    // Initial load
    loadFavorites();
    updateTimerDisplay();
  });
  