import type { Ingredient, MeasurementType } from "@recipe-book/shared";

export interface IngredientRow {
  readonly kind: "ingredient";
  readonly id: string;
  readonly name: string;
  readonly default_measurement_type: MeasurementType;
  readonly labels: readonly string[];
  readonly parent_id?: string;
  readonly parent_name: string;
  readonly subRows: IngredientRow[]; // readonly ref, mutable contents — safe to push during build
}

export function build_ingredient_tree(ingredients: readonly Ingredient[]): IngredientRow[] {
  const id_to_name = new Map<string, string>(ingredients.map((i) => [i.id, i.name]));

  const row_map = new Map<string, IngredientRow>();

  for (const i of ingredients) {
    const row: IngredientRow = {
      kind: "ingredient",
      id: i.id,
      name: i.name,
      default_measurement_type: i.default_measurement_type,
      labels: i.labels,
      parent_name:
        i.parent_id !== undefined ? (id_to_name.get(i.parent_id) ?? i.parent_id) : "",
      subRows: [],
      ...(i.parent_id !== undefined && { parent_id: i.parent_id }),
    };
    row_map.set(i.id, row);
  }

  const roots: IngredientRow[] = [];

  for (const row of row_map.values()) {
    if (row.parent_id !== undefined) {
      const parent = row_map.get(row.parent_id);
      if (parent !== undefined) {
        parent.subRows.push(row);
        continue;
      }
    }
    roots.push(row);
  }

  function sort_level(rows: IngredientRow[]): void {
    rows.sort((a, b) => a.name.localeCompare(b.name));
    for (const r of rows) sort_level(r.subRows);
  }
  sort_level(roots);

  return roots;
}
