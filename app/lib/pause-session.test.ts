import { describe, expect, it } from "vitest";
import { createPauseSessionGuard } from "./pause-session";

describe("createPauseSessionGuard", () => {
  it("accepts a live session exactly once", () => {
    const guard = createPauseSessionGuard();
    const token = guard.begin();

    expect(guard.hasActiveSession()).toBe(true);
    expect(guard.isActive(token)).toBe(true);
    expect(guard.complete(token)).toBe(true);
    expect(guard.hasActiveSession()).toBe(false);
    expect(guard.complete(token)).toBe(false);
  });

  it.each(["resume", "seek", "visibility-hidden", "window-blur", "reset"])(
    "rejects a late analysis after the %s boundary invalidates its session",
    () => {
      const guard = createPauseSessionGuard();
      const staleToken = guard.begin();

      guard.invalidate();

      expect(guard.isActive(staleToken)).toBe(false);
      expect(guard.complete(staleToken)).toBe(false);
    },
  );

  it("does not let an earlier promise complete a newer pause session", () => {
    const guard = createPauseSessionGuard();
    const firstToken = guard.begin();
    const secondToken = guard.begin();

    expect(guard.complete(firstToken)).toBe(false);
    expect(guard.isActive(secondToken)).toBe(true);
    expect(guard.complete(secondToken)).toBe(true);
  });

  it("keeps the active token when a duplicate pause event tries to start", () => {
    const guard = createPauseSessionGuard();
    const activeToken = guard.beginIfIdle();

    expect(activeToken).not.toBeNull();
    expect(guard.beginIfIdle()).toBeNull();
    expect(guard.isActive(activeToken!)).toBe(true);
    expect(guard.complete(activeToken!)).toBe(true);
  });
});
