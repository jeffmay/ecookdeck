import {
  addLabel,
  deleteLabels as delete_labels_in_doc,
  findOrCreateLabel,
  getLabels,
  getLabelsYmap,
  type KitchenwareKind,
  type KitchenwareLabel,
  KitchenwareLabelId,
  removeLabelFromAllIngredients,
  renameLabel as rename_label_in_doc,
  replaceLabelInAllIngredients
} from "@recipe-book/shared";
import { loadId, randomId } from "@recipe-book/shared/src/types/ids.js";
import { useEffect, useState } from "react";
import * as Y from "yjs";
import { useDoc } from "../contexts/doc_context.js";

export interface UseLabelStoreResult {
  readonly labels: readonly KitchenwareLabel[];
  readonly create_label: (name: string, kinds: ReadonlySet<KitchenwareKind>) => KitchenwareLabelId;
  readonly find_or_create: (name: string, kinds: ReadonlySet<KitchenwareKind>) => KitchenwareLabelId;
  readonly renameLabel: (id: KitchenwareLabelId, name: string) => void;
  readonly deleteLabels: (ids: readonly KitchenwareLabelId[]) => void;
  readonly merge_labels: (ids: readonly KitchenwareLabelId[], new_name: string) => KitchenwareLabelId;
}

export function useLabelStore(): UseLabelStoreResult {
  const doc = useDoc();
  const [labels, set_labels] = useState<KitchenwareLabel[]>(() => getLabels(doc));

  useEffect(() => {
    const map = getLabelsYmap(doc);
    const handler = (event: Y.YMapEvent<unknown>) => {
      // Cascade deletions to all ingredient label sets
      event.changes.keys.forEach((change, key) => {
        if (change.action === "delete") {
          removeLabelFromAllIngredients(doc, loadId(KitchenwareLabelId, key));
        }
      });
      set_labels(getLabels(doc));
    };
    map.observe(handler);
    return () => map.unobserve(handler);
  }, [doc]);

  return {
    labels,
    create_label(name, kinds) {
      return addLabel(doc, name, kinds);
    },
    find_or_create(name, kinds) {
      return findOrCreateLabel(doc, name, kinds);
    },
    renameLabel(id, name) {
      rename_label_in_doc(doc, id, name);
    },
    deleteLabels(ids) {
      delete_labels_in_doc(doc, ids);
    },
    merge_labels(ids_to_merge, new_name) {
      const new_id = randomId(KitchenwareLabelId);

      // Collect kinds from all merging labels
      const merged_kinds = new Set<KitchenwareKind>();
      const labels_map = getLabelsYmap(doc);
      labels_map.forEach((value, id) => {
        const label_id = loadId(KitchenwareLabelId, id);
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
        replaceLabelInAllIngredients(doc, ids_to_merge, new_id);
        // Delete old labels (cascade delete observer is a no-op since refs are already updated)
        for (const id of ids_to_merge) {
          labels_map.delete(id);
        }
      });

      return new_id;
    },
  };
}
