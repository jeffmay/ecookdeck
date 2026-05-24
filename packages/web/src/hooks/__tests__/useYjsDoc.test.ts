import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import * as Y from "yjs";

const mockDestroy = vi.fn();
const MockIndexeddbPersistence = vi.fn().mockImplementation(() => ({
  destroy: mockDestroy,
}));

vi.mock("y-indexeddb", () => ({
  IndexeddbPersistence: MockIndexeddbPersistence,
}));

const { useKitchenwareDoc, useRecipeBookDoc } = await import("../useYjsDoc.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useKitchenwareDoc", () => {
  it("returns a Y.Doc instance", () => {
    const { result } = renderHook(() => useKitchenwareDoc("Alice"));
    expect(result.current).toBeInstanceOf(Y.Doc);
  });

  it("creates IndexeddbPersistence keyed with kitchenware- prefix", () => {
    renderHook(() => useKitchenwareDoc("Alice"));
    expect(MockIndexeddbPersistence).toHaveBeenCalledWith("kitchenware-Alice", expect.any(Y.Doc));
  });

  it("destroys persistence on unmount", () => {
    const { unmount } = renderHook(() => useKitchenwareDoc("Alice"));
    unmount();
    expect(mockDestroy).toHaveBeenCalledOnce();
  });
});

describe("useRecipeBookDoc", () => {
  it("returns a Y.Doc instance", () => {
    const { result } = renderHook(() => useRecipeBookDoc("Alice"));
    expect(result.current).toBeInstanceOf(Y.Doc);
  });

  it("creates IndexeddbPersistence keyed with recipes- prefix", () => {
    renderHook(() => useRecipeBookDoc("Alice"));
    expect(MockIndexeddbPersistence).toHaveBeenCalledWith("recipes-Alice", expect.any(Y.Doc));
  });

  it("destroys persistence on unmount", () => {
    const { unmount } = renderHook(() => useRecipeBookDoc("Alice"));
    unmount();
    expect(mockDestroy).toHaveBeenCalledOnce();
  });
});
