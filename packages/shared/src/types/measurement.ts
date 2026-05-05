export type MeasurementType = "volume" | "weight" | "count";

export type VolumeUnit =
  | "tsp"
  | "tbsp"
  | "fl_oz"
  | "cup"
  | "pint"
  | "quart"
  | "gallon"
  | "ml"
  | "l";

export type WeightUnit = "oz" | "lb" | "g" | "kg";

export type CountUnit = "whole" | "pinch" | "dash";

export type MeasurementUnit = VolumeUnit | WeightUnit | CountUnit;

export interface Fraction {
  readonly numerator: number;
  readonly denominator: number;
}

export interface Measurement {
  readonly value: Fraction;
  readonly unit: MeasurementUnit;
}

export function unit_type(unit: MeasurementUnit): MeasurementType {
  const volume_units: VolumeUnit[] = ["tsp", "tbsp", "fl_oz", "cup", "pint", "quart", "gallon", "ml", "l"];
  const weight_units: WeightUnit[] = ["oz", "lb", "g", "kg"];
  if ((volume_units as MeasurementUnit[]).includes(unit)) return "volume";
  if ((weight_units as MeasurementUnit[]).includes(unit)) return "weight";
  return "count";
}
