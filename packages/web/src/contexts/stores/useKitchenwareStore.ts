import { create } from 'zustand';

export interface Kitchenware {
  id: string;
  name: string;
  status: 'available' | 'in-use' | 'cleaning';
}

interface KitchenwareStore {
  tools: Kitchenware[];
  addTool: (tool: Kitchenware) => void;
  setToolStatus: (id: string, status: Kitchenware['status']) => void;
  getAvailableTools: () => Kitchenware[];
  assignToolToRecipe: (toolId: string, recipeId: string) => void;
}

export const useKitchenwareStore = create<KitchenwareStore>((set, get) => ({
  tools: [],
  addTool: (tool) => set((state) => ({ tools: [...state.tools, tool] })),
  setToolStatus: (id, status) => set((state) => ({
    tools: state.tools.map((t) => (t.id === id ? { ...t, status } : t)),
  })),
  getAvailableTools: () => get().tools.filter((t) => t.status === 'available'),
  assignToolToRecipe: (toolId) => set((state) => ({
    tools: state.tools.map((t) => (t.id === toolId ? { ...t, status: 'in-use' } : t)),
  })),
}));
