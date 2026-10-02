/**
 * Durable pending-delivery queue for deferred ad tasks.
 *
 * S2 defers an ad when a pause is unstable or no safe position exists. Instead
 * of only showing "deferred" text, the task is recorded here and fulfilled by
 * the next eligible opportunity: another stable S2 pause, or an S1
 * low-disruption window. S3 protected content never fulfils a task.
 *
 * Storage is best-effort (localStorage may be unavailable); the in-memory
 * state is always authoritative for the current page.
 */

export type DeliveryChannel = "s2-stable-pause" | "s1-low-disruption";

export type DeliveryTask = {
  id: string;
  campaign: string;
  durationSec: number;
  reason: string;
  createdAt: number;
  expiresAt: number;
  status: "pending" | "delivered" | "expired";
  deliveredAt?: number;
  deliveredVia?: DeliveryChannel;
};

export type DeliveryQueueState = {
  tasks: DeliveryTask[];
};

const STORAGE_KEY = "admind-delivery-queue-v1";
export const TASK_TTL_MS = 30 * 60 * 1000;
export const MAX_TASKS = 12;

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

function isTask(value: unknown): value is DeliveryTask {
  if (!value || typeof value !== "object") return false;
  const task = value as Record<string, unknown>;
  return typeof task.id === "string"
    && typeof task.campaign === "string"
    && typeof task.durationSec === "number"
    && typeof task.reason === "string"
    && typeof task.createdAt === "number"
    && typeof task.expiresAt === "number"
    && (task.status === "pending" || task.status === "delivered" || task.status === "expired");
}

export function expireTasks(state: DeliveryQueueState, now: number): DeliveryQueueState {
  let changed = false;
  const tasks = state.tasks.map((task) => {
    if (task.status === "pending" && task.expiresAt <= now) {
      changed = true;
      return { ...task, status: "expired" as const };
    }
    return task;
  });
  return changed ? { tasks } : state;
}

export function enqueueTask(
  state: DeliveryQueueState,
  input: { id: string; campaign: string; durationSec: number; reason: string },
  now: number,
): DeliveryQueueState {
  const current = expireTasks(state, now);
  // One pause session can only create one task; repeated deferral events for
  // the same session must not inflate the queue.
  if (current.tasks.some((task) => task.id === input.id)) return current;
  // A campaign that is already waiting stays one task, however many times the
  // viewer pauses and resumes before it can be delivered.
  if (current.tasks.some((task) => task.status === "pending" && task.campaign === input.campaign)) return current;
  const task: DeliveryTask = {
    ...input,
    createdAt: now,
    expiresAt: now + TASK_TTL_MS,
    status: "pending",
  };
  return { tasks: [task, ...current.tasks].slice(0, MAX_TASKS) };
}

/** Fulfils the oldest pending task. Returns the same state when none is pending. */
export function fulfilOldest(state: DeliveryQueueState, via: DeliveryChannel, now: number): DeliveryQueueState {
  const current = expireTasks(state, now);
  const pending = current.tasks.filter((task) => task.status === "pending");
  if (!pending.length) return current;
  const oldest = pending.reduce((left, right) => (right.createdAt < left.createdAt ? right : left));
  return {
    tasks: current.tasks.map((task) => task.id === oldest.id
      ? { ...task, status: "delivered" as const, deliveredAt: now, deliveredVia: via }
      : task),
  };
}

export function pendingCount(state: DeliveryQueueState) {
  return state.tasks.filter((task) => task.status === "pending").length;
}

export function loadQueue(storage: Storage | undefined, now: number): DeliveryQueueState {
  if (!storage) return { tasks: [] };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { tasks: [] };
    const parsed: unknown = JSON.parse(raw);
    const tasks = Array.isArray((parsed as DeliveryQueueState)?.tasks)
      ? (parsed as DeliveryQueueState).tasks.filter(isTask).slice(0, MAX_TASKS)
      : [];
    return expireTasks({ tasks }, now);
  } catch {
    return { tasks: [] };
  }
}

export function saveQueue(storage: Storage | undefined, state: DeliveryQueueState) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked; the in-memory queue stays authoritative.
  }
}

/* A tiny external store so S1 and S2 (separate components) share one queue. */
type Listener = () => void;
let state: DeliveryQueueState = { tasks: [] };
let hydrated = false;
const listeners = new Set<Listener>();

function browserStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function commit(next: DeliveryQueueState) {
  if (next === state) return;
  state = next;
  saveQueue(browserStorage(), state);
  listeners.forEach((listener) => listener());
}

export const deliveryQueue = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): DeliveryQueueState {
    if (!hydrated && typeof window !== "undefined") {
      hydrated = true;
      state = loadQueue(browserStorage(), Date.now());
    }
    return state;
  },
  getServerSnapshot(): DeliveryQueueState {
    return EMPTY;
  },
  enqueue(input: { id: string; campaign: string; durationSec: number; reason: string }) {
    commit(enqueueTask(deliveryQueue.getSnapshot(), input, Date.now()));
  },
  fulfil(via: DeliveryChannel) {
    commit(fulfilOldest(deliveryQueue.getSnapshot(), via, Date.now()));
  },
  clear() {
    commit({ tasks: [] });
  },
};

const EMPTY: DeliveryQueueState = { tasks: [] };
