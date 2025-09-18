import json

# chemins des fichiers
RECIPES_FILE = "app/data/recipes.json"
INGREDIENTS_FILE = "app/data/ingredients.json"

def find_missing_ingredients():
    with open(RECIPES_FILE, "r", encoding="utf-8") as f:
        recipes = json.load(f)

    with open(INGREDIENTS_FILE, "r", encoding="utf-8") as f:
        ingredients = json.load(f)

    # set de tous les ingrédients dans recipes.json
    recipe_ings = {ing["ingredient_id"] for r in recipes for ing in r["ingredients"]}

    # set de tous les ingrédients disponibles dans ingredients.json
    available_ings = {ing["id"] for ing in ingredients}

    # ingrédients manquants
    missing = sorted(recipe_ings - available_ings)

    if missing:
        print("⚠️ Ingrédients manquants dans ingredients.json :")
        for m in missing:
            print("-", m)
    else:
        print("✅ Tous les ingrédients des recettes existent dans ingredients.json !")

if __name__ == "__main__":
    find_missing_ingredients()
