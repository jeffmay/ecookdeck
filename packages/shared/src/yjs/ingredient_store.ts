import { type } from "arktype";
import * as Y from "yjs";
import { isTypeError } from "../assertions/index.js";
import type { KitchenwareTemplate } from "../fixtures/parse_kitchenware_csv.js";
import { loadId } from "../types/ids.js";
import { Ingredient, IngredientId, KitchenwareKind, KitchenwareLabelId } from "../types/kitchenware.js";
import { MeasurementType } from "../types/measurement.js";
import { setOf } from "../types/sets.js";
import { findOrCreateLabel, getLabelsYmap } from "./label_store.js";

const MAP_KEY = "ingredients";

const DEFAULT_INGREDIENT_KINDS: ReadonlySet<KitchenwareKind> = new Set(["ingredient"]);

export function getIngredientYmap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap(MAP_KEY);
}

const StoredIngredient = type({
  name: "string",
  default_measurement_type: MeasurementType,
  labels: setOf<KitchenwareLabelId>(KitchenwareLabelId.type),
  "parent_id?": IngredientId.type,
});

function toStored(i: Ingredient) {
  return {
    name: i.name,
    default_measurement_type: i.default_measurement_type,
    labels: [...i.labels],
    ...(i.parent_id !== undefined && { parent_id: i.parent_id }),
  };
}

// TODO: Log invalid ingredients instead of silently skipping them
function validateStored(id: IngredientId, raw: unknown): Ingredient | null {
  const result = StoredIngredient(raw);
  if (isTypeError(result)) return null;
  return {
    kind: "ingredient",
    id,
    name: result.name,
    default_measurement_type: result.default_measurement_type,
    labels: result.labels,
    ...(result.parent_id !== undefined && { parent_id: result.parent_id }),
  };
}

