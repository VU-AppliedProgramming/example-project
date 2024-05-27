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
            }, 1000);

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
        pauseButton.style.display = 'none';
        resetButton.style.display = 'none';
        closeButton.style.display = 'none';

        timerDisplay.textContent = '';
    }

    function displayTime(milliseconds) {
        let minutes = Math.floor(milliseconds / 60000);
        let seconds = Math.floor((milliseconds % 60000) / 1000);

        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    searchButton.addEventListener('click', getMealList);
    mealList.addEventListener('click', handleMealListClick);
    randomButton.addEventListener('click', getRandomRecipe);
    recipeCloseButton.addEventListener('click', () => {
        mealDetailsContent.parentElement.classList.remove('showRecipe');
    });

    if (!calorieFilterCheckbox.checked) {
        minCaloriesInput.style.display = 'none';
        maxCaloriesInput.style.display = 'none';
    }

    calorieFilterCheckbox.addEventListener('change', () => {
        if (calorieFilterCheckbox.checked) {
            minCaloriesInput.style.display = 'inline-block';
            maxCaloriesInput.style.display = 'inline-block';
        } else {
            minCaloriesInput.style.display = 'none';
            maxCaloriesInput.style.display = 'none';
        }
    });

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
    function checkBackendStatus() {
        fetch('/check_backend')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Back end server is not running.');
                }
                return response.text();
            })
            .then(data => {
                console.log(data);
            })
            .catch(error => {
                console.error('Error checking backend status:', error);
                showPopup('Back end server is down!');
            });
    }
    
    function showPopup(message) {
        const popup = document.createElement('div');
        popup.classList.add('popup');
        popup.textContent = message;
    
        document.body.appendChild(popup);
    
        setTimeout(() => {
            document.body.removeChild(popup);
        }, 5000);
    }
    
    setInterval(checkBackendStatus, 5000);

    function getMealList() {
        let searchInputTxt = document.getElementById('search-input').value.trim();
        let url = `/api/meals?query=${searchInputTxt}`;

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
            .catch(error => {
                console.error('Error fetching meals:', error);
            });
    }
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