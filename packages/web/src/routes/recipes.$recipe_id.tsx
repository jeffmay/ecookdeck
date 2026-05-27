import { useNavigate, useParams } from "react-router";
import { useRecipeStore } from "../hooks/useRecipeStore.ts";
import { RecipeEditor } from "../pages/RecipeEditorPage.tsx";

export default function RecipeDetail() {
  const { recipe_id } = useParams();
  const navigate = useNavigate();
  const { recipes } = useRecipeStore();

  if (!recipe_id) return null;

  const recipe = recipes.find((r) => r.id === recipe_id) ?? null;

  return (
    <RecipeEditor
      recipe={recipe}
      onSave={() => navigate("/recipes")}
      onCancel={() => navigate("/recipes")}
    />
  );
}
