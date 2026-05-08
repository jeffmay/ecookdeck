import { describe, expect, it } from "vitest";
import { padded_id } from "../ids.js";
import { is_active_session, is_completed_session, SessionId, type Session } from "../session.js";

describe("session type guards", () => {
  const active_session: Session = {
    id: padded_id(SessionId, "sess-1"),
    recipe_id: "recipe-1",
    recipe_version_id: "ver-1",
    started_at: 1000,
    status: "active",
    item_states: {},
  };

  const completed_session: Session = {
    id: padded_id(SessionId, "sess-2"),
    recipe_id: "recipe-1",
    recipe_version_id: "ver-1",
    started_at: 1000,
    completed_at: 2000,
    status: "completed",
    item_states: {},
  };

  it("is_active_session identifies active sessions", () => {
    expect(is_active_session(active_session)).toBe(true);
    expect(is_active_session(completed_session)).toBe(false);
  });

  it("is_completed_session identifies completed sessions", () => {
    expect(is_completed_session(active_session)).toBe(false);
    expect(is_completed_session(completed_session)).toBe(true);
  });
});
