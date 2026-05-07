import { describe, it, expect } from "vitest";
import type { Ingredient } from "@recipe-book/shared";
import { build_ingredient_tree } from "../build_ingredient_tree.js";

const DAIRY: Ingredient = {
  kind: "ingredient",
  id: "dairy",
  name: "Dairy",
  default_measurement_type: "volume",
  labels: [],
};
const BUTTER: Ingredient = {
  kind: "ingredient",
  id: "butter",
  name: "Butter",
  default_measurement_type: "volume",
  labels: ["fat", "solid"],
  parent_id: "dairy",
};
const MILK: Ingredient = {
  kind: "ingredient",
  id: "milk",
  name: "Milk",
  default_measurement_type: "volume",
  labels: ["liquid"],
  parent_id: "dairy",
};
const FLOUR: Ingredient = {
  kind: "ingredient",
  id: "flour",
  name: "Flour",
  default_measurement_type: "volume",
  labels: ["baking"],
};

describe("build_ingredient_tree", () => {
  it("returns empty array for empty input", () => {
    expect(build_ingredient_tree([])).toEqual([]);
  });

  it("returns a flat list when no parents are set", () => {
    const rows = build_ingredient_tree([FLOUR, BUTTER]);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.subRows.length === 0)).toBe(true);
  });

  it("nests children under their parent", () => {
    const rows = build_ingredient_tree([DAIRY, BUTTER, MILK]);
    expect(rows).toHaveLength(1);
    const dairy_row = rows[0]!;
    expect(dairy_row.id).toBe("dairy");
    expect(dairy_row.subRows).toHaveLength(2);
    expect(dairy_row.subRows.map((r) => r.id).sort()).toEqual(["butter", "milk"]);
  });

  it("populates parent_name from sibling data", () => {
    const rows = build_ingredient_tree([DAIRY, BUTTER]);
    const dairy_row = rows[0]!;
    const butter_row = dairy_row.subRows[0]!;
    expect(butter_row.parent_name).toBe("Dairy");
  });

  it("leaves parent_name empty when no parent_id", () => {
    const rows = build_ingredient_tree([FLOUR]);
    expect(rows[0]!.parent_name).toBe("");
  });

  it("treats unknown parent_id as a root-level row and uses id as parent_name fallback", () => {
    const orphan: Ingredient = {
      ...BUTTER,
      id: "salted_butter",
      parent_id: "nonexistent",
    };
    const rows = build_ingredient_tree([orphan]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.parent_name).toBe("nonexistent");
  });

  it("sorts root rows alphabetically by name", () => {
    const rows = build_ingredient_tree([FLOUR, DAIRY]);
    expect(rows.map((r) => r.name)).toEqual(["Dairy", "Flour"]);
  });

  it("sorts child rows alphabetically within each parent", () => {
    const rows = build_ingredient_tree([DAIRY, MILK, BUTTER]);
    const children = rows[0]!.subRows.map((r) => r.name);
    expect(children).toEqual(["Butter", "Milk"]);
  });

  it("preserves all Ingredient fields on each row", () => {
    const rows = build_ingredient_tree([BUTTER, DAIRY]);
    const dairy_row = rows.find((r) => r.id === "dairy")!;
    const butter_row = dairy_row.subRows[0]!;
    expect(butter_row.name).toBe("Butter");
    expect(butter_row.default_measurement_type).toBe("volume");
    expect(butter_row.labels).toEqual(["fat", "solid"]);
    expect(butter_row.parent_id).toBe("dairy");
    expect(butter_row.kind).toBe("ingredient");
  });
});
