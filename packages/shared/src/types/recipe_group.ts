export type SortOrder = "last_modified" | "created" | "alphabetical" | "manual";

export interface RecipeGroup {
  readonly id: string;
  readonly name: string;
  readonly parent_group_id?: string;
  readonly tags: readonly string[];
  readonly sort_order: SortOrder;
  readonly manual_order?: readonly string[];
}
