import { describe, it, expect } from "vitest";
import { parse_kitchenware_csv } from "../parse_kitchenware_csv.js";
import { is_ingredient, is_container, is_equipment } from "../../types/kitchenware.js";

const SAMPLE_CSV = `Unique ID,Type,Description,Default Measurement Type,Labels
butter,ingredient,Butter,volume,baking+fat+solid
bowl,container,Bowl,count,vessel
oven,equipment,Oven,count,heat
`;

describe("parse_kitchenware_csv", () => {
  it("parses ingredient rows", () => {
    const result = parse_kitchenware_csv(SAMPLE_CSV);
    const ingredient = result.find((k) => k.id === "butter");
    expect(ingredient).toBeDefined();
    if (ingredient === undefined) return;
    expect(is_ingredient(ingredient)).toBe(true);
    if (!is_ingredient(ingredient)) return;
    expect(ingredient.name).toBe("Butter");
    expect(ingredient.default_measurement_type).toBe("volume");
    expect(ingredient.labels).toEqual(["baking", "fat", "solid"]);
  });

  it("parses container rows", () => {
    const result = parse_kitchenware_csv(SAMPLE_CSV);
    const container = result.find((k) => k.id === "bowl");
    expect(container).toBeDefined();
    if (container === undefined) return;
    expect(is_container(container)).toBe(true);
    if (!is_container(container)) return;
    expect(container.name).toBe("Bowl");
    expect(container.labels).toEqual(["vessel"]);
  });

  it("parses equipment rows", () => {
    const result = parse_kitchenware_csv(SAMPLE_CSV);
    const equipment = result.find((k) => k.id === "oven");
    expect(equipment).toBeDefined();
    if (equipment === undefined) return;
    expect(is_equipment(equipment)).toBe(true);
    if (!is_equipment(equipment)) return;
    expect(equipment.name).toBe("Oven");
    expect(equipment.labels).toEqual(["heat"]);
  });

  it("returns empty array for header-only CSV", () => {
    expect(parse_kitchenware_csv("Unique ID,Type,Description,Default Measurement Type,Labels\n")).toEqual([]);
  });

  it("throws on unknown type", () => {
    const bad = `Unique ID,Type,Description,Default Measurement Type,Labels
x,widget,X,volume,
`;
    expect(() => parse_kitchenware_csv(bad)).toThrow("Unknown kitchenware type");
  });

  it("throws on unknown measurement type", () => {
    const bad = `Unique ID,Type,Description,Default Measurement Type,Labels
x,ingredient,X,units,
`;
    expect(() => parse_kitchenware_csv(bad)).toThrow("Unknown measurement type");
  });

  it("handles empty labels", () => {
    const csv = `Unique ID,Type,Description,Default Measurement Type,Labels
water,ingredient,Water,volume,
`;
    const result = parse_kitchenware_csv(csv);
    const water = result.find((k) => k.id === "water");
    expect(water).toBeDefined();
    if (water === undefined) return;
    if (!is_ingredient(water)) return;
    expect(water.labels).toEqual([]);
  });
});

describe("DEFAULT_KITCHENWARE fixture", () => {
  it("loads without error and contains expected entries", async () => {
    const { DEFAULT_KITCHENWARE } = await import("../default_kitchenware.js");
    expect(DEFAULT_KITCHENWARE.length).toBeGreaterThan(0);
    expect(DEFAULT_KITCHENWARE.find((k) => k.id === "butter")).toBeDefined();
    expect(DEFAULT_KITCHENWARE.find((k) => k.id === "bowl")).toBeDefined();
    expect(DEFAULT_KITCHENWARE.find((k) => k.id === "oven")).toBeDefined();
  });
});
