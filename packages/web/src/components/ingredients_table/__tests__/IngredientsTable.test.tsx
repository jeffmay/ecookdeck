import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Ingredient } from "@recipe-book/shared";
import { IngredientsTable } from "../IngredientsTable.js";

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
const FLOUR: Ingredient = {
  kind: "ingredient",
  id: "flour",
  name: "Flour",
  default_measurement_type: "volume",
  labels: ["baking"],
};
const CHEESE: Ingredient = {
  kind: "ingredient",
  id: "cheese",
  name: "Cheese",
  default_measurement_type: "weight",
  labels: ["solid"],
};

const on_rename = vi.fn();
const on_set_type = vi.fn();
const on_set_labels = vi.fn();
const on_set_parent = vi.fn();

function setup(ingredients: Ingredient[] = [DAIRY, BUTTER, FLOUR, CHEESE]) {
  return render(
    <IngredientsTable
      ingredients={ingredients}
      on_rename={on_rename}
      on_set_type={on_set_type}
      on_set_labels={on_set_labels}
      on_set_parent={on_set_parent}
    />,
  );
}

function get_table() {
  return screen.getByRole("region", { name: "Ingredient list" });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("IngredientsTable — rendering", () => {
  it("renders the ingredient list region", () => {
    setup();
    expect(get_table()).toBeInTheDocument();
  });

  it("renders root-level ingredients", async () => {
    setup();
    // Use findByText to handle any deferred row model computation
    expect(await screen.findByText("Dairy")).toBeInTheDocument();
    expect(await screen.findByText("Flour")).toBeInTheDocument();
    expect(await screen.findByText("Cheese")).toBeInTheDocument();
  });

  it("renders column headers", () => {
    setup();
    expect(screen.getByRole("button", { name: "Sort by name" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sort by default_measurement_type" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sort by parent_name" })).toBeInTheDocument();
  });

  it("shows empty message when no ingredients", () => {
    setup([]);
    expect(screen.getByText("No ingredients match the current filter.")).toBeInTheDocument();
  });
});

describe("IngredientsTable — tree expand/collapse", () => {
  it("hides child rows by default (collapsed)", () => {
    setup();
    expect(screen.queryByText("Butter")).not.toBeInTheDocument();
  });

  it("shows expand button on rows with children", async () => {
    setup();
    // Wait for Dairy (a parent row) to appear in the DOM
    await screen.findByText("Dairy");
    const dairy_row = screen.getByText("Dairy").closest("tr")!;
    expect(within(dairy_row).getByRole("button", { name: /Expand Dairy/ })).toBeInTheDocument();
  });

  it("expands children on expand button click", async () => {
    setup();
    await screen.findByText("Dairy");
    await userEvent.click(screen.getByRole("button", { name: /Expand Dairy/ }));
    expect(screen.getByText("Butter")).toBeInTheDocument();
  });

  it("collapses children on second click", async () => {
    setup();
    await screen.findByText("Dairy");
    await userEvent.click(screen.getByRole("button", { name: /Expand Dairy/ }));
    expect(screen.getByText("Butter")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Collapse Dairy/ }));
    expect(screen.queryByText("Butter")).not.toBeInTheDocument();
  });
});

describe("IngredientsTable — text filters", () => {
  it("filters by name", async () => {
    setup();
    await screen.findByText("Flour");
    await userEvent.type(screen.getByLabelText("Filter by name"), "Fl");
    expect(screen.getByText("Flour")).toBeInTheDocument();
    expect(screen.queryByText("Dairy")).not.toBeInTheDocument();
    expect(screen.queryByText("Cheese")).not.toBeInTheDocument();
  });

  it("shows empty state when filter matches nothing", async () => {
    setup();
    await screen.findByText("Flour");
    await userEvent.type(screen.getByLabelText("Filter by name"), "zzz");
    expect(screen.getByText("No ingredients match the current filter.")).toBeInTheDocument();
  });
});

describe("IngredientsTable — multi-select filter (type)", () => {
  it("filters by measurement type via MultiSelectFilter", async () => {
    setup();
    await screen.findByText("Flour");
    const type_filter_input = screen.getByLabelText("Filter by type");
    await userEvent.click(type_filter_input);
    await userEvent.click(screen.getByRole("checkbox", { name: "weight" }));
    await userEvent.click(screen.getByRole("button", { name: "Accept filter" }));
    expect(screen.getByText("Cheese")).toBeInTheDocument();
    expect(screen.queryByText("Flour")).not.toBeInTheDocument();
  });
});

