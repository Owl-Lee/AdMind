import { describe, expect, it } from "vitest";
import {
  MAX_TASKS,
  TASK_TTL_MS,
  enqueueTask,
  expireTasks,
  fulfilOldest,
  loadQueue,
  pendingCount,
  saveQueue,
  type DeliveryQueueState,
} from "./delivery-queue";

const empty: DeliveryQueueState = { tasks: [] };
const task = (id: string) => ({ id, campaign: "game-ad", durationSec: 6, reason: "暂停未稳定" });

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe("delivery queue", () => {
  it("records one pending task per pause session", () => {
    let state = enqueueTask(empty, task("pause-1"), 1_000);
    state = enqueueTask(state, task("pause-1"), 2_000);
    expect(state.tasks).toHaveLength(1);
    expect(pendingCount(state)).toBe(1);
    expect(state.tasks[0]).toMatchObject({ status: "pending", createdAt: 1_000, expiresAt: 1_000 + TASK_TTL_MS });
  });

  it("keeps one pending task per campaign across repeated deferrals", () => {
    let state = enqueueTask(empty, task("pause-1"), 1_000);
    state = enqueueTask(state, task("pause-2"), 2_000);
    expect(pendingCount(state)).toBe(1);
    state = fulfilOldest(state, "s2-stable-pause", 3_000);
    state = enqueueTask(state, task("pause-3"), 4_000);
    expect(pendingCount(state)).toBe(1);
    expect(state.tasks).toHaveLength(2);
  });

  it("fulfils the oldest pending task first and records the channel", () => {
    let state = enqueueTask(empty, task("a"), 1_000);
    state = enqueueTask(state, { ...task("b"), campaign: "other" }, 2_000);
    state = fulfilOldest(state, "s1-low-disruption", 3_000);
    const delivered = state.tasks.find((item) => item.id === "a");
    expect(delivered).toMatchObject({ status: "delivered", deliveredAt: 3_000, deliveredVia: "s1-low-disruption" });
    expect(state.tasks.find((item) => item.id === "b")?.status).toBe("pending");
  });

  it("does nothing when no task is pending", () => {
    const state = fulfilOldest(empty, "s2-stable-pause", 1_000);
    expect(state).toBe(empty);
  });

  it("expires stale tasks instead of delivering them", () => {
    let state = enqueueTask(empty, task("old"), 0);
    state = fulfilOldest(state, "s2-stable-pause", TASK_TTL_MS + 1);
    expect(state.tasks[0].status).toBe("expired");
    expect(state.tasks[0].deliveredVia).toBeUndefined();
    expect(expireTasks(state, TASK_TTL_MS + 2)).toBe(state);
  });

  it("bounds the queue size", () => {
    let state = empty;
    for (let index = 0; index < MAX_TASKS + 5; index += 1) state = enqueueTask(state, { ...task(`t${index}`), campaign: `c${index}` }, index);
    expect(state.tasks).toHaveLength(MAX_TASKS);
  });

  it("round-trips through storage and ignores malformed data", () => {
    const storage = memoryStorage();
    const state = enqueueTask(empty, task("keep"), 5_000);
    saveQueue(storage, state);
    expect(loadQueue(storage, 6_000).tasks.map((item) => item.id)).toEqual(["keep"]);

    storage.setItem("admind-delivery-queue-v1", "{not json");
    expect(loadQueue(storage, 6_000)).toEqual({ tasks: [] });

    storage.setItem("admind-delivery-queue-v1", JSON.stringify({ tasks: [{ id: 1 }, { ...state.tasks[0] }] }));
    expect(loadQueue(storage, 6_000).tasks).toHaveLength(1);
  });

  it("survives a storage that throws", () => {
    const throwing = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    expect(loadQueue(throwing, 0)).toEqual({ tasks: [] });
    expect(() => saveQueue(throwing, enqueueTask(empty, task("x"), 0))).not.toThrow();
  });
});
