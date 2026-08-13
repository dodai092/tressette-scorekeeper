# Trešeta: 3-Player Mode

## Purpose

Trešeta is traditionally played 4 players in 2 teams (current app support) but also has a
well-documented 3-player variant, played individually rather than in teams ("Ne igra se u
paru, nego svatko za sebe" — Croatian Wikipedia, Trešeta). This adds that variant as a
selectable option within the existing Trešeta mode.

## Rules (sourced from Croatian Wikipedia, matching PRODUCT.md's existing sourcing)

- Played individually — no teams, 3 players each score for themselves.
- All other rules are unchanged from the 2-team version: hand points still total exactly 11
  (`HAND_CAP`), akuže declarations (+3/+4) work the same way, target score is still a
  31/41/51 choice.
- (Card dealing/talon differences between 2-team and 3-player exist in real play but are out
  of scope — this app only scores points, it doesn't deal cards.)

## Architecture

New sibling files alongside the existing `treseta.js` / `TresetaBoard.jsx`, matching this
codebase's established pattern of one pure-logic module + one board component per variant:

- **`src/games/treseta3.js`** — pure logic for 3-player scoring, with zero imports (it's pure
  winner/totals logic only). `TresetaBoard3.jsx` imports `TARGET_SCORE_OPTIONS`, `HAND_CAP`, and
  `clamp11` directly from `treseta.js` instead. Adds:
  - `computeWinner3(scores, targetScore)` — `scores` is a 3-element array. Returns the winning
    player's INDEX (not name) once any player's score ≥ targetScore AND that player's score is
    strictly higher than both others. If the top score is tied between 2+ players (even if over
    target), returns `null` (match continues) — same tie-safe pattern as the existing 2-player
    `computeWinner`. Returning an index rather than a name is a deliberate deviation from the
    original plan, decided during implementation: it avoids an ambiguous name → index reverse
    lookup when two players share a display name.
  - `recalcTotals3(rounds)` — same newest-first backward-walk as `recalcTotals`, over
    `pts1/pts2/pts3` instead of `pts1/pts2`.
- **`src/games/TresetaBoard3.jsx`** — new board component, structurally mirroring
  `TresetaBoard.jsx` (hand-entry form, round history, reset/winner modals, banter integration)
  but built around 3 players instead of a hardcoded pair.

These stay separate files rather than generalizing `TresetaBoard.jsx` into an N-player
component — the 2-player board is a tight, already-correct unit, and forcing a shared
abstraction across a 2-entity and 3-entity UI would complicate the working code for no benefit
(YAGNI: there is no requirement for arbitrary N, only 2 and 3).

## State & persistence

A new persisted slice `treseta3` sits alongside the existing `treseta` and `briskula` slices
in the storage blob:

```js
treseta3: {
  targetScore: 41,
  playerNames: ["Igrač 1", "Igrač 2", "Igrač 3"],
  scores: [0, 0, 0],
  gamesWon: [0, 0, 0],
  rounds: [], // { id, pts1, pts2, pts3, total1, total2, total3, details, timestamp }
}
```

A new top-level field `tresetaPlayerCount` (`2` or `3`, default `2`) is persisted at the same
level as the mode switcher. `App.jsx` uses it to decide whether to mount `TresetaBoard`
(passing the existing `treseta` slice) or `TresetaBoard3` (passing the new `treseta3` slice) —
same "load/save the whole blob, pass each board its slice + `onUpdate`" pattern already used
for Trešeta vs. Briškula.

Because this changes the persisted shape, the storage key version bumps
(`tressette-scorekeeper-state-v2` → `v3`), consistent with the project's existing
"bump the version, don't write a migration" rule (`storage.js`). Old saved matches fall back
to defaults, same as any other shape change — this is a single-user local app, not worth
migrating.

**2-player and 3-player matches never share state.** Switching the toggle doesn't touch either
match's scores/history; each keeps accumulating independently, same as switching between
Trešeta and Briškula today.

## UI

- A "2 igrača / 3 igrača" segmented toggle appears at the top of Trešeta mode, next to the
  target-score selector. Changing it swaps which board (and which persisted slice) is shown;
  it does not reset either match.
- Three player cards laid out `grid-cols-3` (not stacked) so all three scores stay visible at a
  glance without scrolling — this app is used for quick taps between hands, and pushing the
  hand-entry form below the fold on every hand would hurt that.
- `TeamCard` (`src/components/TeamCard.jsx`) gains:
  - A `compact` boolean prop: when true, shrinks the score text (`text-5xl` → smaller) and
    tightens padding so 3 cards fit comfortably on a phone width. Used only by `TresetaBoard3`;
    `TresetaBoard`/`BriskulaBoard` are unaffected (prop defaults to falsy). Akuže buttons are
    already single-line for `TresetaBoard3` simply because it never passes a `top` value in
    `quickAmounts` (same as the 2-player board) — the single-line rendering isn't a
    `compact`-conditional behavior, it's the existing `quickAmounts` shape reused as-is.
  - A third entry in `TEAM_ACCENTS` (`green`) for Player 3, alongside the existing `blue`/`red`
    used for Players 1/2 — keeps 2-player mode's color language consistent.
- Hand entry: two number inputs (Player 1, Player 2, each 0–11), Player 3's points shown as an
  auto-computed read-only badge (`11 − p1 − p2`). Submit is disabled/no-ops if `p1 + p2 > 11`
  (mirrors the existing `clamp11` guard pattern). This directly extends today's 2-player
  auto-fill entry (P1 free, P2 auto-fills to `11 − P1`).
- Akuže: same +3/+4 quick-add buttons as today, one set per player card, each writing to that
  player's own point total for the round.
- Round history table: same newest-first list, now with 3 score columns instead of 2 (row
  layout/column spans and font size adjusted to fit); same undo-last / delete-any-round /
  recalculate-from-history behavior as the 2-player board.
- Winner modal: same trophy modal and copy pattern, naming whichever player won.
- Banter: unchanged mechanics — triggers when the gap between the leading and trailing player
  crosses `BANTER_GAP_THRESHOLD(targetScore)` (reusing the existing threshold function), shown
  as the same generic taunt-line overlay (banter lines aren't team/player-specific today, so no
  change needed there).

## Edge cases

- **Simultaneous target-crossing by 2+ players in the same hand:** if the top score is tied,
  no winner yet — match continues until someone is strictly ahead. Same rule as 2-player mode,
  generalized to "top score among 3 is unique."
- **Undo / delete-a-round:** `recalcTotals3` rebuilds all three running totals from full
  history on every mutation (not incremental patching), same safety property as `recalcTotals`.
- **Invalid hand entry:** if `p1 + p2 > 11`, the derived `p3` badge would go negative — submit
  is blocked in that state (same spirit as the existing `clamp11` bound on the 2-player input).
- **New Game / reset:** resets `treseta3` scores and rounds only; `gamesWon` persists across
  games (matches existing 2-player `resetGame` behavior — games-won accumulates until
  storage is cleared).

## Out of scope

- Card dealing, talon, or trick-play simulation — this app only records points, as today.
- Any change to Briškula or to the existing 2-player Trešeta scoring/UI behavior.
- Any player count other than 2 or 3.

## Testing

No automated test suite in this project (per `CLAUDE.md`). Verification is manual via the dev
server (`npm run dev`), exercising: toggling 2↔3 players preserves both matches' state
independently; entering hand scores that sum to 11 across 3 players; akuže quick-add per
player; a 3-way race to target score including a tied-at-target case (no winner declared);
undo/delete-a-round recalculating all 3 totals correctly; reload preserves 3-player match state
via the bumped storage version.
