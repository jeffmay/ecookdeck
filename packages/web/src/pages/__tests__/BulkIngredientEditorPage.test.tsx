import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { createElement, type ReactNode } from "react";
import * as Y from "yjs";
import { DocContext } from "../../contexts/doc_context.js";
import { BulkIngredientEditorPage } from "../BulkIngredientEditorPage.js";

function make_wrapper(doc: Y.Doc) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(DocContext.Provider, { value: doc }, children);
  };
}

let doc: Y.Doc;

beforeEach(() => {
  doc = new Y.Doc();
});

function setup() {
  return render(<BulkIngredientEditorPage />, { wrapper: make_wrapper(doc) });
}

function get_table() {
  return screen.getByRole("region", { name: "Ingredient list" });
}

describe("BulkIngredientEditorPage — initial render", () => {
  it("renders the Ingredients heading", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Ingredients" })).toBeInTheDocument();
  });

  it("renders filter controls", () => {
    setup();
    expect(screen.getByLabelText("Filter by label")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by measurement type")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by parent ingredient")).toBeInTheDocument();
  });

  it("renders the ingredient table with default data", () => {
    setup();
    expect(get_table()).toBeInTheDocument();
    // Default kitchenware includes butter — check within the table region
    expect(within(get_table()).getByText("Butter")).toBeInTheDocument();
  });

  it("shows the + New ingredient button", () => {
    setup();
    expect(screen.getByLabelText("Add new ingredient")).toBeInTheDocument();
  });

  it("does not show bulk bar when nothing selected", () => {
    setup();
    expect(screen.queryByLabelText("Bulk actions")).not.toBeInTheDocument();
  });
});

describe("BulkIngredientEditorPage — filter", () => {
  it("filters by label to show only matching ingredients", async () => {
    setup();
    await userEvent.type(screen.getByLabelText("Filter by label"), "fat");
    const table = get_table();
    // Butter has 'fat' label — should still be visible in the table
    expect(within(table).getByText("Butter")).toBeInTheDocument();
    // Flour does not have 'fat' — should be hidden from the table
    expect(within(table).queryByText("Flour")).not.toBeInTheDocument();
  });

  it("filters by measurement type", async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText("Filter by measurement type"), "weight");
    const table = get_table();
    // Butter is volume — should be hidden from the table
    expect(within(table).queryByText("Butter")).not.toBeInTheDocument();
    // Cheese is weight — should be visible (from defaults)
    expect(within(table).getByText("Cheese")).toBeInTheDocument();
  });
});

describe("BulkIngredientEditorPage — selection", () => {
  it("shows bulk bar after selecting an ingredient", async () => {
    setup();
    await userEvent.click(screen.getByLabelText("Select Butter"));
    expect(screen.getByLabelText("Bulk actions")).toBeInTheDocument();
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("select-all checkbox selects all displayed ingredients", async () => {
    setup();
    await userEvent.click(screen.getByLabelText("Select all ingredients"));
    // All row checkboxes (excluding select-all itself) should be checked
    within(get_table())
      .getAllByRole("checkbox")
      .forEach((cb) => expect(cb).toBeChecked());
  });

  it("deselects all when select-all clicked while all selected", async () => {
    setup();
    await userEvent.click(screen.getByLabelText("Select all ingredients"));
    await userEvent.click(screen.getByLabelText("Select all ingredients"));
    within(get_table())
      .getAllByRole("checkbox")
      .forEach((cb) => expect(cb).not.toBeChecked());
  });
});

describe("BulkIngredientEditorPage — add ingredient form", () => {
  it("shows the add form when + New ingredient is clicked", async () => {
    setup();
    await userEvent.click(screen.getByLabelText("Add new ingredient"));
    expect(screen.getByLabelText("New ingredient name")).toBeInTheDocument();
  });

  it("hides the add form on Cancel", async () => {
    setup();
    await userEvent.click(screen.getByLabelText("Add new ingredient"));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("New ingredient name")).not.toBeInTheDocument();
  });

  it("Add button is disabled when name is empty", async () => {
    setup();
    await userEvent.click(screen.getByLabelText("Add new ingredient"));
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("creates an ingredient and closes the form", async () => {
    setup();
    await userEvent.click(screen.getByLabelText("Add new ingredient"));
    await userEvent.type(screen.getByLabelText("New ingredient name"), "Coconut Oil");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(within(get_table()).getByText("Coconut Oil")).toBeInTheDocument();
    expect(screen.queryByLabelText("New ingredient name")).not.toBeInTheDocument();
  });
});

describe("BulkIngredientEditorPage — bulk actions", () => {
  function get_butter_row() {
    const cell = within(get_table()).getByText("Butter");
    const row = cell.closest("tr");
    if (row === null) throw new Error("Butter row not found");
    return row;
  }

  async function select_butter() {
    await userEvent.click(screen.getByLabelText("Select Butter"));
  }

  it("adds a label to selected ingredients", async () => {
    setup();
    await select_butter();
    const bar = screen.getByLabelText("Bulk actions");
    await userEvent.type(within(bar).getByLabelText("Label to add"), "premium");
    await userEvent.click(within(bar).getAllByRole("button", { name: "Apply" })[0]!);
    expect(within(get_butter_row()).getByText(/premium/)).toBeInTheDocument();
  });

  it("removes a label from selected ingredients", async () => {
    setup();
    await select_butter();
    const bar = screen.getByLabelText("Bulk actions");
    await userEvent.type(within(bar).getByLabelText("Label to remove"), "fat");
    await userEvent.click(within(bar).getAllByRole("button", { name: "Apply" })[1]!);
    // 'fat' should no longer be in the Butter row's labels cell
    expect(within(get_butter_row()).queryByText(/\bfat\b/)).not.toBeInTheDocument();
  });

  it("changes measurement type for selected ingredients", async () => {
    setup();
    await select_butter();
    const bar = screen.getByLabelText("Bulk actions");
    await userEvent.selectOptions(within(bar).getByLabelText("Measurement type to set"), "weight");
    await userEvent.click(within(bar).getAllByRole("button", { name: "Apply" })[2]!);
    expect(within(get_butter_row()).getByText("weight")).toBeInTheDocument();
  });
});

describe("BulkIngredientEditorPage — stale filter", () => {
  it("shows stale banner when a bulk edit would change the filtered list", async () => {
    setup();
    // Filter to show only 'fat'-labelled ingredients (Butter has 'fat')
    await userEvent.type(screen.getByLabelText("Filter by label"), "fat");
    // Select Butter and remove the 'fat' label → Butter no longer matches filter
    await userEvent.click(screen.getByLabelText("Select Butter"));
    const bar = screen.getByLabelText("Bulk actions");
    await userEvent.type(within(bar).getByLabelText("Label to remove"), "fat");
    await userEvent.click(within(bar).getAllByRole("button", { name: "Apply" })[1]!);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh filter" })).toBeInTheDocument();
  });

  it("clears stale banner after Refresh filter and removes non-matching rows", async () => {
    setup();
    await userEvent.type(screen.getByLabelText("Filter by label"), "fat");
    await userEvent.click(screen.getByLabelText("Select Butter"));
    const bar = screen.getByLabelText("Bulk actions");
    await userEvent.type(within(bar).getByLabelText("Label to remove"), "fat");
    await userEvent.click(within(bar).getAllByRole("button", { name: "Apply" })[1]!);
    await userEvent.click(screen.getByRole("button", { name: "Refresh filter" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    // Butter no longer has 'fat' label, so it should be gone from the table
    expect(within(get_table()).queryByText("Butter")).not.toBeInTheDocument();
  });
});
