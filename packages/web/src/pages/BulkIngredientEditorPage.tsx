import { useState, useMemo, useEffect, useRef, type FormEvent, type ChangeEvent } from "react";
import type { Ingredient } from "@recipe-book/shared";
import type { MeasurementType } from "@recipe-book/shared";
import { use_ingredient_store } from "../hooks/use_ingredient_store.js";
import "./BulkIngredientEditorPage.css";

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

interface FilterState {
  readonly label_query: string;
  readonly measurement_type: MeasurementType | "all";
  readonly parent_id: string | "any";
}

const EMPTY_FILTER: FilterState = {
  label_query: "",
  measurement_type: "all",
  parent_id: "any",
};

function apply_filter(ingredients: readonly Ingredient[], f: FilterState): Ingredient[] {
  return ingredients.filter((i) => {
    if (
      f.label_query !== "" &&
      !i.labels.some((l) => l.toLowerCase().includes(f.label_query.toLowerCase()))
    )
      return false;
    if (f.measurement_type !== "all" && i.default_measurement_type !== f.measurement_type)
      return false;
    if (f.parent_id !== "any" && i.parent_id !== f.parent_id) return false;
    return true;
  });
}

function sets_equal(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Add-ingredient form state
// ---------------------------------------------------------------------------

interface AddFormState {
  name: string;
  measurement_type: MeasurementType;
  labels_raw: string;
  parent_id: string;
}

const EMPTY_ADD_FORM: AddFormState = {
  name: "",
  measurement_type: "volume",
  labels_raw: "",
  parent_id: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BulkIngredientEditorPage() {
  const { ingredients, create_ingredient, add_labels, remove_labels, set_measurement_type, set_parent } =
    use_ingredient_store();

  // --- filter ---
  const [filter, set_filter] = useState<FilterState>(EMPTY_FILTER);

  // Live filtered set (always current)
  const live_filtered = useMemo(() => apply_filter(ingredients, filter), [ingredients, filter]);
  const live_filtered_ids = useMemo(
    () => new Set(live_filtered.map((i) => i.id)),
    [live_filtered],
  );

  // Frozen display ids — updated when filter changes, but frozen after edits
  const [displayed_ids, set_displayed_ids] = useState<ReadonlySet<string>>(
    () => new Set(live_filtered.map((i) => i.id)),
  );
  const [filter_stale, set_filter_stale] = useState(false);

  // Displayed ingredients: frozen IDs, live data
  const displayed = useMemo(
    () => ingredients.filter((i) => displayed_ids.has(i.id)),
    [ingredients, displayed_ids],
  );

  // Detect stale after each render: if live filter diverged from the frozen display,
  // the user needs to refresh to see the current data.
  const displayed_ids_ref = useRef(displayed_ids);
  displayed_ids_ref.current = displayed_ids;
  useEffect(() => {
    if (!sets_equal(live_filtered_ids, displayed_ids_ref.current)) {
      set_filter_stale(true);
    }
  }, [live_filtered_ids]);

  function apply_filter_now(new_filter: FilterState) {
    const ids = new Set(apply_filter(ingredients, new_filter).map((i) => i.id));
    set_displayed_ids(ids);
    set_filter_stale(false);
    set_filter(new_filter);
    // Clear selection when filter changes
    set_selected_ids(new Set());
  }

  function refresh_filter() {
    set_displayed_ids(live_filtered_ids);
    set_filter_stale(false);
  }

  function do_edit(action: () => void) {
    action();
    // displayed_ids stays frozen; stale detection handled by the useEffect above
  }

  // --- selection ---
  const [selected_ids, set_selected_ids] = useState<ReadonlySet<string>>(new Set());

  const all_selected =
    displayed.length > 0 && displayed.every((i) => selected_ids.has(i.id));
  const some_selected = selected_ids.size > 0;

  function toggle_select(id: string) {
    set_selected_ids((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggle_select_all() {
    if (all_selected) {
      set_selected_ids(new Set());
    } else {
      set_selected_ids(new Set(displayed.map((i) => i.id)));
    }
  }

  // --- bulk action inputs ---
  const [add_label_input, set_add_label_input] = useState("");
  const [remove_label_input, set_remove_label_input] = useState("");
  const [type_input, set_type_input] = useState<MeasurementType>("volume");
  const [parent_input, set_parent_input] = useState("");

  const selected_arr = [...selected_ids];

  // --- add-ingredient form ---
  const [show_add_form, set_show_add_form] = useState(false);
  const [add_form, set_add_form] = useState<AddFormState>(EMPTY_ADD_FORM);

  function handle_add_submit(e: FormEvent) {
    e.preventDefault();
    if (add_form.name.trim() === "") return;
    const labels = add_form.labels_raw
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l !== "");
    const new_id = create_ingredient({
      name: add_form.name.trim(),
      default_measurement_type: add_form.measurement_type,
      labels,
      ...(add_form.parent_id !== "" && { parent_id: add_form.parent_id }),
    });
    set_displayed_ids((prev) => new Set([...prev, new_id]));
    set_add_form(EMPTY_ADD_FORM);
    set_show_add_form(false);
  }

  return (
    <main className="bie-page">
      <h1 className="bie-title">Ingredients</h1>

      {/* Filter bar */}
      <section className="bie-filter" aria-label="Filter ingredients">
        <label className="bie-filter-label">
          Label
          <input
            className="bie-filter-input"
            type="text"
            value={filter.label_query}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              apply_filter_now({ ...filter, label_query: e.target.value })
            }
            placeholder="e.g. solid"
            aria-label="Filter by label"
          />
        </label>
        <label className="bie-filter-label">
          Type
          <select
            className="bie-filter-select"
            value={filter.measurement_type}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              apply_filter_now({
                ...filter,
                measurement_type: e.target.value as MeasurementType | "all",
              })
            }
            aria-label="Filter by measurement type"
          >
            <option value="all">All types</option>
            <option value="volume">Volume</option>
            <option value="weight">Weight</option>
            <option value="count">Count</option>
          </select>
        </label>
        <label className="bie-filter-label">
          Parent
          <select
            className="bie-filter-select"
            value={filter.parent_id}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              apply_filter_now({ ...filter, parent_id: e.target.value })
            }
            aria-label="Filter by parent ingredient"
          >
            <option value="any">Any parent</option>
            <option value="">— No parent —</option>
            {ingredients
              .filter((i) => i.id !== undefined)
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
          </select>
        </label>
      </section>

      {/* Stale filter banner */}
      {filter_stale && (
        <div className="bie-stale-banner" role="status">
          <span>Some ingredients no longer match the current filter.</span>
          <button className="bie-refresh-btn" onClick={refresh_filter}>
            Refresh filter
          </button>
        </div>
      )}

      {/* Add ingredient form */}
      {show_add_form && (
        <form className="bie-add-form" onSubmit={handle_add_submit} aria-label="Add ingredient">
          <h2 className="bie-add-title">New Ingredient</h2>
          <label className="bie-add-label">
            Name
            <input
              className="bie-add-input"
              type="text"
              value={add_form.name}
              onChange={(e) => set_add_form((f) => ({ ...f, name: e.target.value }))}
              required
              aria-label="New ingredient name"
              autoFocus
            />
          </label>
          <label className="bie-add-label">
            Default measurement type
            <select
              className="bie-add-select"
              value={add_form.measurement_type}
              onChange={(e) =>
                set_add_form((f) => ({
                  ...f,
                  measurement_type: e.target.value as MeasurementType,
                }))
              }
              aria-label="New ingredient measurement type"
            >
              <option value="volume">Volume</option>
              <option value="weight">Weight</option>
              <option value="count">Count</option>
            </select>
          </label>
          <label className="bie-add-label">
            Labels (comma-separated)
            <input
              className="bie-add-input"
              type="text"
              value={add_form.labels_raw}
              onChange={(e) => set_add_form((f) => ({ ...f, labels_raw: e.target.value }))}
              placeholder="e.g. solid, fat"
              aria-label="New ingredient labels"
            />
          </label>
          <label className="bie-add-label">
            Parent ingredient
            <select
              className="bie-add-select"
              value={add_form.parent_id}
              onChange={(e) => set_add_form((f) => ({ ...f, parent_id: e.target.value }))}
              aria-label="New ingredient parent"
            >
              <option value="">— None —</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          <div className="bie-add-actions">
            <button type="submit" disabled={add_form.name.trim() === ""}>
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                set_show_add_form(false);
                set_add_form(EMPTY_ADD_FORM);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Bulk action bar */}
      <div className="bie-actions">
        <button
          className="bie-add-btn"
          onClick={() => set_show_add_form((v) => !v)}
          aria-label="Add new ingredient"
        >
          + New ingredient
        </button>

        {some_selected && (
          <div className="bie-bulk-bar" aria-label="Bulk actions">
            <span className="bie-bulk-count">{selected_ids.size} selected</span>

            <label className="bie-bulk-action">
              Add label:
              <input
                className="bie-bulk-input"
                type="text"
                value={add_label_input}
                onChange={(e) => set_add_label_input(e.target.value)}
                placeholder="label"
                aria-label="Label to add"
              />
              <button
                type="button"
                disabled={add_label_input.trim() === ""}
                onClick={() => {
                  do_edit(() => add_labels(selected_arr, [add_label_input.trim()]));
                  set_add_label_input("");
                }}
              >
                Apply
              </button>
            </label>

            <label className="bie-bulk-action">
              Remove label:
              <input
                className="bie-bulk-input"
                type="text"
                value={remove_label_input}
                onChange={(e) => set_remove_label_input(e.target.value)}
                placeholder="label"
                aria-label="Label to remove"
              />
              <button
                type="button"
                disabled={remove_label_input.trim() === ""}
                onClick={() => {
                  do_edit(() => remove_labels(selected_arr, [remove_label_input.trim()]));
                  set_remove_label_input("");
                }}
              >
                Apply
              </button>
            </label>

            <label className="bie-bulk-action">
              Set type:
              <select
                className="bie-bulk-select"
                value={type_input}
                onChange={(e) => set_type_input(e.target.value as MeasurementType)}
                aria-label="Measurement type to set"
              >
                <option value="volume">Volume</option>
                <option value="weight">Weight</option>
                <option value="count">Count</option>
              </select>
              <button
                type="button"
                onClick={() => do_edit(() => set_measurement_type(selected_arr, type_input))}
              >
                Apply
              </button>
            </label>

            <label className="bie-bulk-action">
              Set parent:
              <select
                className="bie-bulk-select"
                value={parent_input}
                onChange={(e) => set_parent_input(e.target.value)}
                aria-label="Parent ingredient to set"
              >
                <option value="">— None —</option>
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  do_edit(() =>
                    set_parent(selected_arr, parent_input !== "" ? parent_input : undefined),
                  )
                }
              >
                Apply
              </button>
            </label>
          </div>
        )}
      </div>

      {/* Ingredient table */}
      <div className="bie-table-wrapper" role="region" aria-label="Ingredient list">
        <table className="bie-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={all_selected}
                  onChange={toggle_select_all}
                  aria-label="Select all ingredients"
                />
              </th>
              <th>Name</th>
              <th>Type</th>
              <th>Labels</th>
              <th>Parent</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td className="bie-empty" colSpan={5}>
                  No ingredients match the current filter.
                </td>
              </tr>
            ) : (
              displayed.map((i) => (
                <tr key={i.id} className={selected_ids.has(i.id) ? "bie-row-selected" : ""}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected_ids.has(i.id)}
                      onChange={() => toggle_select(i.id)}
                      aria-label={`Select ${i.name}`}
                    />
                  </td>
                  <td className="bie-cell-name">{i.name}</td>
                  <td className="bie-cell-type">{i.default_measurement_type}</td>
                  <td className="bie-cell-labels">{i.labels.join(", ")}</td>
                  <td className="bie-cell-parent">
                    {i.parent_id !== undefined
                      ? (ingredients.find((p) => p.id === i.parent_id)?.name ?? i.parent_id)
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
