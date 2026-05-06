import type { Kitchenware, Ingredient, Container, Equipment } from "../types/kitchenware.js";
import type { MeasurementType } from "../types/measurement.js";

interface RawRow {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly default_measurement_type: string;
  readonly labels: string;
}

function parse_csv_rows(csv: string): RawRow[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const rows: RawRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined || line.trim() === "") continue;
    const cols = line.split(",");
    if (cols.length < 5) throw new Error(`Malformed kitchenware CSV row ${i + 1}: ${line}`);
    const [id, type, name, default_measurement_type, ...label_parts] = cols;
    if (
      id === undefined ||
      type === undefined ||
      name === undefined ||
      default_measurement_type === undefined
    ) {
      throw new Error(`Missing required fields in kitchenware CSV row ${i + 1}: ${line}`);
    }
    rows.push({
      id: id.trim(),
      type: type.trim(),
      name: name.trim(),
      default_measurement_type: default_measurement_type.trim(),
      labels: label_parts.join(",").trim(),
    });
  }
  return rows;
}

function parse_measurement_type(raw: string, row_id: string): MeasurementType {
  if (raw === "volume" || raw === "weight" || raw === "count") return raw;
  throw new Error(`Unknown measurement type "${raw}" for kitchenware "${row_id}"`);
}

function parse_labels(raw: string): string[] {
  if (raw === "") return [];
  return raw.split("+").map((l) => l.trim()).filter((l) => l !== "");
}

function parse_ingredient(row: RawRow): Ingredient {
  return {
    kind: "ingredient",
    id: row.id,
    name: row.name,
    default_measurement_type: parse_measurement_type(row.default_measurement_type, row.id),
    labels: parse_labels(row.labels),
  };
}

function parse_container(row: RawRow): Container {
  return {
    kind: "container",
    id: row.id,
    name: row.name,
    labels: parse_labels(row.labels),
  };
}

function parse_equipment(row: RawRow): Equipment {
  return {
    kind: "equipment",
    id: row.id,
    name: row.name,
    labels: parse_labels(row.labels),
  };
}

export function parse_kitchenware_csv(csv: string): Kitchenware[] {
  const rows = parse_csv_rows(csv);
  return rows.map((row) => {
    if (row.type === "ingredient") return parse_ingredient(row);
    if (row.type === "container") return parse_container(row);
    if (row.type === "equipment") return parse_equipment(row);
    throw new Error(`Unknown kitchenware type "${row.type}" for id "${row.id}"`);
  });
}
