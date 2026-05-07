import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import type { Column } from "@tanstack/react-table";
import type { IngredientRow } from "../build_ingredient_tree.js";
import { MultiSelectFilter, to_string_array } from "../MultiSelectFilter.js";

// ---------------------------------------------------------------------------
// to_string_array helper
// ---------------------------------------------------------------------------

describe("to_string_array", () => {
  it("returns empty array for non-array input", () => {
    expect(to_string_array(null)).toEqual([]);
    expect(to_string_array("foo")).toEqual([]);
    expect(to_string_array(42)).toEqual([]);
  });

  it("filters out non-string values", () => {
    expect(to_string_array(["a", 1, null, "b"])).toEqual(["a", "b"]);
  });

  it("returns all strings unchanged", () => {
    expect(to_string_array(["x", "y", "z"])).toEqual(["x", "y", "z"]);
  });
});

// ---------------------------------------------------------------------------
// MultiSelectFilter component
// ---------------------------------------------------------------------------

function make_column(initial: string[] = []): Column<IngredientRow, unknown> {
  let filter_value: unknown = initial.length > 0 ? initial : undefined;
  return {
    getFilterValue: () => filter_value,
    setFilterValue: (v: unknown) => {
      filter_value = v;
    },
  } as unknown as Column<IngredientRow, unknown>;
}

const OPTIONS = ["dairy", "fat", "solid", "liquid"];

function setup(initial: string[] = []) {
  const column = make_column(initial);
  render(
    <MultiSelectFilter column={column} all_options={OPTIONS} aria_label="Filter by labels" />,
  );
  return { column };
}

describe("MultiSelectFilter — closed state", () => {
  it("shows placeholder when nothing selected", () => {
    setup();
    expect(screen.getByPlaceholderText("Filter…")).toBeInTheDocument();
  });

  it("shows selected option name when one item selected", () => {
    setup(["dairy"]);
    const input = screen.getByRole("textbox", { name: "Filter by labels" });
    expect((input as HTMLInputElement).value).toBe("dairy");
  });

  it("shows count when multiple selected", () => {
    setup(["dairy", "fat"]);
    const input = screen.getByRole("textbox", { name: "Filter by labels" });
    expect((input as HTMLInputElement).value).toBe("2 selected");
  });

  it("shows clear button when items are selected", () => {
    setup(["dairy"]);
    expect(screen.getByLabelText("Clear Filter by labels")).toBeInTheDocument();
  });

  it("does not show clear button when nothing selected", () => {
    setup();
    expect(screen.queryByLabelText("Clear Filter by labels")).not.toBeInTheDocument();
  });
});

describe("MultiSelectFilter — opening the dropdown", () => {
  it("opens dropdown on click", async () => {
    setup();
    await userEvent.click(screen.getByRole("textbox", { name: "Filter by labels" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(OPTIONS.length);
  });

  it("pre-checks already-selected options on open", async () => {
    setup(["dairy", "fat"]);
    await userEvent.click(screen.getByRole("textbox", { name: "Filter by labels" }));
    const dropdown = screen.getByRole("listbox");
    const dairy_cb = within(dropdown).getByRole("checkbox", { name: "dairy" });
    const fat_cb = within(dropdown).getByRole("checkbox", { name: "fat" });
    const solid_cb = within(dropdown).getByRole("checkbox", { name: "solid" });
    expect(dairy_cb).toBeChecked();
    expect(fat_cb).toBeChecked();
    expect(solid_cb).not.toBeChecked();
  });
});

describe("MultiSelectFilter — toggling options", () => {
  it("checking an option updates the filter immediately", async () => {
    const { column } = setup();
    await userEvent.click(screen.getByRole("textbox", { name: "Filter by labels" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "fat" }));
    expect(column.getFilterValue()).toEqual(["fat"]);
  });

  it("unchecking removes option from filter", async () => {
    const { column } = setup(["fat"]);
    await userEvent.click(screen.getByRole("textbox", { name: "Filter by labels" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "fat" }));
    expect(column.getFilterValue()).toBeUndefined();
  });
});

describe("MultiSelectFilter — search within dropdown", () => {
  it("filters visible options by search text", async () => {
    setup();
    await userEvent.click(screen.getByRole("textbox", { name: "Filter by labels" }));
    await userEvent.type(
      screen.getByRole("textbox", { name: "Search Filter by labels options" }),
      "da",
    );
    const dropdown = screen.getByRole("listbox");
    expect(within(dropdown).getByRole("checkbox", { name: "dairy" })).toBeInTheDocument();
    expect(within(dropdown).queryByRole("checkbox", { name: "fat" })).not.toBeInTheDocument();
  });

  it("shows no-options message when search matches nothing", async () => {
    setup();
    await userEvent.click(screen.getByRole("textbox", { name: "Filter by labels" }));
    await userEvent.type(
      screen.getByRole("textbox", { name: "Search Filter by labels options" }),
      "zzz",
    );
    expect(screen.getByText("No options")).toBeInTheDocument();
  });
});

describe("MultiSelectFilter — accept and revert", () => {
  it("closes on accept without reverting the filter", async () => {
    const { column } = setup();
    await userEvent.click(screen.getByRole("textbox", { name: "Filter by labels" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "fat" }));
    await userEvent.click(screen.getByRole("button", { name: "Accept filter" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(column.getFilterValue()).toEqual(["fat"]);
  });

  it("reverts to snapshot on revert button click", async () => {
    const { column } = setup(["dairy"]);
    await userEvent.click(screen.getByRole("textbox", { name: "Filter by labels" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "fat" }));
    await userEvent.click(screen.getByRole("button", { name: "Revert filter" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(column.getFilterValue()).toEqual(["dairy"]);
  });

  it("reverts to undefined when snapshot was empty", async () => {
    const { column } = setup();
    await userEvent.click(screen.getByRole("textbox", { name: "Filter by labels" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "fat" }));
    await userEvent.click(screen.getByRole("button", { name: "Revert filter" }));
    expect(column.getFilterValue()).toBeUndefined();
  });
});

describe("MultiSelectFilter — clear button", () => {
  it("clears the filter and collapses to placeholder", async () => {
    const { column } = setup(["dairy"]);
    await userEvent.click(screen.getByLabelText("Clear Filter by labels"));
    expect(column.getFilterValue()).toBeUndefined();
  });
});

describe("MultiSelectFilter — outside click auto-accepts", () => {
  it("closes the dropdown when clicking outside", async () => {
    setup(["fat"]);
    await userEvent.click(screen.getByRole("textbox", { name: "Filter by labels" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.click(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps current selection on outside click (auto-accept)", async () => {
    const { column } = setup();
    await userEvent.click(screen.getByRole("textbox", { name: "Filter by labels" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "solid" }));
    await userEvent.click(document.body);
    expect(column.getFilterValue()).toEqual(["solid"]);
  });
});

// suppress unused vi import warning
void vi;
