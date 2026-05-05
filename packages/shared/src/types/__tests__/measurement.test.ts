import { describe, it, expect } from "vitest";
import { unit_type } from "../measurement.js";

describe("unit_type", () => {
  it("classifies volume units", () => {
    expect(unit_type("tsp")).toBe("volume");
    expect(unit_type("tbsp")).toBe("volume");
    expect(unit_type("cup")).toBe("volume");
    expect(unit_type("ml")).toBe("volume");
    expect(unit_type("l")).toBe("volume");
  });

  it("classifies weight units", () => {
    expect(unit_type("oz")).toBe("weight");
    expect(unit_type("lb")).toBe("weight");
    expect(unit_type("g")).toBe("weight");
    expect(unit_type("kg")).toBe("weight");
  });

  it("classifies count units", () => {
    expect(unit_type("whole")).toBe("count");
    expect(unit_type("pinch")).toBe("count");
    expect(unit_type("dash")).toBe("count");
  });
});
