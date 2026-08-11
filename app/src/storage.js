// Bumped to v2 for the nested per-mode schema (flat v1 shape is
// discarded rather than migrated — single-user personal app, not worth
// migration logic for one stale localStorage entry).
const STORAGE_KEY = "tressette-scorekeeper-state-v2";

export const DEFAULT_TRESETA_STATE = {
  targetScore: 41,
  scoreTeam1: 0,
  scoreTeam2: 0,
  gamesWon1: 0,
  gamesWon2: 0,
  rounds: [],
};

export const DEFAULT_BRISKULA_STATE = {
  scoreTeam1: 0,
  scoreTeam2: 0,
  rounds: [],
  partijeWon1: 0,
  partijeWon2: 0,
  currentPartija: 1,
  completedPartije: [],
};

const DEFAULT_STATE = {
  activeMode: "treseta",
  team1Name: "Mi",
  team2Name: "Oni",
  treseta: DEFAULT_TRESETA_STATE,
  briskula: DEFAULT_BRISKULA_STATE,
};

const isValidShape = (parsed) =>
  parsed &&
  typeof parsed === "object" &&
  (parsed.activeMode === "treseta" || parsed.activeMode === "briskula") &&
  typeof parsed.treseta === "object" &&
  typeof parsed.briskula === "object";

export const loadPersistedState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (!isValidShape(parsed)) return DEFAULT_STATE;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      treseta: { ...DEFAULT_TRESETA_STATE, ...parsed.treseta },
      briskula: { ...DEFAULT_BRISKULA_STATE, ...parsed.briskula },
    };
  } catch {
    return DEFAULT_STATE;
  }
};

export const savePersistedState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (e.g. private mode) — fail silently.
  }
};
