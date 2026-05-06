import * as Y from "yjs";
import type { Ingredient } from "../types/kitchenware.js";
import type { MeasurementType } from "../types/measurement.js";
import { DEFAULT_KITCHENWARE } from "../fixtures/default_kitchenware.js";
import { is_ingredient } from "../types/kitchenware.js";

const MAP_KEY = "ingredients";

export function get_ingredient_ymap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap(MAP_KEY);
}

interface StoredIngredient {
  readonly name: string;
  readonly default_measurement_type: MeasurementType;
  readonly labels: string[];
  readonly parent_id?: string;
}

function to_stored(i: Ingredient): StoredIngredient {
  return {
    name: i.name,
    default_measurement_type: i.default_measurement_type,
    labels: [...i.labels],
    ...(i.parent_id !== undefined && { parent_id: i.parent_id }),
  };
}

function validate_stored(id: string, raw: unknown): Ingredient | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const name = obj["name"];
  const mtype = obj["default_measurement_type"];
  const labels = obj["labels"];
  const parent_id = obj["parent_id"];
  if (typeof name !== "string") return null;
  if (mtype !== "volume" && mtype !== "weight" && mtype !== "count") return null;
  if (!Array.isArray(labels) || !labels.every((l) => typeof l === "string")) return null;
  const base: Ingredient = {
    kind: "ingredient",
    id,
    name,
    default_measurement_type: mtype,
    labels,
  };
  if (typeof parent_id === "string") return { ...base, parent_id };
  return base;
}

export function get_ingredients(doc: Y.Doc): Ingredient[] {
  const map = get_ingredient_ymap(doc);
  const results: Ingredient[] = [];
  map.forEach((value, id) => {
    const ingredient = validate_stored(id, value);
    if (ingredient !== null) results.push(ingredient);
  });
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

export function init_ingredients_from_defaults(doc: Y.Doc): void {
  const map = get_ingredient_ymap(doc);
  if (map.size > 0) return;
  doc.transact(() => {
    for (const item of DEFAULT_KITCHENWARE) {
      if (is_ingredient(item)) {
        map.set(item.id, to_stored(item));
      }
    }
  });
}

export function add_ingredient(doc: Y.Doc, ingredient: Ingredient): void {
  get_ingredient_ymap(doc).set(ingredient.id, to_stored(ingredient));
}

export function add_labels_to_ingredients(
  doc: Y.Doc,
  ids: readonly string[],
  new_labels: readonly string[],
): void {
  const map = get_ingredient_ymap(doc);
  doc.transact(() => {
    for (const id of ids) {
      const ingredient = validate_stored(id, map.get(id));
      if (ingredient === null) continue;
      const label_set = new Set([...ingredient.labels, ...new_labels]);
      map.set(id, to_stored({ ...ingredient, labels: [...label_set] }));
    }
  });
}

export function remove_labels_from_ingredients(
  doc: Y.Doc,
  ids: readonly string[],
  labels_to_remove: readonly string[],
): void {
  const remove_set = new Set(labels_to_remove);
  const map = get_ingredient_ymap(doc);
  doc.transact(() => {
    for (const id of ids) {
      const ingredient = validate_stored(id, map.get(id));
      if (ingredient === null) continue;
      const new_labels = ingredient.labels.filter((l) => !remove_set.has(l));
      if (new_labels.length === ingredient.labels.length) continue;
      map.set(id, to_stored({ ...ingredient, labels: new_labels }));
    }
  });
}

export function set_measurement_type_for_ingredients(
  doc: Y.Doc,
  ids: readonly string[],
  type: MeasurementType,
): void {
  const map = get_ingredient_ymap(doc);
  doc.transact(() => {
    for (const id of ids) {
      const ingredient = validate_stored(id, map.get(id));
      if (ingredient === null || ingredient.default_measurement_type === type) continue;
      map.set(id, to_stored({ ...ingredient, default_measurement_type: type }));
    }
  });
}

export function set_parent_for_ingredients(
  doc: Y.Doc,
  ids: readonly string[],
  parent_id: string | undefined,
): void {
  const map = get_ingredient_ymap(doc);
  doc.transact(() => {
    for (const id of ids) {
      const ingredient = validate_stored(id, map.get(id));
      if (ingredient === null) continue;
      const updated: Ingredient = {
        kind: "ingredient",
        id: ingredient.id,
        name: ingredient.name,
        default_measurement_type: ingredient.default_measurement_type,
        labels: [...ingredient.labels],
        ...(parent_id !== undefined && { parent_id }),
      };
      map.set(id, to_stored(updated));
    }
  });
}

export function make_ingredient_id(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return `${slug}_${Date.now().toString(36)}`;
}
