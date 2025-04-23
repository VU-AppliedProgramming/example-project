from typing import Dict, List, Tuple
import json
import random

class Recipe:
    def __init__(self, title: str, instructions: str, ingredients: str, image: str, id: int = None) -> None:
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
        self.recipe_id = id
        self.instructions = instructions
        self.ingredients = ingredients
        self.image = image

    def __str__(self):
        return f"[{self.id}] Recipe {self.title}"


class Feast_Finder:
    """
        Initialize the Feast Finder app.

        Parameters:
            file_path (str): The file path to save the recipes.
        """

    def __init__(self, file_path: str):
        self.favorite_recipes = {}
        self.storage_path = file_path
        
    def load_recipes(self) -> None:
        """
        Load recipes from a JSON file.

        Returns:
            Dict[str, Any]: Dictionary containing loaded recipes.
        """
        try:
            with open(self.storage_path) as file:
                raw_json = json.load(file)
                if raw_json:
                    recipes = self.process_raw_json(raw_json)
                    self.favorite_recipes = recipes

        except FileNotFoundError:
            print("There was an error while reading the file")
    
    def process_raw_json(self, raw_json) -> Dict[str, Recipe]:
        recipes = {}
        for recipe_name in raw_json:
            id: str = raw_json[recipe_name]['recipe_id']
            recipes[id] = Recipe(recipe_name, raw_json[recipe_name]['instructions'], raw_json[recipe_name]['ingredients'], raw_json[recipe_name]['image'], id=id)
        return recipes
    
    def get_favorite_recipes(self) -> Dict[str, Recipe]:
        """
        Get all recipes.

        Returns:
            Dict[str, Any]: Dictionary containing all recipes.
        """
        return self.favorite_recipes
    
    def add_recipe(self, recipe: Recipe) -> bool:
        """
        Add a recipe to the collection.

        Parameters:
            recipe (Recipe): The recipe to add.

        Returns:
            bool: True if the recipe was successfully added, False otherwise.
        """
        if recipe.recipe_id in self.favorite_recipes:
            return False
        self.favorite_recipes[recipe.recipe_id] = recipe
        self.save_recipe()
        return True
    
    def update_recipe(self, recipe_id: str, new_instructions: str) -> bool:
        """
        Update instructions of a recipe.

        Parameters:
            recipe_id (str): The ID of the recipe to update.
            new_instructions (str): The new instructions to update.

        Returns:
            bool: True if the recipe was successfully updated, False otherwise.
        """
        if recipe_id in self.favorite_recipes:
            recipe = self.favorite_recipes[recipe_id]
            recipe.instructions = new_instructions  # update instructions instead of ingredients
            self.save_recipe()
            return True  
        return False
    
    def delete_recipe(self, recipe_id: str) -> bool:
        """
        Delete a recipe from the collection.

        Parameters:
            recipe (Recipe): The recipe to delete.

        Returns:
            bool: True if the recipe was successfully deleted, False otherwise.
        """
        if recipe_id in self.favorite_recipes:
            del self.favorite_recipes[recipe_id]
            self.save_recipe()
            return True 
        return False 
    
    def save_recipe(self) -> None:
        """Save recipes to a JSON file."""
        with open(self.storage_path, 'w') as file:
            serialized_recipes = {recipe: self.favorite_recipes[recipe].__dict__ for recipe in self.favorite_recipes}
            json.dump(serialized_recipes, file, indent=4)

    def exists_recipe_with_id(self, id:str) -> bool:
        return True if id in self.favorite_recipes else False
    
    def get_id(self, id:str) -> str:
        if id == None or self.exists_recipe_with_id(id):
            print(f"########: {id}")
            new_id = f"{random.randint(0, 120000)}"
            return new_id
        return id

