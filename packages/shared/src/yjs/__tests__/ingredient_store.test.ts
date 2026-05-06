import { describe, it, expect, beforeEach } from "vitest";
import * as Y from "yjs";
import {
  get_ingredients,
  add_ingredient,
  add_labels_to_ingredients,
  remove_labels_from_ingredients,
  set_measurement_type_for_ingredients,
  set_parent_for_ingredients,
  init_ingredients_from_defaults,
} from "../ingredient_store.js";
import type { Ingredient } from "../../types/kitchenware.js";

const BUTTER: Ingredient = {
  kind: "ingredient",
  id: "butter",
  name: "Butter",
  default_measurement_type: "volume",
  labels: ["fat", "solid"],
};
const FLOUR: Ingredient = {
  kind: "ingredient",
  id: "flour",
  name: "Flour",
  default_measurement_type: "volume",
  labels: ["baking", "powder", "solid"],
};

let doc: Y.Doc;

beforeEach(() => {
  doc = new Y.Doc();
});

describe("get_ingredients", () => {
  it("returns empty array for empty doc", () => {
    expect(get_ingredients(doc)).toEqual([]);
  });

  it("returns sorted ingredients after add", () => {
    add_ingredient(doc, FLOUR);
    add_ingredient(doc, BUTTER);
    const result = get_ingredients(doc);
    expect(result.map((i) => i.name)).toEqual(["Butter", "Flour"]);
  });
});

describe("add_ingredient", () => {
  it("stores all fields including optional parent_id", () => {
    const child: Ingredient = { ...BUTTER, id: "salted_butter", parent_id: "butter" };
    add_ingredient(doc, child);
    const result = get_ingredients(doc);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "salted_butter", parent_id: "butter" });
  });

  it("stores ingredient without parent_id cleanly", () => {
    add_ingredient(doc, BUTTER);
    const result = get_ingredients(doc);
    expect(result[0]).not.toHaveProperty("parent_id");
  });
});

describe("add_labels_to_ingredients", () => {
  it("adds new labels and deduplicates", () => {
    add_ingredient(doc, BUTTER);
    add_labels_to_ingredients(doc, ["butter"], ["dairy", "solid"]);
    const result = get_ingredients(doc).find((i) => i.id === "butter");
    expect(result?.labels).toContain("dairy");
    expect(result?.labels.filter((l) => l === "solid")).toHaveLength(1);
  });

  it("silently skips unknown ids", () => {
    add_ingredient(doc, BUTTER);
    expect(() => add_labels_to_ingredients(doc, ["nonexistent"], ["x"])).not.toThrow();
  });
});

describe("remove_labels_from_ingredients", () => {
  it("removes specified labels", () => {
    add_ingredient(doc, BUTTER);
    remove_labels_from_ingredients(doc, ["butter"], ["solid"]);
    const result = get_ingredients(doc).find((i) => i.id === "butter");
    expect(result?.labels).not.toContain("solid");
    expect(result?.labels).toContain("fat");
  });

  it("ignores labels not present on ingredient", () => {
    add_ingredient(doc, BUTTER);
    expect(() =>
      remove_labels_from_ingredients(doc, ["butter"], ["nonexistent_label"]),
    ).not.toThrow();
  });
});

describe("set_measurement_type_for_ingredients", () => {
  it("changes measurement type", () => {
    add_ingredient(doc, BUTTER);
    set_measurement_type_for_ingredients(doc, ["butter"], "weight");
    const result = get_ingredients(doc).find((i) => i.id === "butter");
    expect(result?.default_measurement_type).toBe("weight");
  });

  it("ignores ingredients already at that type", () => {
    add_ingredient(doc, BUTTER);
    const map = doc.getMap("ingredients");
    const before = JSON.stringify(map.get("butter"));
    set_measurement_type_for_ingredients(doc, ["butter"], "volume");
    expect(JSON.stringify(map.get("butter"))).toBe(before);
  });
});

describe("set_parent_for_ingredients", () => {
  it("sets parent_id", () => {
    add_ingredient(doc, BUTTER);
    set_parent_for_ingredients(doc, ["butter"], "dairy");
    const result = get_ingredients(doc).find((i) => i.id === "butter");
    expect(result?.parent_id).toBe("dairy");
  });

  it("clears parent_id when undefined passed", () => {
    const child: Ingredient = { ...BUTTER, parent_id: "dairy" };
    add_ingredient(doc, child);
    set_parent_for_ingredients(doc, ["butter"], undefined);
    const result = get_ingredients(doc).find((i) => i.id === "butter");
    expect(result?.parent_id).toBeUndefined();
  });
});

describe("init_ingredients_from_defaults", () => {
  it("populates the doc when empty", () => {
    init_ingredients_from_defaults(doc);
    expect(get_ingredients(doc).length).toBeGreaterThan(0);
  });

  it("does not overwrite existing ingredients", () => {
    add_ingredient(doc, BUTTER);
    const original_name = BUTTER.name;
    const modified: Ingredient = { ...BUTTER, name: "My Custom Butter" };
    add_ingredient(doc, modified);
    init_ingredients_from_defaults(doc);
    const result = get_ingredients(doc).find((i) => i.id === "butter");
    expect(result?.name).not.toBe(original_name);
  });
});
