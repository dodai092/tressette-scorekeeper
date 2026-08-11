export const PARTIJA_POOL = 120;
export const WIN_THRESHOLD = 61;
export const PARTIJE_PER_MATCH = 4;

// Card point values for the running quick-add entry (40-card Triestine
// deck; the six "worthless" ranks — 7 6 5 4 2 — score 0 and aren't
// buttons). `short` is the compact button label (narrow enough for a
// mobile breakpoint); `name` is the full word used in history entries.
export const CARD_POINTS = [
  { name: "Ace", short: "A", value: 11 },
  { name: "Three", short: "3", value: 10 },
  { name: "King", short: "K", value: 4 },
  { name: "Knight", short: "C", value: 3 },
  { name: "Jack", short: "F", value: 2 },
];

// ~35% of the 120-point pool, so the mid-game jab threshold means
// roughly the same "meaningfully behind" feeling as Trešeta's does
// against its own target.
export const BANTER_GAP_THRESHOLD = Math.round(PARTIJA_POOL * 0.35);

// A partija ends once either side reaches 61+ (already won, no need to
// wait for the last card) or once all 120 points have been distributed.
// Returns the winning team's name, or null if the partija is still
// in progress or ended in an exact split tie.
export const computePartijaWinner = (updated1, updated2, team1Name, team2Name) => {
  const total = updated1 + updated2;
  const decided = updated1 >= WIN_THRESHOLD || updated2 >= WIN_THRESHOLD || total >= PARTIJA_POOL;
  if (!decided) return null;
  if (updated1 === updated2) return null;
  return updated1 > updated2 ? team1Name : team2Name;
};

// Match status after PARTIJE_PER_MATCH partije have been played. A tie
// (2-2) leaves matchWinner null — best-of-4 has no natural tiebreak,
// so the app just reports the deadlock rather than inventing a rule.
export const computeMatchStatus = (partijeWon1, partijeWon2, team1Name, team2Name) => {
  const played = partijeWon1 + partijeWon2;
  if (played < PARTIJE_PER_MATCH) {
    return { matchWinner: null, sweep: false, matchOver: false, tied: false };
  }
  if (partijeWon1 === partijeWon2) {
    return { matchWinner: null, sweep: false, matchOver: true, tied: true };
  }
  const matchWinner = partijeWon1 > partijeWon2 ? team1Name : team2Name;
  const sweep = partijeWon1 === PARTIJE_PER_MATCH || partijeWon2 === PARTIJE_PER_MATCH;
  return { matchWinner, sweep, matchOver: true, tied: false };
};

// rounds is newest-first (index 0 = most recent), scoped to the current
// partija. Recomputes running totals bottom-up, same shape as Trešeta's
// recalcTotals so undo/delete can reuse the same pattern.
export const recalcPartijaTotals = (rounds) => {
  let run1 = 0;
  let run2 = 0;
  const recalculated = new Array(rounds.length);
  for (let i = rounds.length - 1; i >= 0; i--) {
    run1 += rounds[i].pts1;
    run2 += rounds[i].pts2;
    recalculated[i] = { ...rounds[i], total1: run1, total2: run2 };
  }
  return { rounds: recalculated, total1: run1, total2: run2 };
};
