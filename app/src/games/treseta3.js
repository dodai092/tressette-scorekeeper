// Pure scoring logic for Trešeta's 3-player variant (individual play,
// not teams — see docs/superpowers/specs/2026-08-13-treseta-3-player-design.md).
// HAND_CAP, TARGET_SCORE_OPTIONS, clamp11 and BANTER_GAP_THRESHOLD are
// shared with the 2-player module (same underlying game, same scoring
// range) — only the winner/totals logic differs because there are 3
// entities instead of 2.

// scores is a 3-element array, indexed 0/1/2 for Player 1/2/3. Returns
// the winning player's index once someone has reached targetScore with
// a score strictly higher than both others, otherwise null — mirrors
// computeWinner's tie-safe behavior in treseta.js (if the top score is
// shared by 2+ players, no winner yet). Returns an index rather than a
// name so callers never need a name -> index reverse lookup, which
// would be ambiguous if two players share a display name.
export const computeWinner3 = (scores, targetScore) => {
  const max = Math.max(...scores);
  if (max < targetScore) return null;
  const leaders = scores.filter((s) => s === max);
  if (leaders.length > 1) return null;
  return scores.indexOf(max);
};

// rounds is newest-first (index 0 = most recent), each entry has
// pts1/pts2/pts3. Recomputes running totals bottom-up and returns them
// in the same newest-first order, mirroring recalcTotals from treseta.js.
export const recalcTotals3 = (rounds) => {
  let run1 = 0;
  let run2 = 0;
  let run3 = 0;
  const recalculated = new Array(rounds.length);
  for (let i = rounds.length - 1; i >= 0; i--) {
    run1 += rounds[i].pts1;
    run2 += rounds[i].pts2;
    run3 += rounds[i].pts3;
    recalculated[i] = { ...rounds[i], total1: run1, total2: run2, total3: run3 };
  }
  return { rounds: recalculated, total1: run1, total2: run2, total3: run3 };
};
