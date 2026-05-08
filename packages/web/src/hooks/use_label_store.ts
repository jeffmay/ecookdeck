import {
  add_label,
  delete_labels as delete_labels_in_doc,
  find_or_create_label,
  get_labels,
  get_labels_ymap,
  type KitchenwareKind,
  type KitchenwareLabel,
  KitchenwareLabelId,
  remove_label_from_all_ingredients,
  rename_label as rename_label_in_doc,
  replace_label_in_all_ingredients
} from "@recipe-book/shared";
import { load_id, random_id } from "@recipe-book/shared/src/types/ids.js";
import { useEffect, useState } from "react";
import * as Y from "yjs";
import { use_doc } from "../contexts/doc_context.js";

export interface UseLabelStoreResult {
  readonly labels: readonly KitchenwareLabel[];
  readonly create_label: (name: string, kinds: ReadonlySet<KitchenwareKind>) => KitchenwareLabelId;
  readonly find_or_create: (name: string, kinds: ReadonlySet<KitchenwareKind>) => KitchenwareLabelId;
  readonly rename_label: (id: KitchenwareLabelId, name: string) => void;
  readonly delete_labels: (ids: readonly KitchenwareLabelId[]) => void;
  readonly merge_labels: (ids: readonly KitchenwareLabelId[], new_name: string) => KitchenwareLabelId;
}

export function use_label_store(): UseLabelStoreResult {
  const doc = use_doc();
  const [labels, set_labels] = useState<KitchenwareLabel[]>(() => get_labels(doc));

  useEffect(() => {
    const map = get_labels_ymap(doc);
    const handler = (event: Y.YMapEvent<unknown>) => {
      // Cascade deletions to all ingredient label sets
      event.changes.keys.forEach((change, key) => {
        if (change.action === "delete") {
          remove_label_from_all_ingredients(doc, load_id(KitchenwareLabelId, key));
        }
      });
      set_labels(get_labels(doc));
    };
    map.observe(handler);
    return () => map.unobserve(handler);
  }, [doc]);

  return {
    labels,
    create_label(name, kinds) {
      return add_label(doc, name, kinds);
    },
    find_or_create(name, kinds) {
      return find_or_create_label(doc, name, kinds);
    },
    rename_label(id, name) {
      rename_label_in_doc(doc, id, name);
    },
    delete_labels(ids) {
      delete_labels_in_doc(doc, ids);
    },
    merge_labels(ids_to_merge, new_name) {
      const new_id = random_id(KitchenwareLabelId);

      // Collect kinds from all merging labels
      const merged_kinds = new Set<KitchenwareKind>();
      const labels_map = get_labels_ymap(doc);
      labels_map.forEach((value, id) => {
        const label_id = load_id(KitchenwareLabelId, id);
        if (!ids_to_merge.includes(label_id)) return;
        if (typeof value === "object" && value !== null) {
          const obj = value as Record<string, unknown>;
          const kinds = obj["kinds"];
          if (Array.isArray(kinds)) {
            for (const k of kinds) {
              if (k === "ingredient" || k === "container" || k === "equipment") {
                merged_kinds.add(k);
              }
            }
          }
        }
      });

      doc.transact(() => {
        // Create new merged label
        labels_map.set(new_id, { name: new_name, kinds: [...merged_kinds] });
        // Update all ingredient references before deleting old labels
        replace_label_in_all_ingredients(doc, ids_to_merge, new_id);
        // Delete old labels (cascade delete observer is a no-op since refs are already updated)
        for (const id of ids_to_merge) {
          labels_map.delete(id);
        }
      });

      return new_id;
    },
  };
}
