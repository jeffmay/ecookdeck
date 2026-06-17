import { create } from 'zustand';
import { useRecipeStore } from './useRecipeStore';
import { useKitchenwareStore } from './useKitchenwareStore';

interface WorkflowStore {
  activeRecipeId: string | null;
  stepIndex: number;
  startPreparation: (recipeId: string) => void;
  nextStep: () => void;
  verifyRequirements: () => boolean;
}

export const usePreparationWorkflow = create<WorkflowStore>((set, get) => ({
  activeRecipeId: null,
  stepIndex: 0,
  startPreparation: (recipeId) => set({
    activeRecipeId: recipeId,
    stepIndex: 0,
  }),
  nextStep: () => set((state) => ({
    stepIndex: state.stepIndex + 1,
  })),
  verifyRequirements: () => {
    const recipeId = get().activeRecipeId;
    if (!recipeId) return false;

    const recipe = useRecipeStore.getState().getRecipeById(recipeId);
    if (!recipe) return false;

    const availableTools = useKitchenwareStore.getState().getAvailableTools();
    // In a real app, we would check recipe.requiredTools
    return true;
  },
}));
