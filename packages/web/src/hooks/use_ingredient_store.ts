import { useState, useEffect } from "react";
import type { Ingredient } from "@recipe-book/shared";
import type { MeasurementType } from "@recipe-book/shared";
import {
  get_ingredients,
  init_ingredients_from_defaults,
  add_ingredient,
  add_labels_to_ingredients,
  remove_labels_from_ingredients,
  set_measurement_type_for_ingredients,
  set_parent_for_ingredients,
  make_ingredient_id,
} from "@recipe-book/shared";
import { use_doc } from "../contexts/doc_context.js";

export interface NewIngredientInput {
  readonly name: string;
  readonly default_measurement_type: MeasurementType;
  readonly labels: readonly string[];
  readonly parent_id?: string;
}

export interface UseIngredientStoreResult {
  readonly ingredients: readonly Ingredient[];
  readonly create_ingredient: (input: NewIngredientInput) => string;
  readonly add_labels: (ids: readonly string[], labels: readonly string[]) => void;
  readonly remove_labels: (ids: readonly string[], labels: readonly string[]) => void;
  readonly set_measurement_type: (ids: readonly string[], type: MeasurementType) => void;
  readonly set_parent: (ids: readonly string[], parent_id: string | undefined) => void;
}

export function use_ingredient_store(): UseIngredientStoreResult {
  const doc = use_doc();
  const [ingredients, set_ingredients] = useState<Ingredient[]>(() => {
    init_ingredients_from_defaults(doc);
    return get_ingredients(doc);
  });

  useEffect(() => {
    const map = doc.getMap("ingredients");
    const handler = () => set_ingredients(get_ingredients(doc));
    map.observe(handler);
    return () => map.unobserve(handler);
  }, [doc]);

  return {
    ingredients,
    create_ingredient(input) {
      const id = make_ingredient_id(input.name);
      const ingredient: Ingredient = {
        kind: "ingredient",
        id,
        name: input.name,
        default_measurement_type: input.default_measurement_type,
        labels: [...input.labels],
        ...(input.parent_id !== undefined && { parent_id: input.parent_id }),
      };
      add_ingredient(doc, ingredient);
      return id;
    },
    add_labels(ids, labels) {
      add_labels_to_ingredients(doc, ids, labels);
    },
    remove_labels(ids, labels) {
      remove_labels_from_ingredients(doc, ids, labels);
    },
    set_measurement_type(ids, type) {
      set_measurement_type_for_ingredients(doc, ids, type);
    },
    set_parent(ids, parent_id) {
      set_parent_for_ingredients(doc, ids, parent_id);
    },
  };
}
