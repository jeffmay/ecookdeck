import { describe, it, expect } from "vitest";
import {
  is_ingredient_item,
  is_container_item,
  is_section_label,
  is_instruction_block,
  is_equipment_instruction,
  type RecipeItem,
} from "../recipe.js";

describe("recipe item type guards", () => {
  const ingredient_item: RecipeItem = {
    kind: "ingredient_item",
    id: "item-1",
    ingredient_id: "butter",
    quantity: { value: { numerator: 1, denominator: 2 }, unit: "cup" },
  };

  const container_item: RecipeItem = {
    kind: "container_item",
    id: "item-2",
    container_id: "bowl",
    contents: [],
  };

  const section_label: RecipeItem = {
    kind: "section_label",
    id: "item-3",
    label: "Wet ingredients",
  };

  const instruction_block: RecipeItem = {
    kind: "instruction_block",
    id: "item-4",
    text: "Whisk until combined.",
  };

  const equipment_instruction: RecipeItem = {
    kind: "equipment_instruction",
    id: "item-5",
    equipment_id: "oven",
    instruction: "Bake at 350°F",
    duration_seconds: 1200,
  };

  const all_items: RecipeItem[] = [
    ingredient_item,
    container_item,
    section_label,
    instruction_block,
    equipment_instruction,
  ];

  it("is_ingredient_item identifies only ingredient items", () => {
    expect(all_items.filter(is_ingredient_item)).toEqual([ingredient_item]);
  });

  it("is_container_item identifies only container items", () => {
    expect(all_items.filter(is_container_item)).toEqual([container_item]);
  });

  it("is_section_label identifies only section labels", () => {
    expect(all_items.filter(is_section_label)).toEqual([section_label]);
  });

  it("is_instruction_block identifies only instruction blocks", () => {
    expect(all_items.filter(is_instruction_block)).toEqual([instruction_block]);
  });

  it("is_equipment_instruction identifies only equipment instructions", () => {
    expect(all_items.filter(is_equipment_instruction)).toEqual([equipment_instruction]);
  });
});
