export type PauseSessionToken = number;

export type PauseSessionGuard = {
  begin: () => PauseSessionToken;
  beginIfIdle: () => PauseSessionToken | null;
  complete: (token: PauseSessionToken) => boolean;
  hasActiveSession: () => boolean;
  invalidate: () => void;
  isActive: (token: PauseSessionToken) => boolean;
};

/**
 * Owns the lifetime of one pause-analysis attempt.
 *
 * Browser vision promises cannot be canceled once MediaPipe starts. Consumers
 * therefore invalidate the current token on every interaction boundary and
 * accept a result only when `complete` consumes the same live token.
 */
export function createPauseSessionGuard(): PauseSessionGuard {
  let generation = 0;
  let activeToken: PauseSessionToken | null = null;

  return {
    begin() {
      generation += 1;
      activeToken = generation;
      return activeToken;
    },
    beginIfIdle() {
      if (activeToken !== null) return null;
      generation += 1;
      activeToken = generation;
      return activeToken;
    },
    complete(token) {
      if (activeToken !== token) return false;
      activeToken = null;
      return true;
    },
    hasActiveSession() {
      return activeToken !== null;
    },
    invalidate() {
      generation += 1;
      activeToken = null;
    },
    isActive(token) {
      return activeToken === token;
    },
  };
}
