import { describe, it, expect } from "vitest";
import { type } from "arktype";
import { unit_type, VolumeUnit, WeightUnit, CountUnit, Fraction, Measurement } from "../measurement.js";

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

describe("unit schemas", () => {
  it("VolumeUnit accepts valid units and rejects invalid ones", () => {
    expect(VolumeUnit("cup") instanceof type.errors).toBe(false);
    expect(VolumeUnit("ml") instanceof type.errors).toBe(false);
    expect(VolumeUnit("oz") instanceof type.errors).toBe(true);
    expect(VolumeUnit("bad") instanceof type.errors).toBe(true);
  });

  it("WeightUnit accepts valid units and rejects invalid ones", () => {
    expect(WeightUnit("oz") instanceof type.errors).toBe(false);
    expect(WeightUnit("kg") instanceof type.errors).toBe(false);
    expect(WeightUnit("cup") instanceof type.errors).toBe(true);
  });

  it("CountUnit accepts valid units and rejects invalid ones", () => {
    expect(CountUnit("whole") instanceof type.errors).toBe(false);
    expect(CountUnit("tsp") instanceof type.errors).toBe(true);
  });
});

describe("Fraction schema", () => {
  it("accepts valid fractions", () => {
    expect(Fraction({ numerator: 1, denominator: 2 }) instanceof type.errors).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(Fraction({ numerator: 1 }) instanceof type.errors).toBe(true);
    expect(Fraction({}) instanceof type.errors).toBe(true);
  });
});

describe("Measurement schema", () => {
  it("accepts a valid measurement", () => {
    const result = Measurement({ value: { numerator: 1, denominator: 2 }, unit: "cup" });
    expect(result instanceof type.errors).toBe(false);
  });

  it("rejects an invalid unit", () => {
    const result = Measurement({ value: { numerator: 1, denominator: 2 }, unit: "bad" });
    expect(result instanceof type.errors).toBe(true);
  });
});
