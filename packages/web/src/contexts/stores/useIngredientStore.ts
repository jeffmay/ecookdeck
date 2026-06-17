import { create } from 'zustand';

export interface Ingredient {
  id: string;
  name: string;
  default_measurement_value: {
    numerator: number;
    denominator: number;
    unit: string;
  };
  labels: Set<string>;
  parent_id?: string;
  costPerUnit?: number;
}

interface IngredientStore {
  ingredients: Ingredient[];
  createIngredient: (ing: Ingredient) => void;
  renameIngredient: (id: string, name: string) => void;
  setMeasurementValue: (ids: string[], value: any) => void;
  addLabels: (ids: string[], labels: string[]) => void;
  removeLabels: (ids: string[], labels: string[]) => void;
  setLabels: (id: string, labels: string[]) => void;
  setParent: (ids: string[], parentId?: string) => void;
}

export const useIngredientStore = create<IngredientStore>((set) => ({
  ingredients: [],
  createIngredient: (ing) => set((state) => ({ ingredients: [...state.ingredients, ing] })),
  renameIngredient: (id, name) => set((state) => ({
    ingredients: state.ingredients.map((i) => (i.id === id ? { ...i, name } : i)),
  })),
  setMeasurementValue: (ids, value) => set((state) => ({
    ingredients: state.ingredients.map((i) => (ids.includes(i.id) ? { ...i, default_measurement_value: value } : i)),
  })),
  addLabels: (ids, labels) => set((state) => ({
    ingredients: state.ingredients.map((i) => {
      if (!ids.includes(i.id)) return i;
      const newLabels = new Set(i.labels);
      labels.forEach(l => newLabels.add(l));
      return { ...i, labels: newLabels };
    }),
  })),
  removeLabels: (ids, labels) => set((state) => ({
    ingredients: state.ingredients.map((i) => {
      if (!ids.includes(i.id)) return i;
      const newLabels = new Set(i.labels);
      labels.forEach(l => newLabels.delete(l));
      return { ...i, labels: newLabels };
    }),
  })),
  setLabels: (id, labels) => set((state) => ({
    ingredients: state.ingredients.map((i) => (i.id === id ? { ...i, labels: new Set(labels) } : i)),
  })),
  setParent: (ids, parentId) => set((state) => ({
    ingredients: state.ingredients.map((i) => (ids.includes(i.id) ? { ...i, parent_id: parentId } : i)),
  })),
}));