describe("IngredientsTable — sorting", () => {
  it("sorts by name ascending on first click", async () => {
    setup([FLOUR, CHEESE]); // No parent-child, all root rows
    await screen.findByText("Flour");
    await userEvent.click(screen.getByRole("button", { name: "Sort by name" }));
    const rows = screen.getAllByRole("row").slice(1); // skip header row
    expect(rows[0]).toHaveTextContent("Cheese");
    expect(rows[1]).toHaveTextContent("Flour");
  });

  it("sorts by name descending on second click", async () => {
    setup([FLOUR, CHEESE]);
    await screen.findByText("Flour");
    await userEvent.click(screen.getByRole("button", { name: "Sort by name" }));
    await userEvent.click(screen.getByRole("button", { name: "Sort by name" }));
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Flour");
    expect(rows[1]).toHaveTextContent("Cheese");
  });
});

describe("IngredientsTable — editable cells", () => {
  it("clicking name cell enters edit mode", async () => {
    setup([FLOUR]);
    await screen.findByRole("button", { name: "Edit name for Flour" });
    await userEvent.click(screen.getByRole("button", { name: "Edit name for Flour" }));
    expect(screen.getByRole("textbox", { name: "Edit name for Flour" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel edit" })).toBeInTheDocument();
  });

  it("confirms name edit on ✔︎ button click", async () => {
    setup([FLOUR]);
    await screen.findByRole("button", { name: "Edit name for Flour" });
    await userEvent.click(screen.getByRole("button", { name: "Edit name for Flour" }));
    const input = screen.getByRole("textbox", { name: "Edit name for Flour" });
    await userEvent.clear(input);
    await userEvent.type(input, "Bread Flour");
    await userEvent.click(screen.getByRole("button", { name: "Confirm edit" }));
    expect(on_rename).toHaveBeenCalledWith("flour", "Bread Flour");
  });

  it("confirms name edit on Enter key", async () => {
    setup([FLOUR]);
    await screen.findByRole("button", { name: "Edit name for Flour" });
    await userEvent.click(screen.getByRole("button", { name: "Edit name for Flour" }));
    const input = screen.getByRole("textbox", { name: "Edit name for Flour" });
    await userEvent.clear(input);
    await userEvent.type(input, "Rice Flour{Enter}");
    expect(on_rename).toHaveBeenCalledWith("flour", "Rice Flour");
  });

  it("cancels edit on ✗ button click without calling callback", async () => {
    setup([FLOUR]);
    await screen.findByRole("button", { name: "Edit name for Flour" });
    await userEvent.click(screen.getByRole("button", { name: "Edit name for Flour" }));
    const input = screen.getByRole("textbox", { name: "Edit name for Flour" });
    await userEvent.clear(input);
    await userEvent.type(input, "Changed");
    await userEvent.click(screen.getByRole("button", { name: "Cancel edit" }));
    expect(on_rename).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Edit name for Flour" })).not.toBeInTheDocument();
  });

  it("cancels edit on Escape key", async () => {
    setup([FLOUR]);
    await screen.findByRole("button", { name: "Edit name for Flour" });
    await userEvent.click(screen.getByRole("button", { name: "Edit name for Flour" }));
    const input = screen.getByRole("textbox", { name: "Edit name for Flour" });
    await userEvent.type(input, "{Escape}");
    expect(on_rename).not.toHaveBeenCalled();
  });

  it("calls on_set_type when committing type edit", async () => {
    setup([FLOUR]);
    await screen.findByRole("button", { name: "Edit type for Flour" });
    await userEvent.click(screen.getByRole("button", { name: "Edit type for Flour" }));
    const select = screen.getByRole("combobox", { name: "Edit type for Flour" });
    await userEvent.selectOptions(select, "weight");
    await userEvent.click(screen.getByRole("button", { name: "Confirm edit" }));
    expect(on_set_type).toHaveBeenCalledWith("flour", "weight");
  });

  it("calls on_set_labels when committing labels edit", async () => {
    setup([FLOUR]);
    await screen.findByRole("button", { name: "Edit labels for Flour" });
    await userEvent.click(screen.getByRole("button", { name: "Edit labels for Flour" }));
    const input = screen.getByRole("textbox", { name: "Edit labels for Flour" });
    await userEvent.clear(input);
    await userEvent.type(input, "baking, starch{Enter}");
    expect(on_set_labels).toHaveBeenCalledWith("flour", ["baking", "starch"]);
  });
});

describe("IngredientsTable — grouping", () => {
  it("groups rows by measurement type when toggle clicked", async () => {
    setup([FLOUR, CHEESE]);
    await screen.findByText("Flour");
    await userEvent.click(
      screen.getByRole("button", { name: "Group by default_measurement_type" }),
    );
    // Group rows show the grouped value
    expect(screen.getByText(/volume/)).toBeInTheDocument();
    expect(screen.getByText(/weight/)).toBeInTheDocument();
  });

  it("ungroups when toggle clicked again", async () => {
    setup([FLOUR, CHEESE]);
    await screen.findByText("Flour");
    await userEvent.click(
      screen.getByRole("button", { name: "Group by default_measurement_type" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Ungroup by default_measurement_type" }),
    );
    // Normal editable buttons return after ungrouping
    expect(await screen.findByRole("button", { name: "Edit name for Flour" })).toBeInTheDocument();
  });
});
