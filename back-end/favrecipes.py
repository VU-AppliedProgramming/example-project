'''
title
id
instructions
ingredients
image
'''
import json

class Recipe:
    def __init__(self, title, id, instructions, ingredients, image):
        self.title = title
        self.id = id
        self.instructions = instructions
        self.ingredients = ingredients
        self.image = image


class FavRecipes:
    def __init__(self, file_path) -> None:
        self.file_path = file_path
        self.recipes = self.load_recipes()

    def load_recipes(self):
        try:
            with open(self.file_path) as file:
                recipes = json.load(file)
        except FileNotFoundError:
            recipes = {}
        return recipes
    
    def save_recipe(self):
        with open(self.file_path, 'w') as file:
            json.dump(self.recipes, file, indent=4)

    def add_recipe(self, recipe:Recipe):
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
    
    def delete_recipe(self, recipe:Recipe):
        if recipe.title in self.recipes:
            del self.recipes[recipe.title]
            self.save_recipe()
            return True 
        return False  
    
    def update_recipe(self, recipe:Recipe, new_ingredients:str):
        if recipe.title in self.recipes:
            self.recipes[recipe.title]["ingredients"] = new_ingredients
            self.save_recipe()
            return True  
        return False

    def get_recipes(self):
        return self.recipes


