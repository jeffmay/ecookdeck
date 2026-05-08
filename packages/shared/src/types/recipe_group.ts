import { type } from "arktype";
import { IdCompanion } from "./ids";
import { EnumCompanion } from "./enums";

export const SortOrder = EnumCompanion("SortOrder", ["last_modified", "created", "alphabetical", "manual"]);
export type SortOrder = typeof SortOrder.type.infer;

export const RecipeGroupId = IdCompanion("RecipeGroupId", 12);
export type RecipeGroupId = typeof RecipeGroupId.type.infer;

export const RecipeGroup = type({
  id: RecipeGroupId.type,
  name: "string",
  "parent_group_id?": "string",
  tags: "string[]",
  sort_order: SortOrder.type,
  "manual_order?": "string[]",
});
export type RecipeGroup = typeof RecipeGroup.infer;
