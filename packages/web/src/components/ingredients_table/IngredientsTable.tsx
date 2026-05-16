import {
  IngredientId,
  loadId,
  unitType,
  type Ingredient,
  type KitchenwareLabel,
  type KitchenwareLabelId,
  type Measurement,
  type MeasurementType,
  type MeasurementUnit,
} from "@recipe-book/shared";
import { Column } from "primereact/column";
import type { TreeNode } from "primereact/treenode";
import type { type } from "arktype";
import {
  TreeTable,
  type TreeTableExpandedKeysType,
  type TreeTableFilterMeta,
  type TreeTableSelectionKeysType,
} from "primereact/treetable";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { MeasurementEditor } from "../measurement/MeasurementEditor.js";
import { buildIngredientTree, type IngredientRow } from "./build_ingredient_tree.js";
import { IngredientSelector } from "./IngredientSelector.js";
import "./IngredientsTable.css";
import { LabelEditor } from "./LabelEditor.js";
import { MultiSelectFilter } from "./MultiSelectFilter.js";

// ---------------------------------------------------------------------------
// External label filter
// ---------------------------------------------------------------------------

export interface ExternalLabelFilter {
  readonly label_ids: readonly KitchenwareLabelId[];
  readonly mode: "all" | "any";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MEASUREMENT_TYPES = ["count", "volume", "weight"] as const satisfies readonly MeasurementType[];

const UNIT_LABELS: Record<MeasurementUnit, string> = {
  tsp: "tsp", tbsp: "tbsp", fl_oz: "fl oz", cup: "cup",
  pint: "pint", quart: "quart", gallon: "gallon",
  ml: "ml", l: "L",
  oz: "oz", lb: "lb", g: "g", kg: "kg",
  whole: "whole", pinch: "pinch", dash: "dash",
};

const DEFAULT_BULK_MEASUREMENT: Measurement = { value: { numerator: 1, denominator: 1 }, unit: "cup" };

function formatMeasurement(m: Measurement): string {
  const { numerator: n, denominator: d } = m.value;
  const val = d === 1 ? `${n}` : `${n}/${d}`;
  return `${val} ${UNIT_LABELS[m.unit]}`;
}

type PKey = type.brand<string, "pkey">

function pkey(ingredient_id: IngredientId, col_id: string): PKey {
  return `${ingredient_id}|${col_id}` as PKey;
}

function parseLabels(raw: string): string[] {
  return raw
    .split(",")
    .map((l) => l.trim())
    .filter((l) => l !== "");
}

function toTreeNode(row: IngredientRow): TreeNode {
  return {
    key: row.id,
    data: row,
    children: row.subRows.length > 0 ? row.subRows.map(toTreeNode) : undefined,
  };
}

// TreeTable column filterFunctions — invoked per node with the resolved
// field value and the active filter value. Returning true keeps the node;
// the table itself walks the tree (lenient mode) to keep matching parents.

function typeFilterFunction(value: Measurement, selected: readonly string[]): boolean {
  if (selected.length === 0) return true;
  return selected.includes(unitType(value.unit) ?? "volume");
}

function labelsFilterFunction(value: readonly string[], selected: readonly string[]): boolean {
  if (selected.length === 0) return true;
  return selected.some((l) => value.includes(l));
}

// Every filter input below is a custom `filterElement` that drives the
// `filters` prop through component state, so the table never raises a real
// filter event. This handler exists only so TreeTable honours `filters`.
function noopFilter(): void {}

function extractSelectedIds(keys: TreeTableSelectionKeysType): IngredientId[] {
  const ids: IngredientId[] = [];
  for (const [key, val] of Object.entries(keys)) {
    if (typeof val === "object" && val !== null && val.checked === true) {
      ids.push(key as IngredientId);
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface IngredientsTableProps {
  readonly ingredients: readonly Ingredient[];
  readonly labels: readonly KitchenwareLabel[];
  readonly external_label_filter?: ExternalLabelFilter;
  readonly onRename: (id: IngredientId, name: string) => void;
  readonly onSetMeasurementValue: (id: IngredientId, value: Measurement) => void;
  readonly onSetLabels: (id: IngredientId, label_names: readonly string[]) => void;
  readonly onSetParent: (id: IngredientId, parent_id: IngredientId | undefined) => void;
  readonly onAddLabels: (ids: readonly IngredientId[], label_names: readonly string[]) => void;
  readonly onRemoveLabels: (
    ids: readonly IngredientId[],
    label_names: readonly string[],
  ) => void;
  readonly onBulkSetMeasurementValue: (ids: readonly IngredientId[], value: Measurement) => void;
  readonly onBulkSetParent: (
    ids: readonly IngredientId[],
    parent_id: IngredientId | undefined,
  ) => void;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function IngredientsTable({
  ingredients,
  labels,
  external_label_filter,
  onRename,
  onSetMeasurementValue,
  onSetLabels,
  onSetParent,
  onAddLabels,
  onRemoveLabels,
  onBulkSetMeasurementValue,
  onBulkSetParent,
}: IngredientsTableProps) {
  const [expanded_keys, set_expanded_keys] = useState<TreeTableExpandedKeysType>({});
  const [selection_keys, set_selection_keys] = useState<TreeTableSelectionKeysType>({});
  const [pending_edits, set_pending_edits] = useState<ReadonlyMap<PKey, string>>(new Map());
  const [name_filter, set_name_filter] = useState("");
  const [type_filter, set_type_filter] = useState<string[]>([]);
  const [label_filter, set_label_filter] = useState<string[]>([]);
  const [bulk_add_labels, set_bulk_add_labels] = useState<readonly string[]>([]);
  const [bulk_remove_labels, set_bulk_remove_labels] = useState<readonly string[]>([]);
  const [bulk_measurement, set_bulk_measurement] = useState<Measurement | null>(null);
  const [bulk_parent_id, set_bulk_parent_id] = useState("");
  const [editing_measurement_for, set_editing_measurement_for] = useState<IngredientId | null>(null);

  const all_label_names = useMemo(() => labels.map((l) => l.name).sort(), [labels]);

  const filtered_ingredients = useMemo(() => {
    if (!external_label_filter || external_label_filter.label_ids.length === 0) {
      return ingredients;
    }
    const { label_ids, mode } = external_label_filter;
    return ingredients.filter((i) => {
      if (mode === "all") return label_ids.every((id) => i.labels.has(id));
      return label_ids.some((id) => i.labels.has(id));
    });
  }, [ingredients, external_label_filter]);

  const tree_nodes = useMemo(() => {
    const rows = buildIngredientTree(filtered_ingredients, labels);
    return rows.map(toTreeNode);
  }, [filtered_ingredients, labels]);

  // TreeTable consults `filters` only when an `onFilter` handler is present.
  // Each entry is keyed by the column's `field`; blank filters are omitted so
  // the table skips filtering entirely when nothing is active.
  const tree_filters = useMemo<TreeTableFilterMeta>(() => {
    const filters: TreeTableFilterMeta = {};
    if (name_filter !== "") {
      filters["name"] = { value: name_filter, matchMode: "contains" };
    }
    if (type_filter.length > 0) {
      filters["default_measurement_value"] = { value: type_filter, matchMode: "custom" };
    }
    if (label_filter.length > 0) {
      filters["labels"] = { value: label_filter, matchMode: "custom" };
    }
    return filters;
  }, [name_filter, type_filter, label_filter]);

  const has_active_filter =
    name_filter !== "" || type_filter.length > 0 || label_filter.length > 0;

  // Auto-expand every node while a filter is active so matched descendants
  // (which the table keeps via lenient mode) are actually visible.
  useEffect(() => {
    if (has_active_filter) {
      const all_keys: TreeTableExpandedKeysType = {};
      function collectKeys(nodes: TreeNode[]) {
        for (const n of nodes) {
          if (n.children && n.children.length > 0) {
            all_keys[String(n.key)] = true;
            collectKeys(n.children);
          }
        }
      }
      collectKeys(tree_nodes);
      set_expanded_keys(all_keys);
    } else {
      set_expanded_keys({});
    }
  }, [has_active_filter, tree_nodes]);

  // ---------------------------------------------------------------------------
  // Edit handlers
  // ---------------------------------------------------------------------------

  function onBeginEdit(ingredient_id: IngredientId, col_id: string, initial: string): void {
    set_pending_edits((prev) => new Map(prev).set(pkey(ingredient_id, col_id), initial));
  }

  function onUpdateEdit(ingredient_id: IngredientId, col_id: string, value: string): void {
    const key = pkey(ingredient_id, col_id);
    set_pending_edits((prev) => {
      if (!prev.has(key)) return prev;
      return new Map(prev).set(key, value);
    });
  }

  function onCommitEdit(ingredient_id: IngredientId, col_id: string): void {
    const key = pkey(ingredient_id, col_id);
    const value = pending_edits.get(key);
    if (value === undefined) return;

    if (col_id === "name") {
      const trimmed = value.trim();
      if (trimmed !== "") onRename(ingredient_id, trimmed);
    } else if (col_id === "labels") {
      onSetLabels(ingredient_id, parseLabels(value));
    } else if (col_id === "parent_name") {
      onSetParent(ingredient_id, value !== "" ? (value as IngredientId) : undefined);
    }

    set_pending_edits((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }

  function onCancelEdit(ingredient_id: IngredientId, col_id: string): void {
    set_pending_edits((prev) => {
      const next = new Map(prev);
      next.delete(pkey(ingredient_id, col_id));
      return next;
    });
  }

  // ---------------------------------------------------------------------------
  // Column body templates
  // ---------------------------------------------------------------------------

  function nameBody(node: TreeNode) {
    const row = node.data as IngredientRow;
    const pending = pending_edits.get(pkey(row.id, "name"));
    if (pending !== undefined) {
      return (
        <span className="it-editing">
          <input
            type="text"
            value={pending}
            className="it-edit-input"
            autoFocus
            aria-label={`Edit name for ${row.name}`}
            onChange={(e) => onUpdateEdit(row.id, "name", e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") onCommitEdit(row.id, "name");
              if (e.key === "Escape") onCancelEdit(row.id, "name");
            }}
          />
          <button
            type="button"
            className="it-confirm-btn"
            onClick={() => onCommitEdit(row.id, "name")}
            aria-label="Confirm edit"
          >
            ✔︎
          </button>
          <button
            type="button"
            className="it-cancel-btn"
            onClick={() => onCancelEdit(row.id, "name")}
            aria-label="Cancel edit"
          >
            ✗
          </button>
        </span>
      );
    }
    return (
      <span
        className="it-editable"
        role="button"
        tabIndex={0}
        aria-label={`Edit name for ${row.name}`}
        onClick={() => onBeginEdit(row.id, "name", row.name)}
        onKeyDown={(e: KeyboardEvent<HTMLSpanElement>) => {
          if (e.key === "Enter" || e.key === " ") onBeginEdit(row.id, "name", row.name);
        }}
      >
        {row.name}
      </span>
    );
  }

  function measurementBody(node: TreeNode) {
    const row = node.data as IngredientRow;
    if (editing_measurement_for === row.id) {
      return (
        <MeasurementEditor
          value={row.default_measurement_value}
          initially_open
          onCommit={(value) => {
            onSetMeasurementValue(row.id, value);
            set_editing_measurement_for(null);
          }}
          onCancel={() => set_editing_measurement_for(null)}
        />
      );
    }
    return (
      <span
        className="it-editable"
        role="button"
        tabIndex={0}
        aria-label={`Edit default measurement for ${row.name}`}
        onClick={() => set_editing_measurement_for(row.id)}
        onKeyDown={(e: KeyboardEvent<HTMLSpanElement>) => {
          if (e.key === "Enter" || e.key === " ") set_editing_measurement_for(row.id);
        }}
      >
        {formatMeasurement(row.default_measurement_value)}
      </span>
    );
  }

  function labelsBody(node: TreeNode) {
    const row = node.data as IngredientRow;
    const pending = pending_edits.get(pkey(row.id, "labels"));
    const display = row.labels.join(", ");
    if (pending !== undefined) {
      return (
        <LabelEditor
          selected_label_names={parseLabels(pending)}
          all_label_names={all_label_names}
          aria_label={`Edit labels for ${row.name}`}
          onChange={(names) => onUpdateEdit(row.id, "labels", names.join(", "))}
          onCommit={() => onCommitEdit(row.id, "labels")}
          onCancel={() => onCancelEdit(row.id, "labels")}
        />
      );
    }
    return (
      <span
        className="it-editable"
        role="button"
        tabIndex={0}
        aria-label={`Edit labels for ${row.name}`}
        onClick={() => onBeginEdit(row.id, "labels", display)}
        onKeyDown={(e: KeyboardEvent<HTMLSpanElement>) => {
          if (e.key === "Enter" || e.key === " ") onBeginEdit(row.id, "labels", display);
        }}
      >
        {display || <span className="it-muted">—</span>}
      </span>
    );
  }

  function parentBody(node: TreeNode) {
    const row = node.data as IngredientRow;
    const pending = pending_edits.get(pkey(row.id, "parent_name"));
    const display = row.parent_name || "— None -";
    if (pending !== undefined) {
      const pending_id = pending !== "" ? (pending as IngredientId) : undefined;
      return (
        <span className="it-editing">
          <IngredientSelector
            value={pending_id}
            options={ingredients.filter((i) => i.id !== row.id)}
            labels={labels}
            onChange={(id) => onUpdateEdit(row.id, "parent_name", id ?? "")}
            aria_label={`Edit parent for ${row.name}`}
            placeholder="— None —"
          />
          <button
            type="button"
            className="it-confirm-btn"
            onClick={() => onCommitEdit(row.id, "parent_name")}
            aria-label="Confirm edit"
          >
            ✔︎
          </button>
          <button
            type="button"
            className="it-cancel-btn"
            onClick={() => onCancelEdit(row.id, "parent_name")}
            aria-label="Cancel edit"
          >
            ✗
          </button>
        </span>
      );
    }
    return (
      <span
        className="it-editable"
        role="button"
        tabIndex={0}
        aria-label={`Edit parent for ${row.name}`}
        onClick={() => onBeginEdit(row.id, "parent_name", row.parent_id ?? "")}
        onKeyDown={(e: KeyboardEvent<HTMLSpanElement>) => {
          if (e.key === "Enter" || e.key === " ")
            onBeginEdit(row.id, "parent_name", row.parent_id ?? "");
        }}
      >
        {display}
      </span>
    );
  }

  // ---------------------------------------------------------------------------
  // Bulk actions
  // ---------------------------------------------------------------------------

  const selected_ids = useMemo(() => extractSelectedIds(selection_keys), [selection_keys]);

  function applyAddLabels(): void {
    if (bulk_add_labels.length > 0) {
      onAddLabels(selected_ids, bulk_add_labels);
      set_bulk_add_labels([]);
    }
  }

  function applyRemoveLabels(): void {
    if (bulk_remove_labels.length > 0) {
      onRemoveLabels(selected_ids, bulk_remove_labels);
      set_bulk_remove_labels([]);
    }
  }

  function applyBulkParent(): void {
    if (bulk_parent_id !== "") {
      onBulkSetParent(selected_ids, loadId(IngredientId, bulk_parent_id));
      set_bulk_parent_id("");
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="it-wrapper" role="region" aria-label="Ingredient list">
      {selected_ids.length > 0 && (
        <div className="it-bulk-bar" role="region" aria-label="Bulk actions">
          <span className="it-bulk-count">{selected_ids.length} selected</span>
          <button
            type="button"
            className="it-bulk-clear"
            onClick={() => set_selection_keys({})}
          >
            Clear
          </button>

          <span className="it-bulk-action">
            <LabelEditor
              selected_label_names={bulk_add_labels}
              all_label_names={all_label_names}
              aria_label="Labels to add"
              placeholder="Labels to add…"
              commit_aria_label="Apply add labels"
              commit_disabled={bulk_add_labels.length === 0}
              onChange={(names) => set_bulk_add_labels(names)}
              onCommit={applyAddLabels}
              onCancel={() => set_bulk_add_labels([])}
            />
          </span>

          <span className="it-bulk-action">
            <LabelEditor
              selected_label_names={bulk_remove_labels}
              all_label_names={all_label_names}
              aria_label="Labels to remove"
              placeholder="Labels to remove…"
              commit_aria_label="Apply remove labels"
              commit_disabled={bulk_remove_labels.length === 0}
              onChange={(names) => set_bulk_remove_labels(names)}
              onCommit={applyRemoveLabels}
              onCancel={() => set_bulk_remove_labels([])}
            />
          </span>

          <span className="it-bulk-action">
            <MeasurementEditor
              value={bulk_measurement ?? DEFAULT_BULK_MEASUREMENT}
              onCommit={(value) => {
                set_bulk_measurement(value);
                onBulkSetMeasurementValue(selected_ids, value);
              }}
              onCancel={() => set_bulk_measurement(null)}
            />
          </span>

          <span className="it-bulk-action">
            <IngredientSelector
              value={bulk_parent_id !== "" ? (bulk_parent_id as IngredientId) : undefined}
              options={ingredients}
              labels={labels}
              onChange={(id) => set_bulk_parent_id(id ?? "")}
              aria_label="Bulk parent"
              placeholder="— Parent —"
            />
            <button
              type="button"
              className="it-bulk-apply"
              disabled={bulk_parent_id === ""}
              onClick={applyBulkParent}
              aria-label="Apply parent change"
            >
              Change parent
            </button>
            <button
              type="button"
              className="it-bulk-apply"
              onClick={() => {
                onBulkSetParent(selected_ids, undefined);
              }}
              aria-label="Clear parent"
            >
              Clear parent
            </button>
          </span>
        </div>
      )}

      <TreeTable
        value={tree_nodes}
        expandedKeys={expanded_keys}
        onToggle={(e) => set_expanded_keys(e.value)}
        selectionMode="checkbox"
        selectionKeys={selection_keys}
        onSelectionChange={(e) => {
          if (typeof e.value === "object" && e.value !== null && !Array.isArray(e.value)) {
            set_selection_keys(e.value as TreeTableSelectionKeysType);
          }
        }}
        filters={tree_filters}
        filterMode="lenient"
        onFilter={noopFilter}
        tableClassName="it-table"
        emptyMessage="No ingredients match the current filter."
      >
        <Column
          field="name"
          header="Name"
          expander
          sortable
          body={nameBody}
          filter
          filterMatchMode="contains"
          filterHeaderClassName="it-filter-th"
          filterElement={
            <input
              type="text"
              className="it-col-filter"
              value={name_filter}
              onChange={(e) => set_name_filter(e.target.value)}
              placeholder="Filter by name…"
              aria-label="Filter by name"
            />
          }
        />
        <Column
          field="default_measurement_value"
          header="Default Value"
          sortable
          body={measurementBody}
          filter
          filterMatchMode="custom"
          filterFunction={typeFilterFunction}
          filterHeaderClassName="it-filter-th"
          filterElement={
            <MultiSelectFilter
              value={type_filter}
              onChange={set_type_filter}
              all_options={MEASUREMENT_TYPES}
              aria_label="Filter by type"
            />
          }
        />
        <Column
          field="labels"
          header="Labels"
          body={labelsBody}
          filter
          filterMatchMode="custom"
          filterFunction={labelsFilterFunction}
          filterHeaderClassName="it-filter-th"
          filterElement={
            <MultiSelectFilter
              value={label_filter}
              onChange={set_label_filter}
              all_options={all_label_names}
              aria_label="Filter by labels"
            />
          }
        />
        <Column field="parent_name" header="Parent" sortable body={parentBody} />
      </TreeTable>
    </div>
  );
}
