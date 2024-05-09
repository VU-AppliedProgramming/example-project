'''
title
id
instructions
ingredients
image
'''
import json


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

    def add_recipe(self, r_title, r_instructions, r_ingredients, r_image, r_id):
        if r_title in self.recipes:
            return False
        self.recipes[r_title] = {
            "title": r_title,
            "recipe_id": r_id,
            "instructions": r_instructions,
            "ingredients": r_ingredients,
            "image": r_image
        }
        self.save_recipe()
        return True
    
    def delete_recipe(self, recipe_name):
        if recipe_name in self.recipes:
            del self.recipes[recipe_name]
            self.save_recipe()
            return True 
        return False  
    
    def update_recipe(self, recipe_name, new_ingredients):
        if recipe_name in self.recipes:
            self.recipes[recipe_name]["ingredients"] = new_ingredients
            self.save_recipe()
            return True  
        return False

    def get_recipes(self):
        return self.recipes
