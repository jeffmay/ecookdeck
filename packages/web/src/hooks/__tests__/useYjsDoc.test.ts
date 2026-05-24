import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import * as Y from "yjs";

const mockDestroy = vi.fn();
const MockIndexeddbPersistence = vi.fn().mockImplementation(() => ({
  destroy: mockDestroy,
  whenSynced: Promise.resolve(),
}));

vi.mock("y-indexeddb", () => ({
  IndexeddbPersistence: MockIndexeddbPersistence,
}));

const { useYjsDoc } = await import("../useYjsDoc.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useYjsDoc", () => {
  it("returns a Y.Doc instance", () => {
    const { result } = renderHook(() => useYjsDoc("Alice"));
    expect(result.current.doc).toBeInstanceOf(Y.Doc);
  });

  it("creates IndexeddbPersistence keyed by userName", () => {
    renderHook(() => useYjsDoc("Alice"));
    expect(MockIndexeddbPersistence).toHaveBeenCalledWith("Alice", expect.any(Y.Doc));
  });

  it("destroys persistence on unmount", () => {
    const { unmount } = renderHook(() => useYjsDoc("Alice"));
    unmount();
    expect(mockDestroy).toHaveBeenCalledOnce();
  });

  it("returns the same doc instance across re-renders", () => {
    const { result, rerender } = renderHook(() => useYjsDoc("Alice"));
    const first = result.current.doc;
    rerender();
    expect(result.current.doc).toBe(first);
  });
});
