import { type } from "arktype";
import { ReadonlyDeep } from "type-fest";
import * as Y from "yjs";
import { is_type_error } from "../assertions/index.js";
import { KitchenwareKind, KitchenwareLabelId, type KitchenwareLabel } from "../types/kitchenware.js";
import { setOf } from "../types/sets.js";
import { random_id } from "../types/ids.js";

const LABELS_MAP_KEY = "labels";

const StoredLabel = type({
  name: "string",
  kinds: setOf(KitchenwareKind),
});

export function get_labels_ymap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap(LABELS_MAP_KEY);
}

function validate_label(id: string, raw: unknown): KitchenwareLabel | type.errors {
  const result = StoredLabel(raw);
  if (result instanceof type.errors) {
    return result;
  }
  const labelId = KitchenwareLabelId.type(id);
  if (is_type_error(labelId)) {
    return labelId;
  }
  return { id: labelId, name: result.name, kinds: result.kinds };
}

function to_stored(label: ReadonlyDeep<KitchenwareLabel>) {
  return {
    name: label.name,
    kinds: [...label.kinds],
  };
}

export function get_labels(doc: Y.Doc): KitchenwareLabel[] {
  const map = get_labels_ymap(doc);
  const results: KitchenwareLabel[] = [];
  map.forEach((value, id) => {
    const label = validate_label(id, value);
    if (!is_type_error(label)) results.push(label);
  });
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

export function add_label(
  doc: Y.Doc,
  name: string,
  kinds: ReadonlySet<KitchenwareKind>,
): KitchenwareLabelId {
  const id = random_id(KitchenwareLabelId);
  get_labels_ymap(doc).set(id, to_stored({ id, name, kinds }));
  return id;
}

export function find_label_by_name(doc: Y.Doc, name: string): KitchenwareLabel | null {
  const map = get_labels_ymap(doc);
  let found: KitchenwareLabel | null = null;
  for (const [id, value] of map) {
    const label = validate_label(id, value);
    if (!is_type_error(label) && label.name === name) {
      found = label;
      break;
    }
  }
  return found;
}

export function find_or_create_label(
  doc: Y.Doc,
  name: string,
  kinds: ReadonlySet<KitchenwareKind>,
): KitchenwareLabelId {
  const existing = find_label_by_name(doc, name);
  if (existing !== null) return existing.id;
  return add_label(doc, name, kinds);
}

export function delete_labels(doc: Y.Doc, ids: readonly KitchenwareLabelId[]): void {
  const map = get_labels_ymap(doc);
  doc.transact(() => {
    for (const id of ids) {
      map.delete(id);
    }
  });
}

export function rename_label(doc: Y.Doc, id: KitchenwareLabelId, name: string): void {
  const map = get_labels_ymap(doc);
  const label = validate_label(id, map.get(id));
  if (is_type_error(label)) return;
  map.set(id, to_stored({ ...label, name }));
}
