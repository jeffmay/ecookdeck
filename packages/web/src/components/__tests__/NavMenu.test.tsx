import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { NavMenu } from "../NavMenu.js";

describe("NavMenu", () => {
  it("renders the trigger button", () => {
    render(<NavMenu on_navigate={vi.fn()} />);
    expect(screen.getByLabelText("Navigation menu")).toBeInTheDocument();
  });

  it("shows Ingredients link when opened", async () => {
    render(<NavMenu on_navigate={vi.fn()} />);
    await userEvent.click(screen.getByLabelText("Navigation menu"));
    expect(screen.getByRole("button", { name: "Ingredients" })).toBeInTheDocument();
  });

  it("calls on_navigate with bulk_ingredient_editor when Ingredients clicked", async () => {
    const on_navigate = vi.fn();
    render(<NavMenu on_navigate={on_navigate} />);
    await userEvent.click(screen.getByLabelText("Navigation menu"));
    await userEvent.click(screen.getByRole("button", { name: "Ingredients" }));
    expect(on_navigate).toHaveBeenCalledWith("bulk_ingredient_editor");
  });
});
