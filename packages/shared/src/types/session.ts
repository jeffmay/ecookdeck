import type { Fraction, Measurement } from "./measurement.js";

export interface ItemState {
  readonly checked: boolean;
  readonly one_off_quantity?: Measurement;
  readonly notes?: string;
}

export type SessionStatus = "active" | "completed";

export interface Session {
  readonly id: string;
  readonly recipe_id: string;
  readonly recipe_version_id: string;
  readonly started_at: number;
  readonly completed_at?: number;
  readonly status: SessionStatus;
  readonly item_states: Readonly<Record<string, ItemState>>;
  readonly rescale_multiplier?: Fraction;
  readonly rating?: number;
  readonly session_notes?: string;
}

export function is_active_session(session: Session): session is Session & { status: "active" } {
  return session.status === "active";
}

export function is_completed_session(
  session: Session,
): session is Session & { status: "completed"; completed_at: number } {
  return session.status === "completed";
}
