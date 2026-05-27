import { describe, expect, it } from "vitest";
import { paddedId } from "../ids.ts";
import { isActiveSession, isCompletedSession, SessionId, type Session } from "../session.ts";

describe("session type guards", () => {
  const active_session: Session = {
    id: paddedId(SessionId, "sess-1"),
    recipe_id: "recipe-1",
    recipe_version_id: "ver-1",
    started_at: 1000,
    status: "active",
    item_states: {},
  };

  const completed_session: Session = {
    id: paddedId(SessionId, "sess-2"),
    recipe_id: "recipe-1",
    recipe_version_id: "ver-1",
    started_at: 1000,
    completed_at: 2000,
    status: "completed",
    item_states: {},
  };

  it("isActiveSession identifies active sessions", () => {
    expect(isActiveSession(active_session)).toBe(true);
    expect(isActiveSession(completed_session)).toBe(false);
  });

  it("isCompletedSession identifies completed sessions", () => {
    expect(isCompletedSession(active_session)).toBe(false);
    expect(isCompletedSession(completed_session)).toBe(true);
  });
});
