import { describe, it, expect } from "vitest";
import {
  is_ingredient,
  is_container,
  is_equipment,
  type Kitchenware,
} from "../kitchenware.js";

describe("kitchenware type guards", () => {
  const ingredient: Kitchenware = {
    kind: "ingredient",
    id: "butter",
    name: "Butter",
    default_measurement_type: "volume",
    labels: ["fat", "solid"],
  };

  const container: Kitchenware = {
    kind: "container",
    id: "bowl",
    name: "Bowl",
    labels: ["vessel"],
  };

  const equipment: Kitchenware = {
    kind: "equipment",
    id: "oven",
    name: "Oven",
    labels: ["heat"],
  };

  it("is_ingredient returns true only for ingredient", () => {
    expect(is_ingredient(ingredient)).toBe(true);
    expect(is_ingredient(container)).toBe(false);
    expect(is_ingredient(equipment)).toBe(false);
  });

  it("is_container returns true only for container", () => {
    expect(is_container(ingredient)).toBe(false);
    expect(is_container(container)).toBe(true);
    expect(is_container(equipment)).toBe(false);
  });

  it("is_equipment returns true only for equipment", () => {
    expect(is_equipment(ingredient)).toBe(false);
    expect(is_equipment(container)).toBe(false);
    expect(is_equipment(equipment)).toBe(true);
  });
});
