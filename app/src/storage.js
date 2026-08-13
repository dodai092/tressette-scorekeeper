// Bumped to v3 to add the treseta3 (3-player) slice and the
// tresetaPlayerCount toggle. Old v2 data is discarded rather than
// migrated, same rationale as the v1 -> v2 bump above.
const STORAGE_KEY = "tressette-scorekeeper-state-v3";

export const DEFAULT_TRESETA_STATE = {
  targetScore: 41,
  scoreTeam1: 0,
  scoreTeam2: 0,
  gamesWon1: 0,
  gamesWon2: 0,
  rounds: [],
};

export const DEFAULT_TRESETA3_STATE = {
  targetScore: 41,
  playerNames: ["Igrač 1", "Igrač 2", "Igrač 3"],
  scores: [0, 0, 0],
  gamesWon: [0, 0, 0],
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
  team1Name: "Posedarje",
  team2Name: "Zagreb",
  tresetaPlayerCount: 2,
  treseta: DEFAULT_TRESETA_STATE,
  treseta3: DEFAULT_TRESETA3_STATE,
  briskula: DEFAULT_BRISKULA_STATE,
};

const isValidShape = (parsed) =>
  parsed &&
  typeof parsed === "object" &&
  (parsed.activeMode === "treseta" || parsed.activeMode === "briskula") &&
  typeof parsed.treseta === "object" &&
  typeof parsed.treseta3 === "object" &&
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
      treseta3: { ...DEFAULT_TRESETA3_STATE, ...parsed.treseta3 },
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
