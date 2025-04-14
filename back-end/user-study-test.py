import unittest
import os
import json
from typing import Any, Dict
from app import app
from favrecipes import FavRecipes

class RecipeCreationModificationTests(unittest.TestCase):
    """
    Test suite for verifying custom recipe creation and modification functionalities.
    """

    @classmethod
    def setUpClass(cls) -> None:
        """
        Set up testing mode for the Flask app.
        """

        app.config['TESTING'] = True  # enable testing mode

    def setUp(self) -> None:
        """
        Prepare a temporary test file and a fresh instance of FavRecipes before each test.
        """

        self.test_file: str = "test_favrecipes.json"

        # remove any pre-existing test file so we start with a clean slate
        if os.path.exists(self.test_file):
            os.remove(self.test_file)

        # override the app's FavRecipes instance to use our test file
        app.fav_recipes = FavRecipes(self.test_file)

        # init the testing client
        self.client = app.test_client()  

    def tearDown(self) -> None:
        """
        Clean up the temporary test file after each test.
        """

        if os.path.exists(self.test_file):
            os.remove(self.test_file)

    def test_create_recipe_success(self) -> None:
        """
        Test that a new recipe is successfully added to the favorites list.
        It checks the count increment and verifies the stored details.
        """

        recipe_data: Dict[str, Any] = {
            'r_title': "Spaghetti Bolognese",
            'r_id': 1,  # mental note: this will be received as a string by the API
            'r_instructions': "Boil pasta, cook sauce",
            'r_ingredients': "Pasta, Tomato, Beef",
            'r_image': "http://example.com/image.jpg"
        }
        # check how many recipes we have before adding a new one
        response = self.client.get("/test")
        recipes_before: Dict[str, Any] = response.get_json()

        count_before: int = len(recipes_before)

        # send a request to create the new recipe
        response = self.client.post("/create_recipe", data=recipe_data)
        self.assertEqual(response.status_code, 201) # <- created
        response_data: Dict[str, Any] = response.get_json()
        self.assertEqual(response_data.get("message"), "Recipe added successfully") # <- confirm the message also
    

        # verify that the total recipe count increased by one
        response = self.client.get("/test")
        recipes_after: Dict[str, Any] = response.get_json()
        self.assertEqual(len(recipes_after), count_before + 1)

        self.assertIn("Spaghetti Bolognese", recipes_after)

        # verify details of the newly added recipe
        recipe = recipes_after["Spaghetti Bolognese"]

        # the recipe ID is stored as a string (e.g. "1") since it was received as form data
        # verify that we actually have all details
        self.assertEqual(recipe["recipe_id"], "1")
        self.assertEqual(recipe["instructions"], "Boil pasta, cook sauce")
        self.assertEqual(recipe["ingredients"], "Pasta, Tomato, Beef")
        self.assertEqual(recipe["image"], "http://example.com/image.jpg")

    def test_create_recipe_with_existing_list(self) -> None:
        """
        Test creating a new recipe when the favorites list is already populated.
        """
        # pre-populate with an existing recipe directly in the test file
        pre_existing_recipe: Dict[str, Any] = {
            "Chicken Curry": {
                "title": "Chicken Curry",
                "recipe_id": 99,
                "instructions": "Cook chicken with curry spices",
                "ingredients": "Chicken, Curry, Onion, Garlic",
                "image": "http://example.com/chickencurry.jpg"
            }
        }
        # write the pre-existing recipe to the file
        with open(self.test_file, "w") as file:
            json.dump(pre_existing_recipe, file, indent=4)

        # reload the recipes from the file
        app.fav_recipes.recipes = app.fav_recipes.load_recipes()

        # get the current recipe count (should be >= 1)
        response = self.client.get("/test")
        recipes_before: Dict[str, Any] = response.get_json()
        count_before: int = len(recipes_before)
        self.assertGreaterEqual(count_before, 1)

        # prepare new recipe data
        recipe_data: Dict[str, Any] = {
            'r_title': "Vegan Salad",
            'r_id': 2,
            'r_instructions': "Mix all greens and add dressing",
            'r_ingredients': "Lettuce, Spinach, Cucumber, Dressing",
            'r_image': "http://example.com/vegansalad.jpg"
        }
        # send create request for the new recipe
        response = self.client.post("/create_recipe", data=recipe_data)
        self.assertEqual(response.status_code, 201) # <- created

        # confirm the count has incremented by one.
        response = self.client.get("/test")
        recipes_after: Dict[str, Any] = response.get_json()
        self.assertEqual(len(recipes_after), count_before + 1)
        self.assertIn("Vegan Salad", recipes_after)

    def test_create_duplicate_recipe(self) -> None:
        """
        Test that the API prevents the creation of duplicate recipes.
        """
        recipe_data: Dict[str, Any] = {
            'r_title': "Tiramisu",
            'r_id': 3,
            'r_instructions': "Mix ingredients, layer, chill",
            'r_ingredients': "Coffee, Mascarpone, Ladyfingers",
            'r_image': "http://example.com/tiramisu.jpg"
        }

        # create the recipe for the first time.
        response = self.client.post("/create_recipe", data=recipe_data)
        self.assertEqual(response.status_code, 201) # <- created

        # try to create the same recipe again (should fail).
        response_duplicate = self.client.post("/create_recipe", data=recipe_data)
        self.assertEqual(response_duplicate.status_code, 409) # <- should give conflict
        response_dup_data: Dict[str, Any] = response_duplicate.get_json()
        self.assertEqual(response_dup_data.get("error"), "Recipe with this title already exists")

    def test_update_recipe_success(self) -> None: 
        """
        Test successful update of an existing recipe's instructions.
        """
        # create a recipe to update later
        recipe_data: Dict[str, Any] = {
            'r_title': "Pancakes",
            'r_id': 4,
            'r_instructions': "Mix flour, eggs, milk",
            'r_ingredients': "Flour, Eggs, Milk",
            'r_image': "http://example.com/pancakes.jpg"
        }
        response = self.client.post("/create_recipe", data=recipe_data)
        self.assertEqual(response.status_code, 201) # <- created

        # update data for the recipe instructions
        update_data: Dict[str, Any] = {
            "r_title": "Pancakes",
            "r_instructions": "Mix flour, eggs, milk thoroughly and add vanilla extract"
        }
        # send the update request
        update_response = self.client.put("/update_recipe_instructions", json=update_data)
        self.assertEqual(update_response.status_code, 200) # <- should give ok
        update_response_data: Dict[str, Any] = update_response.get_json()
        self.assertEqual(update_response_data.get("message"), "Ingredients updated successfully")

        # retrieve the updated recipe to confirm changes (so we check if it is actually chanhed not just the message)
        response = self.client.get("/test")
        recipes_after_update: Dict[str, Any] = response.get_json()
        self.assertIn("Pancakes", recipes_after_update)
        self.assertEqual(
            recipes_after_update["Pancakes"]["ingredients"],
            "Mix flour, eggs, milk thoroughly and add vanilla extract"
        )

    def test_update_nonexistent_recipe(self) -> None:
        """
        Test that updating a recipe that does not exist returns an error.
        """
        update_data: Dict[str, Any] = {
            "r_title": "nonexistent recipe",
            "r_instructions": "New instructions that won't be applied"
        }
        # try to update a recipe that doesn't exist.
        update_response = self.client.put("/update_recipe_instructions", json=update_data)
        self.assertEqual(update_response.status_code, 404) # <- should give not found
        update_response_data: Dict[str, Any] = update_response.get_json()
        self.assertEqual(update_response_data.get("error"), "Recipe with this title does not exist")

if __name__ == "__main__":
    unittest.main()
