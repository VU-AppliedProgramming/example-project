# Requirements

## 1. Recipe Search and Browsing

- **Search for recipes** based on keywords or specific ingredients  
- **Filter recipes** by calorie range (minimum and maximum calories)  
- **View detailed recipe information**, including:
  - Ingredients
  - Instructions
  - Images
  - Nutrition details  
- **Retrieve random recipes** for inspiration or spontaneous cooking  

## 2. Favorites Management

### 2.1 Add recipes to favorites

- Sources:
  - Recipes found via search
  - Custom recipes created manually  
- **Required fields**:
  - `recipe_id` (unique string used to identify the recipe in favorites) 
  - `title` (name of the recipe)  
  - `instructions` (cooking/preparation steps)  
  - `ingredients` (list of ingredients needed)  
- **Optional fields**:
  - `image` (URL or file path to the recipe’s image)  


### 2.2 View favorite recipes

- Retrieve a list of all favorite recipes  
- Retrieve details of a specific favorite recipe by `id`  

### 2.3 Update recipe instructions

- Edit the `instructions` of an existing favorite recipe (identified by `id`)  

### 2.4 Delete recipes from favorites

- Remove a recipe from favorites by specifying its `id`  

## 3. User Recipe Creation

- Create custom recipes with the same fields as above:
  - **Required**: `recipe_id`, `title`, `instructions`, `ingredients`
  - **Optional**: `image`,  

## 4. Recipe Cost Information

- View a price breakdown for a recipe’s ingredients (if an external ID is available or sourced from Spoonacular)  

## 5. Cooking Assistance Features

- **Interactive cooking timer** (front‑end feature):
  - Allows users to set and manage cooking times directly on the website  

## Additional Notes

- **Error Handling**:
  - Missing any required field (`id`, `title`, `instructions`, `ingredients`) → **400 Bad Request** with descriptive error  
  - Duplicate `id` when creating a recipe → **409 Conflict**  
  - Updating or deleting a non-existent recipe → **404 Not Found**  
- The system uses the **`id`** as the unique key for local storage in favorites.   
