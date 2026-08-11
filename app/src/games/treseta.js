export const TARGET_SCORE_OPTIONS = [31, 41, 51];
export const HAND_CAP = 11;

// ~35% of the target score, so the mid-game jab threshold scales with
// whichever target is in play instead of a flat magic number.
export const BANTER_GAP_THRESHOLD = (targetScore) => Math.round(targetScore * 0.35);

// Returns the winning team's name once one side has reached targetScore
// with a strictly higher total than the other, otherwise null.
export const computeWinner = (updated1, updated2, targetScore, team1Name, team2Name) => {
  if (updated1 < targetScore && updated2 < targetScore) return null;
  if (updated1 === updated2) return null;
  return updated1 > updated2 ? team1Name : team2Name;
};

// rounds is newest-first (index 0 = most recent). Recomputes running
// totals bottom-up and returns them in the same newest-first order.
export const recalcTotals = (rounds) => {
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

export const clamp11 = (n) => Math.min(HAND_CAP, Math.max(0, n));
