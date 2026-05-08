import { type } from "arktype";
import { ContainerId, EquipmentId, IngredientId } from "./kitchenware.js";
import { Measurement } from "./measurement.js";
import { IdCompanion } from "./ids.js";
import { Companion } from "./companion.js";
import { EnumCompanion } from "./enums.js";

export const RecipeId = IdCompanion("RecipeId", 12);
export type RecipeId = typeof RecipeId.type.infer;

export const RecipeItemId = IdCompanion("RecipeItemId", 12);
export type RecipeItemId = typeof RecipeItemId.type.infer;

export const IngredientItem = Companion("IngredientItem", type({
  kind: "'ingredient'",
  id: RecipeItemId.type,
  ingredient_id: IngredientId.type,
  quantity: Measurement,
  "notes?": "string",
}));
export type IngredientItem = typeof IngredientItem.type.infer;

export const ContainerItem = Companion("ContainerItem", type({
  kind: "'container'",
  id: RecipeItemId.type,
  container_id: ContainerId.type,
  contents: IngredientItem.type.array(),
  "notes?": "string",
}));
export type ContainerItem = typeof ContainerItem.type.infer;

export const SectionHeader = Companion("SectionHeader", type({
  kind: "'section_header'",
  id: RecipeItemId.type,
  label: "string",
}));
export type SectionHeader = typeof SectionHeader.type.infer;

export const TextBlock = Companion("TextBlock", type({
  kind: "'text_block'",
  id: RecipeItemId.type,
  text: "string",
  "notes?": "string",
}));
export type TextBlock = typeof TextBlock.type.infer;

export const Instruction = Companion("Instruction", type({
  kind: "'instruction'",
  id: RecipeItemId.type,
  equipment_id: EquipmentId.type,
  instruction: "string",
  "duration_seconds?": "number",
  "notes?": "string",
}));
export type Instruction = typeof Instruction.type.infer;

export const RecipeItem = Companion("RecipeItem", type.or(
  IngredientItem.type,
  ContainerItem.type,
  SectionHeader.type,
  TextBlock.type,
  Instruction.type,
));
export type RecipeItem = typeof RecipeItem.type.infer;

export const RecipeItemKind = EnumCompanion("RecipeItemKind", [
  "ingredient_item",
  "container_item",
  "section_label",
  "instruction_block",
  "equipment_instruction",
]);
export type RecipeItemKind = typeof RecipeItemKind.type.infer;

export const RecipeVersionId = IdCompanion("RecipeVersionId", 12);
export type RecipeVersionId = typeof RecipeVersionId.type.infer;

export const RecipeVersion = Companion("RecipeVersion", type({
  id: RecipeVersionId.type,
  recipe_id: RecipeId.type,
  items: RecipeItem.type.array(),
  created_at: "number",
}));
export type RecipeVersion = typeof RecipeVersion.type.infer;

export const Recipe = Companion("Recipe", type({
  id: RecipeId.type,
  name: "string",
  description: "string",
  "parent_group_id?": "string",
  versions: RecipeVersion.type.array(),
  created_at: "number",
  updated_at: "number",
}));
export type Recipe = typeof Recipe.type.infer;

export function is_ingredient_item(item: RecipeItem): item is IngredientItem {
  return item.kind === "ingredient";
}

export function is_container_item(item: RecipeItem): item is ContainerItem {
  return item.kind === "container";
}

export function is_section_header(item: RecipeItem): item is SectionHeader {
  return item.kind === "section_header";
}

export function is_text_block(item: RecipeItem): item is TextBlock {
  return item.kind === "text_block";
}

export function is_instruction(item: RecipeItem): item is Instruction {
  return item.kind === "instruction";
}
