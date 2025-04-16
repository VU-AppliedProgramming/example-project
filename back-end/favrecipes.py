from typing import Dict
import json

class Recipe:
    def __init__(self, title: str, id: int, instructions: str, ingredients: str, image: str) -> None:
        """
        Initialize a Recipe object.

        Parameters:
            title (str): The title of the recipe.
            id (int): The ID of the recipe.
            instructions (str): The instructions for making the recipe.
            ingredients (str): The ingredients required for the recipe.
            image (str): The URL of the image representing the recipe.
        """
        self.title = title
        self.id = id
        self.instructions = instructions
        self.ingredients = ingredients
        self.image = image


class FavRecipes:
    def __init__(self, file_path: str) -> None:
        """
        Initialize a FavRecipes object.

        Parameters:
            file_path (str): The file path to save the recipes.
        """
        self.file_path = file_path
        self.recipes = self.load_recipes()


    def load_recipes(self) -> Dict[str, any]:
        """
        Load recipes from a JSON file.

        Returns:
            Dict[str, Any]: Dictionary containing loaded recipes.
        """
        try:
            with open(self.file_path) as file:
                recipes = json.load(file)
        except FileNotFoundError:
            recipes = {}
        return recipes
    
    
    def save_recipe(self) -> None:
        """Save recipes to a JSON file."""
        with open(self.file_path, 'w') as file:
            json.dump(self.recipes, file, indent=4)


    def add_recipe(self, recipe: Recipe) -> bool:
        """
        Add a recipe to the collection.

        Parameters:
            recipe (Recipe): The recipe to add.

        Returns:
            bool: True if the recipe was successfully added, False otherwise.
        """
        if recipe.title in self.recipes:
            return False
        self.recipes[recipe.title] = {
            "title": recipe.title,
            "recipe_id": recipe.id,
            "instructions": recipe.instructions,
            "ingredients": recipe.ingredients,
            "image": recipe.image
        }
        self.save_recipe()
        return True
    
    
    def delete_recipe(self, recipe: Recipe) -> bool:
        """
        Delete a recipe from the collection.

        Parameters:
            recipe (Recipe): The recipe to delete.

        Returns:
            bool: True if the recipe was successfully deleted, False otherwise.
        """
        if recipe.title in self.recipes:
            del self.recipes[recipe.title]
            self.save_recipe()
            return True 
        return False 
    
    
    def update_recipe(self, recipe: Recipe, new_ingredients: str) -> bool:
        """
        Update ingredients of a recipe.

        Parameters:
            recipe (Recipe): The recipe to update.
            new_ingredients (str): The new ingredients to update.

        Returns:
            bool: True if the recipe was successfully updated, False otherwise.
        """
        if recipe.title in self.recipes:
            self.recipes[recipe.title]["instructions"] = new_ingredients
            self.save_recipe()
            return True  
        return False
    

    def get_recipes(self) -> Dict[str, any]:
        """
        Get all recipes.

        Returns:
            Dict[str, Any]: Dictionary containing all recipes.
        """
        return self.recipes


