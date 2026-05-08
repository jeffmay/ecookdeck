import { type } from "arktype";

export const MeasurementType = type("'volume' | 'weight' | 'count'");
export type MeasurementType = typeof MeasurementType.infer;

export const VolumeUnit = type(
  "'tsp' | 'tbsp' | 'fl_oz' | 'cup' | 'pint' | 'quart' | 'gallon' | 'ml' | 'l'",
);
export type VolumeUnit = typeof VolumeUnit.infer;

export const WeightUnit = type("'oz' | 'lb' | 'g' | 'kg'");
export type WeightUnit = typeof WeightUnit.infer;

export const CountUnit = type("'whole' | 'pinch' | 'dash'");
export type CountUnit = typeof CountUnit.infer;

export const MeasurementUnit = VolumeUnit.or(WeightUnit).or(CountUnit);
export type MeasurementUnit = typeof MeasurementUnit.infer;

export const Fraction = type({ numerator: "number", denominator: "number" });
export type Fraction = typeof Fraction.infer;

export const Measurement = type({ value: Fraction, unit: MeasurementUnit });
export type Measurement = typeof Measurement.infer;

export function unit_type(unit: MeasurementUnit): MeasurementType | undefined {
  if (!(VolumeUnit(unit) instanceof type.errors)) return "volume";
  if (!(WeightUnit(unit) instanceof type.errors)) return "weight";
  if (!(CountUnit(unit) instanceof type.errors)) return "count";
}
