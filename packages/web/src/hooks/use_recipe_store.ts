import { useEffect, useState } from "react";
import {
  type CreateRecipeInput,
  type Recipe,
  type RecipeId,
  type RecipeVersion,
  type SaveRecipeInput,
  copyRecipe,
  createRecipe,
  deleteRecipe,
  getRecipeYmap,
  getRecipes,
  saveRecipe,
} from "@recipe-book/shared";
import type { RecipeFolderId } from "@recipe-book/shared";
import { useDoc } from "../contexts/doc_context.js";

export interface RecipeStore {
  readonly recipes: Recipe[];
  readonly create: (input: Omit<CreateRecipeInput, "created_by">) => Recipe;
  readonly save: (recipe_id: RecipeId, input: Omit<SaveRecipeInput, "created_by">) => Recipe;
  readonly copy: (recipe_id: RecipeId, new_title: string, new_folder_id?: RecipeFolderId) => Recipe;
  readonly remove: (recipe_id: RecipeId) => void;
}

export function useRecipeStore(user_name: string): RecipeStore {
  const doc = useDoc();
  const [recipes, set_recipes] = useState<Recipe[]>(() => getRecipes(doc));

  useEffect(() => {
    const map = getRecipeYmap(doc);
    function update() {
      set_recipes(getRecipes(doc));
    }
    map.observe(update);
    return () => map.unobserve(update);
  }, [doc]);

  return {
    recipes,
    create: (input) => createRecipe(doc, { ...input, created_by: user_name }),
    save: (recipe_id, input) => saveRecipe(doc, recipe_id, { ...input, created_by: user_name }),
    copy: (recipe_id, new_title, new_folder_id) =>
      copyRecipe(doc, recipe_id, new_title, new_folder_id, user_name),
    remove: (recipe_id) => deleteRecipe(doc, recipe_id),
  };
}

/** Returns the most-recent version of a recipe, or undefined if none exist. */
export function latestVersion(recipe: Recipe): RecipeVersion | undefined {
  return recipe.versions.at(-1);
}