export function getIngredients(doc: Y.Doc): Ingredient[] {
  const map = getIngredientYmap(doc);
  const results: Ingredient[] = [];
  map.forEach((value, id) => {
    const ingredient = validateStored(loadId(IngredientId, id), value);
    if (ingredient != null) results.push(ingredient);
  });
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

export function initFromKitchenwareTemplates(
  doc: Y.Doc,
  templates: readonly KitchenwareTemplate[],
): void {
  const ingredient_map = getIngredientYmap(doc);
  const labels_map = getLabelsYmap(doc);
  if (ingredient_map.size > 0 || labels_map.size > 0) return;

  // Collect all unique label names across all templates
  const all_label_names = new Set<string>();
  for (const item of templates) {
    for (const label_name of item.label_names) {
      all_label_names.add(label_name);
    }
  }

  doc.transact(() => {
    // Create a label for each unique name and build name → id map
    const label_name_to_id = new Map<string, KitchenwareLabelId>();
    for (const label_name of all_label_names) {
      const id = findOrCreateLabel(doc, label_name, DEFAULT_INGREDIENT_KINDS);
      label_name_to_id.set(label_name, id);
    }

    // Create each ingredient template as a real Ingredient
    for (const item of templates) {
      if (item.kind !== "ingredient") continue;
      const label_ids = new Set<KitchenwareLabelId>(
        item.label_names
          .map((name) => label_name_to_id.get(name))
          .filter((id): id is KitchenwareLabelId => id != null),
      );
      const ingredient: Ingredient = {
        kind: "ingredient",
        id: loadId(IngredientId, item.id),
        name: item.name,
        default_measurement_type: item.default_measurement_type,
        labels: label_ids,
      };
      ingredient_map.set(ingredient.id, toStored(ingredient));
    }
  });
}

export function addIngredient(doc: Y.Doc, ingredient: Ingredient): void {
  getIngredientYmap(doc).set(ingredient.id, toStored(ingredient));
}

export function addLabelsToIngredients(
  doc: Y.Doc,
  ids: readonly IngredientId[],
  label_ids: readonly KitchenwareLabelId[],
): void {
  const map = getIngredientYmap(doc);
  doc.transact(() => {
    for (const id of ids) {
      const ingredient = validateStored(id, map.get(id));
      if (ingredient === null) continue;
      const new_labels = new Set([...ingredient.labels, ...label_ids]);
      map.set(id, toStored({ ...ingredient, labels: new_labels }));
    }
  });
}

export function removeLabelsFromIngredients(
  doc: Y.Doc,
  ids: readonly IngredientId[],
  label_ids: readonly KitchenwareLabelId[],
): void {
  const remove_set = new Set<string>(label_ids);
  const map = getIngredientYmap(doc);
  doc.transact(() => {
    for (const id of ids) {
      const ingredient = validateStored(id, map.get(id));
      if (ingredient === null) continue;
      const new_labels = new Set([...ingredient.labels].filter((l) => !remove_set.has(l)));
      if (new_labels.size === ingredient.labels.size) continue;
      map.set(id, toStored({ ...ingredient, labels: new_labels }));
    }
  });
}

export function removeLabelFromAllIngredients(
  doc: Y.Doc,
  label_id: KitchenwareLabelId,
): void {
  const map = getIngredientYmap(doc);
  doc.transact(() => {
    map.forEach((value, id) => {
      const ingredient = validateStored(loadId(IngredientId, id), value);
      if (ingredient === null) return;
      if (!ingredient.labels.has(label_id)) return;
      const new_labels = new Set(ingredient.labels);
      new_labels.delete(label_id);
      map.set(id, toStored({ ...ingredient, labels: new_labels }));
    });
  });
}

export function replaceLabelInAllIngredients(
  doc: Y.Doc,
  old_label_ids: readonly KitchenwareLabelId[],
  new_label_id: KitchenwareLabelId,
): void {
  const old_set = new Set<string>(old_label_ids);
  const map = getIngredientYmap(doc);
  doc.transact(() => {
    map.forEach((value, id) => {
      const ingredient = validateStored(loadId(IngredientId, id), value);
      if (ingredient === null) return;
      const has_any_old = [...ingredient.labels].some((l) => old_set.has(l));
      if (!has_any_old) return;
      const new_labels = new Set([...ingredient.labels].filter((l) => !old_set.has(l)));
      new_labels.add(new_label_id);
      map.set(id, toStored({ ...ingredient, labels: new_labels }));
    });
  });
}

export function setMeasurementTypeForIngredients(
  doc: Y.Doc,
  ids: readonly IngredientId[],
  type: MeasurementType,
): void {
  const map = getIngredientYmap(doc);
  doc.transact(() => {
    for (const id of ids) {
      const ingredient = validateStored(id, map.get(id));
      if (ingredient === null || ingredient.default_measurement_type === type) continue;
      map.set(id, toStored({ ...ingredient, default_measurement_type: type }));
    }
  });
}

export function setParentForIngredients(
  doc: Y.Doc,
  ids: readonly IngredientId[],
  parent_id: IngredientId | undefined,
): void {
  const map = getIngredientYmap(doc);
  doc.transact(() => {
    for (const id of ids) {
      const ingredient = validateStored(id, map.get(id));
      if (ingredient === null) continue;
      const updated: Ingredient = {
        kind: "ingredient",
        id: ingredient.id,
        name: ingredient.name,
        default_measurement_type: ingredient.default_measurement_type,
        labels: ingredient.labels,
        ...(parent_id !== undefined && { parent_id }),
      };
      map.set(id, toStored(updated));
    }
  });
}

export function renameIngredient(
  doc: Y.Doc,
  id: IngredientId,
  name: string,
): void {
  const map = getIngredientYmap(doc);
  const ingredient = validateStored(id, map.get(id));
  if (ingredient === null) return;
  map.set(id, toStored({ ...ingredient, name }));
}

export function setLabelsForIngredient(
  doc: Y.Doc,
  id: IngredientId,
  label_ids: readonly KitchenwareLabelId[],
): void {
  const map = getIngredientYmap(doc);
  const ingredient = validateStored(id, map.get(id));
  if (ingredient === null) return;
  map.set(id, toStored({ ...ingredient, labels: new Set(label_ids) }));
}
