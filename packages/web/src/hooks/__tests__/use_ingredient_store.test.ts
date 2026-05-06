import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import * as Y from "yjs";
import { DocContext } from "../../contexts/doc_context.js";
import { use_ingredient_store } from "../use_ingredient_store.js";

function make_wrapper(doc: Y.Doc) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(DocContext.Provider, { value: doc }, children);
  };
}

let doc: Y.Doc;

beforeEach(() => {
  doc = new Y.Doc();
});

describe("use_ingredient_store", () => {
  it("initialises from defaults on first render", () => {
    const { result } = renderHook(() => use_ingredient_store(), {
      wrapper: make_wrapper(doc),
    });
    expect(result.current.ingredients.length).toBeGreaterThan(0);
  });

  it("create_ingredient adds a new ingredient", () => {
    const { result } = renderHook(() => use_ingredient_store(), {
      wrapper: make_wrapper(doc),
    });
    const before = result.current.ingredients.length;
    act(() =>
      result.current.create_ingredient({
        name: "Almond Milk",
        default_measurement_type: "volume",
        labels: ["liquid", "dairy-free"],
      }),
    );
    expect(result.current.ingredients.length).toBe(before + 1);
    expect(result.current.ingredients.find((i) => i.name === "Almond Milk")).toBeDefined();
  });

  it("add_labels appends labels to selected ingredients", () => {
    const { result } = renderHook(() => use_ingredient_store(), {
      wrapper: make_wrapper(doc),
    });
    act(() =>
      result.current.create_ingredient({
        name: "Test Ing",
        default_measurement_type: "volume",
        labels: ["a"],
      }),
    );
    const id = result.current.ingredients.find((i) => i.name === "Test Ing")?.id;
    if (id === undefined) throw new Error("ingredient not found");
    act(() => result.current.add_labels([id], ["b", "c"]));
    const updated = result.current.ingredients.find((i) => i.id === id);
    expect(updated?.labels).toContain("b");
    expect(updated?.labels).toContain("c");
  });

  it("remove_labels removes labels from selected ingredients", () => {
    const { result } = renderHook(() => use_ingredient_store(), {
      wrapper: make_wrapper(doc),
    });
    act(() =>
      result.current.create_ingredient({
        name: "Test Ing 2",
        default_measurement_type: "volume",
        labels: ["x", "y"],
      }),
    );
    const id = result.current.ingredients.find((i) => i.name === "Test Ing 2")?.id;
    if (id === undefined) throw new Error("ingredient not found");
    act(() => result.current.remove_labels([id], ["x"]));
    const updated = result.current.ingredients.find((i) => i.id === id);
    expect(updated?.labels).not.toContain("x");
    expect(updated?.labels).toContain("y");
  });

  it("set_measurement_type changes the type", () => {
    const { result } = renderHook(() => use_ingredient_store(), {
      wrapper: make_wrapper(doc),
    });
    const butter = result.current.ingredients.find((i) => i.id === "butter");
    if (butter === undefined) throw new Error("butter not found in defaults");
    act(() => result.current.set_measurement_type([butter.id], "weight"));
    const updated = result.current.ingredients.find((i) => i.id === "butter");
    expect(updated?.default_measurement_type).toBe("weight");
  });

  it("set_parent sets and clears parent_id", () => {
    const { result } = renderHook(() => use_ingredient_store(), {
      wrapper: make_wrapper(doc),
    });
    const butter = result.current.ingredients.find((i) => i.id === "butter");
    if (butter === undefined) throw new Error("butter not found in defaults");
    act(() => result.current.set_parent([butter.id], "dairy"));
    expect(result.current.ingredients.find((i) => i.id === "butter")?.parent_id).toBe("dairy");
    act(() => result.current.set_parent([butter.id], undefined));
    expect(result.current.ingredients.find((i) => i.id === "butter")?.parent_id).toBeUndefined();
  });
});
