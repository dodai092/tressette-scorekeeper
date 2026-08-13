# Trešeta 3-Player Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a selectable 3-player (individual-play) variant to Trešeta mode, alongside the existing 2-team mode, with its own independent persisted match state.

**Architecture:** New sibling files mirroring the existing per-mode pattern (pure logic module + board component): `treseta3.js` (winner/totals logic for 3 entities) and `TresetaBoard3.jsx` (board UI). `TeamCard.jsx` gains a `compact` size variant and a third (`green`) accent so 3 cards fit a phone width side-by-side. `storage.js` gains a `treseta3` slice and a `tresetaPlayerCount` toggle, with a version bump since the persisted shape changes. `App.jsx` renders a player-count toggle inside Trešeta mode and mounts `TresetaBoard` or `TresetaBoard3` accordingly.

**Tech Stack:** React 19 + Vite, Tailwind v4 (CSS-first, no config file), no test framework (verify manually via `npm run dev` per project convention — see Global Constraints).

**Spec:** `docs/superpowers/specs/2026-08-13-treseta-3-player-design.md`

## Global Constraints

- No automated test suite exists in this project (`CLAUDE.md`) — every task's verification step is either a throwaway Node sanity check (deleted before commit, pure-logic tasks only) or manual exercise via `npm run dev` in the browser. Do not add a test framework.
- UI language is Croatian; match the existing register (`CLAUDE.md`).
- Hand points always total exactly `HAND_CAP` (11), from `treseta.js` — never redefine this constant elsewhere.
- Target score is always one of `TARGET_SCORE_OPTIONS` (31/41/51) from `treseta.js` — reuse, don't redefine.
- `rounds` arrays are always newest-first (index 0 = most recent); running totals are always rebuilt bottom-up from full history on every mutation, never patched incrementally (`CLAUDE.md`).
- Tap targets stay at least `min-h-11` (44px) even in the new `compact` `TeamCard` variant — shrink padding/fonts, never button hit area (`PRODUCT.md` accessibility note; this was previously a fixed bug per git history, don't regress it).
- Trešeta 2-player and Briškula scoring logic/state must not be modified or bled into by this feature — only additive changes.
- When the persisted state shape changes, bump the storage key version; do not write migration logic (`storage.js` existing convention).

---

### Task 1: `treseta3.js` — 3-player scoring logic

**Files:**
- Create: `app/src/games/treseta3.js`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces: `computeWinner3(scores, targetScore)` → `number | null` (winning player's **index**, not name — avoids a duplicate-name bug where two players share a display name). `recalcTotals3(rounds)` → `{ rounds, total1, total2, total3 }`. Both consumed by Task 4 (`TresetaBoard3.jsx`).

- [ ] **Step 1: Write `treseta3.js`**

```js
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
```

- [ ] **Step 2: Sanity-check the logic with a throwaway Node script**

Run this from `app/` (no test framework in this project — this script is not committed):

```bash
cd app && node --input-type=module -e "
import { computeWinner3, recalcTotals3 } from './src/games/treseta3.js';
import assert from 'node:assert';

// No winner below target
assert.strictEqual(computeWinner3([10, 20, 15], 41), null);
// Clear winner at/above target (index 0)
assert.strictEqual(computeWinner3([41, 30, 20], 41), 0);
// Tie at the top over target: no winner yet
assert.strictEqual(computeWinner3([41, 41, 10], 41), null);
// Third player wins (index 2)
assert.strictEqual(computeWinner3([10, 20, 45], 41), 2);

// recalcTotals3 walks newest-first history backward correctly
const rounds = [
  { id: 2, pts1: 5, pts2: 6, pts3: 0 }, // most recent
  { id: 1, pts1: 3, pts2: 0, pts3: 8 }, // oldest
];
const result = recalcTotals3(rounds);
assert.strictEqual(result.total1, 8);
assert.strictEqual(result.total2, 6);
assert.strictEqual(result.total3, 8);
assert.strictEqual(result.rounds[0].total1, 8); // most recent row shows running total
assert.strictEqual(result.rounds[1].total1, 3); // oldest row shows its own cumulative total

console.log('treseta3.js: all checks passed');
"
```

Expected output: `treseta3.js: all checks passed`. If any `assert` throws, fix `treseta3.js` before continuing.

- [ ] **Step 3: Commit**

```bash
cd /Users/antunzebec/Work/01.Clients/xxx
git add app/src/games/treseta3.js
git commit -m "$(cat <<'EOF'
Add 3-player Trešeta scoring logic

Pure winner/totals functions for individual (non-team) play, mirroring
treseta.js's tie-safe winner detection and backward-walk totals
recalculation, generalized from 2 to 3 entities.
EOF
)"
```

---

### Task 2: `storage.js` — persisted `treseta3` slice and player-count toggle

**Files:**
- Modify: `app/src/storage.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `DEFAULT_TRESETA3_STATE` (shape: `{ targetScore, playerNames: [string,string,string], scores: [number,number,number], gamesWon: [number,number,number], rounds: [] }`), consumed by Task 5 (`App.jsx`). `loadPersistedState()` return value now includes `tresetaPlayerCount: 2|3` and `treseta3: DEFAULT_TRESETA3_STATE`-shaped object, consumed by Task 5.

- [ ] **Step 1: Read the current file to confirm line numbers**

Run: `cat -n app/src/storage.js` and locate the exact lines for `STORAGE_KEY`, `DEFAULT_TRESETA_STATE`, `DEFAULT_STATE`, and `isValidShape` before editing (the plan below assumes the shape read during planning; re-verify before editing since line numbers may have shifted).

- [ ] **Step 2: Bump the storage key version**

Change:
```js
// Bumped to v2 for the nested per-mode schema (flat v1 shape is
// discarded rather than migrated — single-user personal app, not worth
// migration logic for one stale localStorage entry).
const STORAGE_KEY = "tressette-scorekeeper-state-v2";
```
to:
```js
// Bumped to v3 to add the treseta3 (3-player) slice and the
// tresetaPlayerCount toggle. Old v2 data is discarded rather than
// migrated, same rationale as the v1 -> v2 bump above.
const STORAGE_KEY = "tressette-scorekeeper-state-v3";
```

- [ ] **Step 3: Add `DEFAULT_TRESETA3_STATE`**

Add immediately after `DEFAULT_TRESETA_STATE`:

```js
export const DEFAULT_TRESETA3_STATE = {
  targetScore: 41,
  playerNames: ["Igrač 1", "Igrač 2", "Igrač 3"],
  scores: [0, 0, 0],
  gamesWon: [0, 0, 0],
  rounds: [],
};
```

- [ ] **Step 4: Add `tresetaPlayerCount` and `treseta3` to `DEFAULT_STATE`**

Change:
```js
const DEFAULT_STATE = {
  activeMode: "treseta",
  team1Name: "Posedarje",
  team2Name: "Zagreb",
  treseta: DEFAULT_TRESETA_STATE,
  briskula: DEFAULT_BRISKULA_STATE,
};
```
to:
```js
const DEFAULT_STATE = {
  activeMode: "treseta",
  team1Name: "Posedarje",
  team2Name: "Zagreb",
  tresetaPlayerCount: 2,
  treseta: DEFAULT_TRESETA_STATE,
  treseta3: DEFAULT_TRESETA3_STATE,
  briskula: DEFAULT_BRISKULA_STATE,
};
```

- [ ] **Step 5: Extend `isValidShape` and `loadPersistedState`**

Change:
```js
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
```
to:
```js
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
```

`savePersistedState` is unchanged — it already serializes whatever object it's given.

- [ ] **Step 6: Sanity-check with a throwaway Node script**

```bash
cd app && node --input-type=module -e "
import { DEFAULT_TRESETA3_STATE } from './src/storage.js';
import assert from 'node:assert';
assert.strictEqual(DEFAULT_TRESETA3_STATE.scores.length, 3);
assert.strictEqual(DEFAULT_TRESETA3_STATE.playerNames.length, 3);
assert.strictEqual(DEFAULT_TRESETA3_STATE.rounds.length, 0);
console.log('storage.js: DEFAULT_TRESETA3_STATE shape OK');
"
```

Note: `storage.js` reads `window.localStorage` inside `loadPersistedState`/`savePersistedState`, so those two functions can't run under plain Node — the check above only verifies the new default export's shape, which is what this task adds. Full `loadPersistedState`/`savePersistedState` behavior (including the version bump taking effect and old data being dropped) is verified in Task 5's manual browser check.

- [ ] **Step 7: Commit**

```bash
cd /Users/antunzebec/Work/01.Clients/xxx
git add app/src/storage.js
git commit -m "$(cat <<'EOF'
Add treseta3 persisted slice and player-count toggle to storage

Bumps the storage key to v3 (new shape, no migration per existing
convention) and adds DEFAULT_TRESETA3_STATE plus a tresetaPlayerCount
field so 3-player Trešeta matches persist independently of the
existing 2-player and Briškula state.
EOF
)"
```

---

### Task 3: `TeamCard.jsx` — compact size variant and green accent

**Files:**
- Modify: `app/src/components/TeamCard.jsx`

**Interfaces:**
- Consumes: nothing new (existing props unchanged).
- Produces: new optional prop `compact` (boolean, default `false`) and new `TEAM_ACCENTS.green` entry, both consumed by Task 4 (`TresetaBoard3.jsx`). `TresetaBoard.jsx`/`BriskulaBoard.jsx` continue to work unmodified since `compact` defaults to `false` and `blue`/`red` accents are untouched.

- [ ] **Step 1: Add the `green` accent**

In `TEAM_ACCENTS`, after the `red` entry, add:

```js
  green: {
    label: "text-emerald-800",
    text: "text-emerald-900",
    border: "border-emerald-200 focus:border-emerald-600",
    ring: "focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1",
    gamesWon: "text-emerald-900",
    quickBtn: "bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300/60",
  },
```

- [ ] **Step 2: Add the `compact` prop and shrink padding/fonts when set**

Replace the whole component function with:

```jsx
export default function TeamCard({
  icon,
  label,
  name,
  onNameChange,
  namePlaceholder,
  score,
  scoreSuffix,
  wonLabel,
  wonCount,
  accentColor,
  onQuickAdd,
  quickAmounts,
  quickAddHeading,
  disabled,
  compact = false,
}) {
  const accent = TEAM_ACCENTS[accentColor];

  return (
    <div
      className={`bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-3xl border-2 border-amber-300/80 shadow-xl relative flex flex-col justify-between text-slate-900 ${
        compact ? "p-2.5" : "p-4"
      }`}
    >
      <div className={compact ? "space-y-1.5" : "space-y-3"}>
        <div>
          <label
            className={`text-[9px] uppercase font-bold ${accent.label} tracking-wider flex items-center gap-1 mb-0.5 font-mono`}
          >
            <span>{icon}</span> {label}
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className={`bg-transparent font-black ${
                compact ? "text-sm" : "text-xl"
              } ${accent.text} tracking-tight w-full outline-none border-b border-dashed ${accent.border} ${accent.ring} rounded-sm py-0.5 pr-5 font-serif`}
              placeholder={namePlaceholder}
              aria-label={`${label} name`}
            />
            <Pencil
              size={11}
              className="absolute right-0 top-1.5 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        <div className="text-center py-1">
          <span
            key={score}
            className={`motion-score-pop ${
              compact ? "text-3xl" : "text-5xl"
            } font-black tracking-tight text-slate-950 font-serif drop-shadow-sm inline-block`}
            style={{ animation: "score-pop 320ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            {score}
          </span>
          <p className="text-[10px] uppercase font-bold tracking-widest text-amber-800/70 font-mono mt-0.5">
            {scoreSuffix}
          </p>
          <p className="text-[10px] text-slate-600 mt-1 font-medium">
            {wonLabel}: <strong className={accent.gamesWon}>{wonCount}</strong>
          </p>
        </div>
      </div>

      {quickAmounts && quickAmounts.length > 0 && (
        <div
          className={`border-t border-amber-200/80 space-y-1 ${
            compact ? "pt-1.5 mt-1.5" : "pt-2 mt-2"
          }`}
        >
          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
            {quickAddHeading}
          </span>
          <div className="flex items-center gap-1.5 justify-between">
            {quickAmounts.map(({ value, top, bottom }) => (
              <button
                key={value}
                onClick={() => onQuickAdd(value)}
                disabled={disabled}
                className={`flex-1 min-h-11 ${accent.quickBtn} font-bold rounded-xl active:scale-95 transition shadow-sm disabled:opacity-40 disabled:active:scale-100 ${
                  top ? "flex flex-col items-center justify-center leading-tight py-1" : "text-xs"
                }`}
              >
                {top ? (
                  <>
                    <span className="text-sm">{top}</span>
                    <span className="text-[10px] opacity-80">{bottom}</span>
                  </>
                ) : (
                  bottom
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

Note the quick-add buttons keep `min-h-11` unconditionally (Global Constraints — tap targets never shrink below 44px, only surrounding padding/fonts do).

- [ ] **Step 3: Manually verify the existing 2-player and Briškula cards are unaffected**

```bash
cd app && npm run dev
```

Open the dev server URL, check both Trešeta and Briškula modes render their team cards exactly as before (they pass no `compact` prop, so it defaults to `false` — visually identical to pre-change). Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 4: Lint**

```bash
cd app && npm run lint
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/antunzebec/Work/01.Clients/xxx
git add app/src/components/TeamCard.jsx
git commit -m "$(cat <<'EOF'
Add compact size variant and green accent to TeamCard

Prepares the shared scorecard component for 3-player Trešeta: a third
accent color for Player 3, and a compact prop that shrinks padding and
font sizes (never tap-target height) so three cards fit a phone width
side-by-side. No visual change to existing 2-player/Briškula usage —
compact defaults to false and blue/red are untouched.
EOF
)"
```

---

### Task 4: `TresetaBoard3.jsx` — 3-player board component

**Files:**
- Create: `app/src/games/TresetaBoard3.jsx`

**Interfaces:**
- Consumes: `computeWinner3`, `recalcTotals3` from `./treseta3.js` (Task 1); `TARGET_SCORE_OPTIONS`, `HAND_CAP`, `clamp11` from `./treseta.js`; `TeamCard` with `compact` prop and `green` accent (Task 3); `state` prop shaped like `DEFAULT_TRESETA3_STATE` (Task 2) — `{ targetScore, playerNames: [p1,p2,p3], scores: [s1,s2,s3], gamesWon: [g1,g2,g3], rounds }`; `onUpdate(partial)` setter; `soundEnabled`, `banterEnabled` booleans.
- Produces: default export `TresetaBoard3` component, consumed by Task 5 (`App.jsx`).

- [ ] **Step 1: Write `TresetaBoard3.jsx`**

```jsx
import { useState } from "react";
import {
  Trophy,
  RotateCcw,
  History,
  RefreshCw,
  ListOrdered,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { playSound } from "../sound.js";
import { BANTER_LINES, pickRandom } from "../banter.js";
import TeamCard from "../components/TeamCard.jsx";
import BanterOverlay from "../components/BanterOverlay.jsx";
import { MODE_ACCENTS } from "../modeAccents.js";
import {
  TARGET_SCORE_OPTIONS,
  HAND_CAP,
  BANTER_GAP_THRESHOLD,
  clamp11,
} from "./treseta.js";
import { computeWinner3, recalcTotals3 } from "./treseta3.js";

const PLAYER_ACCENTS = ["blue", "red", "green"];
const PLAYER_ICONS = ["⚔️", "🍷", "🎯"];

export default function TresetaBoard3({ soundEnabled, banterEnabled, state, onUpdate }) {
  const { targetScore, playerNames, scores, gamesWon, rounds } = state;

  const accent = MODE_ACCENTS.treseta;

  // Two free inputs (Player 1, Player 2); Player 3's points are derived
  // as HAND_CAP - p1 - p2, mirroring the 2-player board's single-input
  // auto-fill pattern.
  const [customPts1, setCustomPts1] = useState("");
  const [customPts2, setCustomPts2] = useState("");

  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [tieNotice, setTieNotice] = useState(false);

  const [banterJab, setBanterJab] = useState(null);
  const [roastLine, setRoastLine] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const checkWinCondition = (updatedScores) => {
    const winner = computeWinner3(updatedScores, targetScore);
    const max = Math.max(...updatedScores);
    const min = Math.min(...updatedScores);
    const gap = max - min;
    const gapThreshold = BANTER_GAP_THRESHOLD(targetScore);

    if (winner === null) {
      const allOverTarget = updatedScores.every((s) => s >= targetScore);
      const leaders = updatedScores.filter((s) => s === max);
      const isTie = allOverTarget && leaders.length > 1;
      setTieNotice(isTie);
      if (banterEnabled && !isTie && gap >= gapThreshold) {
        setBanterJab(pickRandom(BANTER_LINES));
      } else {
        setBanterJab(null);
      }
      return;
    }

    setTieNotice(false);
    setBanterJab(null);
    if (banterEnabled) {
      setRoastLine(pickRandom(BANTER_LINES));
    } else {
      setRoastLine(null);
    }
    const updatedGamesWon = gamesWon.map((count, i) => (i === winner ? count + 1 : count));
    onUpdate({ gamesWon: updatedGamesWon });
    setWinnerIndex(winner);
    setShowWinnerModal(true);
    if (soundEnabled) playSound("win");
  };

  const addRoundScore = (pts1, pts2, pts3, details = "Hand points") => {
    const newPts1 = Math.max(0, parseInt(pts1) || 0);
    const newPts2 = Math.max(0, parseInt(pts2) || 0);
    const newPts3 = Math.max(0, parseInt(pts3) || 0);

    const updatedScores = [scores[0] + newPts1, scores[1] + newPts2, scores[2] + newPts3];

    const roundEntry = {
      id: Date.now(),
      pts1: newPts1,
      pts2: newPts2,
      pts3: newPts3,
      total1: updatedScores[0],
      total2: updatedScores[1],
      total3: updatedScores[2],
      details,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    onUpdate({
      rounds: [roundEntry, ...rounds],
      scores: updatedScores,
    });

    if (soundEnabled) playSound("score");

    checkWinCondition(updatedScores);
  };

  // Fast manual points add (Akuže declarations) for a single player.
  const addQuickPoints = (playerIndex, amount) => {
    if (soundEnabled) playSound("tap");
    const pts = [0, 0, 0];
    pts[playerIndex] = amount;
    addRoundScore(pts[0], pts[1], pts[2], `+${amount} pt`);
  };

  const handlePts1Change = (val) => {
    if (val === "") {
      setCustomPts1("");
      return;
    }
    setCustomPts1(clamp11(parseInt(val) || 0).toString());
  };

  const handlePts2Change = (val) => {
    if (val === "") {
      setCustomPts2("");
      return;
    }
    setCustomPts2(clamp11(parseInt(val) || 0).toString());
  };

  const p1Raw = customPts1 === "" ? 0 : clamp11(parseInt(customPts1) || 0);
  const p2Raw = customPts2 === "" ? 0 : clamp11(parseInt(customPts2) || 0);
  const p3Preview = HAND_CAP - p1Raw - p2Raw;
  const isOverCap = p3Preview < 0;
  const hasAnyInput = customPts1 !== "" || customPts2 !== "";

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!hasAnyInput || isOverCap) return;

    addRoundScore(p1Raw, p2Raw, p3Preview, `Hand (${p1Raw}/${p2Raw}/${p3Preview})`);
    setCustomPts1("");
    setCustomPts2("");
  };

  const removeRoundById = (id) => {
    if (showWinnerModal) return; // don't mutate history while a win is pending confirmation
    if (soundEnabled) playSound("tap");
    const filtered = rounds.filter((r) => r.id !== id);
    const { rounds: recalculated, total1, total2, total3 } = recalcTotals3(filtered);
    onUpdate({ rounds: recalculated, scores: [total1, total2, total3] });
    checkWinCondition([total1, total2, total3]);
  };

  const undoLastRound = () => {
    if (rounds.length === 0) return;
    removeRoundById(rounds[0].id);
  };

  const resetGame = (fullReset) => {
    if (soundEnabled) playSound("tap");
    onUpdate({ scores: [0, 0, 0], rounds: [] });
    setShowWinnerModal(false);
    setBanterJab(null);
    setRoastLine(null);
    if (fullReset) {
      setShowConfirmModal(false);
      setTieNotice(false);
    }
  };

  const handlePlayerNameChange = (index, value) => {
    const updatedNames = playerNames.map((n, i) => (i === index ? value : n));
    onUpdate({ playerNames: updatedNames });
  };

  return (
    <>
      {/* Target Score Segmented Control */}
      <div className="bg-felt-panel/80 border border-amber-500/30 p-1 rounded-2xl flex text-xs font-semibold text-felt-ink-muted shadow-inner">
        {TARGET_SCORE_OPTIONS.map((pts) => (
          <button
            key={pts}
            onClick={() => {
              onUpdate({ targetScore: pts });
              if (soundEnabled) playSound("tap");
            }}
            className={`flex-1 min-h-11 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              targetScore === pts
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold shadow-md"
                : "hover:text-felt-ink"
            }`}
          >
            <span>🏆 Cilj {pts} b</span>
          </button>
        ))}
      </div>

      {tieNotice && (
        <div
          className="motion-slide-fade-in bg-amber-500/20 border border-amber-500/60 text-felt-ink text-xs font-semibold rounded-xl px-3 py-2 text-center"
          style={{ animation: "slide-fade-in 260ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          Neriješeno na {Math.max(...scores)} — igrajte dalje dok netko ne povede.
        </div>
      )}

      {/* THREE PLAYER PARCHMENT CARDS */}
      <div className="relative grid grid-cols-3 gap-2">
        {playerNames.map((playerName, i) => (
          <TeamCard
            key={i}
            compact
            icon={PLAYER_ICONS[i]}
            label={`Igrač ${i + 1}`}
            name={playerName}
            onNameChange={(value) => handlePlayerNameChange(i, value)}
            namePlaceholder={`Igrač ${i + 1}`}
            score={scores[i]}
            scoreSuffix={`/ ${targetScore} b`}
            wonLabel="Pobjede"
            wonCount={gamesWon[i]}
            accentColor={PLAYER_ACCENTS[i]}
            onQuickAdd={(pts) => addQuickPoints(i, pts)}
            quickAmounts={[
              { value: 3, bottom: "+3" },
              { value: 4, bottom: "+4" },
            ]}
            quickAddHeading="Akuže:"
          />
        ))}
        {banterJab && (
          <BanterOverlay line={banterJab} onDismiss={() => setBanterJab(null)} accent={accent} />
        )}
      </div>

      {/* CUSTOM HAND SCORE ENTRY BOX (HAND_CAP-Point Total Bound, 3-way) */}
      <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-2xl p-3 border-2 border-amber-300/80 shadow-md space-y-2 text-slate-900">
        <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 px-1">
          <span className="flex items-center gap-1">
            🎴 Unesi rezultat ruke
          </span>
          <span className="text-emerald-800 font-mono">Ukupno = {HAND_CAP} b</span>
        </div>

        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={customPts1}
            onChange={(e) => handlePts1Change(e.target.value)}
            placeholder={`${playerNames[0]} (0-${HAND_CAP})`}
            aria-label={`${playerNames[0]} bodovi ruke, 0 do ${HAND_CAP}`}
            className="min-w-0 flex-1 bg-white border border-amber-300 rounded-xl px-2 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 shadow-inner"
          />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={customPts2}
            onChange={(e) => handlePts2Change(e.target.value)}
            placeholder={`${playerNames[1]} (0-${HAND_CAP})`}
            aria-label={`${playerNames[1]} bodovi ruke, 0 do ${HAND_CAP}`}
            className="min-w-0 flex-1 bg-white border border-amber-300 rounded-xl px-2 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 shadow-inner"
          />

          {/* Calculated Auto-Fill Badge for Player 3 */}
          <div
            className={`px-2 py-2 border rounded-xl text-[11px] font-black min-w-[76px] text-center shrink-0 ${
              isOverCap
                ? "bg-red-100 border-red-300 text-red-800"
                : "bg-amber-200/70 border-amber-300 text-emerald-900"
            }`}
          >
            {playerNames[2]}: {isOverCap ? "—" : p3Preview}
          </div>

          <button
            type="submit"
            disabled={!hasAnyInput || isOverCap}
            className="min-h-11 px-3 bg-emerald-900 hover:bg-emerald-800 text-amber-200 font-bold text-xs rounded-xl active:scale-95 transition shrink-0 border border-amber-500/40 shadow-sm disabled:opacity-40 disabled:active:scale-100"
          >
            Dodaj
          </button>
        </form>
      </div>

      {/* SCORE HISTORY SECTION */}
      <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-3xl p-4 border-2 border-amber-300/80 shadow-xl space-y-3 text-slate-900">
        <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-serif">
            <History size={14} className="text-amber-700" />
            Povijest ruku ({rounds.length})
          </h2>
          {rounds.length > 0 && (
            <button
              onClick={undoLastRound}
              className="min-h-11 px-2 text-xs text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1"
            >
              <RotateCcw size={12} /> Poništi zadnje
            </button>
          )}
        </div>

        {rounds.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-1">
            <ListOrdered size={24} className="mx-auto text-amber-800/40" />
            <p className="text-xs italic font-serif">Još nema zabilježenih ruku.</p>
            <p className="text-[11px] text-slate-500">
              Koristite brze gumbe ili unesite rezultat iznad.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-slate-500 border-b border-amber-200/60 pb-1 px-2 font-mono">
              <span className="col-span-2">Ruka</span>
              <span className="col-span-2 text-blue-900 truncate">{playerNames[0]}</span>
              <span className="col-span-2 text-red-900 truncate">{playerNames[1]}</span>
              <span className="col-span-2 text-emerald-900 truncate">{playerNames[2]}</span>
              <span className="col-span-2 text-right">Ukupno</span>
              <span className="col-span-2"></span>
            </div>

            {rounds.map((r, index) => (
              <div
                key={r.id}
                className="motion-slide-fade-in grid grid-cols-12 items-center bg-white/80 p-2 rounded-xl text-[11px] border border-amber-200/80 shadow-sm"
                style={{ animation: "slide-fade-in 240ms cubic-bezier(0.16, 1, 0.3, 1)" }}
              >
                <div className="col-span-2 text-slate-600 font-mono text-[10px] font-semibold">
                  #{rounds.length - index}
                </div>
                <div className="col-span-2 font-bold text-blue-900">+{r.pts1}</div>
                <div className="col-span-2 font-bold text-red-900">+{r.pts2}</div>
                <div className="col-span-2 font-bold text-emerald-900">+{r.pts3}</div>
                <div className="col-span-2 text-right font-mono font-bold text-slate-900 text-[10px]">
                  {r.total1}-{r.total2}-{r.total3}
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => removeRoundById(r.id)}
                    className="min-w-11 min-h-11 flex items-center justify-center text-slate-400 hover:text-red-600 transition"
                    title="Obriši ruku"
                    aria-label={`Obriši ruku ${rounds.length - index}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset Action */}
      <div className="pt-1">
        <button
          onClick={() => {
            if (soundEnabled) playSound("tap");
            setShowConfirmModal(true);
          }}
          className={`w-full min-h-11 bg-transparent hover:bg-felt-panel/50 border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition uppercase tracking-wider ${accent.resetButton}`}
        >
          <RefreshCw size={14} /> Nova igra
        </button>
      </div>

      {/* Confirmation Modal for Resets */}
      {showConfirmModal && (
        <div
          className="motion-fade-in fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          style={{ animation: "fade-in 180ms ease-out" }}
        >
          <div
            className="motion-modal-in bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl text-slate-900"
            style={{ animation: "modal-in 320ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto border border-amber-300">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-serif">Započeti novu igru?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Ovo će poništiti rezultate i povijest ruku za trenutnu igru.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-amber-200/80 hover:bg-amber-200 text-slate-800 font-bold rounded-xl text-xs active:scale-95 transition"
              >
                Odustani
              </button>
              <button
                onClick={() => resetGame(true)}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-md shadow-red-900/20 active:scale-95 transition"
              >
                Potvrdi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winner Modal Dialog */}
      {showWinnerModal && (
        <div
          className="motion-fade-in fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          style={{ animation: "fade-in 180ms ease-out" }}
        >
          <div
            className="motion-modal-in bg-gradient-to-b from-amber-50 to-amber-100 border-2 border-amber-400 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl text-slate-900"
            style={{ animation: "modal-in 320ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
              <Trophy size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-serif tracking-wide">
                POBJEDA! 🎉
              </h2>
              <p className="text-base font-bold text-amber-900 mt-1">
                {winnerIndex !== null ? playerNames[winnerIndex] : ""} pobjeđuje!
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Konačni rezultat:{" "}
                <strong className="text-slate-900">
                  {scores[0]}-{scores[1]}-{scores[2]}
                </strong>{" "}
                (Cilj {targetScore} b)
              </p>
              {roastLine && (
                <p className="text-base italic text-orange-800/80 mt-2 border-t border-amber-300/60 pt-2">
                  {roastLine}
                </p>
              )}
            </div>
            <button
              onClick={() => resetGame(false)}
              className="w-full py-3 bg-emerald-900 hover:bg-emerald-800 text-amber-200 font-bold rounded-xl text-xs uppercase tracking-wider shadow-md border border-amber-500/40"
            >
              Nova igra
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Lint**

```bash
cd app && npm run lint
```

Expected: no errors. `TresetaBoard3.jsx` isn't imported/mounted anywhere yet (that's Task 5), so it won't be visually reachable in the browser until then — this task's verification is limited to lint passing and matching the patterns established in `TresetaBoard.jsx`.

- [ ] **Step 3: Commit**

```bash
cd /Users/antunzebec/Work/01.Clients/xxx
git add app/src/games/TresetaBoard3.jsx
git commit -m "$(cat <<'EOF'
Add 3-player Trešeta board component

Mirrors TresetaBoard.jsx's hand-entry, akuže, history, reset, and
winner-modal patterns, generalized from 2 hardcoded entities to 3
(individual play, no teams). Two free hand-point inputs with the third
player auto-filled to reach HAND_CAP, same auto-fill UX as the
2-player board's single input.
EOF
)"
```

---

### Task 5: `App.jsx` — player-count toggle and wiring

**Files:**
- Modify: `app/src/App.jsx`

**Interfaces:**
- Consumes: `DEFAULT_TRESETA3_STATE` implicitly via `persisted.treseta3`/`persisted.tresetaPlayerCount` (Task 2); `TresetaBoard3` default export (Task 4).
- Produces: nothing further consumed by other tasks — this is the final integration point.

- [ ] **Step 1: Import `TresetaBoard3`**

Add below the existing `TresetaBoard` import:
```js
import TresetaBoard3 from "./games/TresetaBoard3.jsx";
```

- [ ] **Step 2: Add `tresetaPlayerCount` state and `treseta3` state slice**

Change:
```js
  const [activeMode, setActiveMode] = useState(persisted.activeMode);

  // Team Names — shared across both game modes.
  const [team1Name, setTeam1Name] = useState(persisted.team1Name);
  const [team2Name, setTeam2Name] = useState(persisted.team2Name);

  // Per-mode score state — each mode keeps its own progress when you
  // switch away and back, since only the active board is mounted.
  const [tresetaState, setTresetaState] = useState(persisted.treseta);
  const [briskulaState, setBriskulaState] = useState(persisted.briskula);

  const updateTresetaState = (partial) =>
    setTresetaState((prev) => ({ ...prev, ...partial }));
  const updateBriskulaState = (partial) =>
    setBriskulaState((prev) => ({ ...prev, ...partial }));
```
to:
```js
  const [activeMode, setActiveMode] = useState(persisted.activeMode);

  // Team Names — shared across both game modes.
  const [team1Name, setTeam1Name] = useState(persisted.team1Name);
  const [team2Name, setTeam2Name] = useState(persisted.team2Name);

  // Trešeta player-count toggle (2 = teams, 3 = individual play). Its
  // own persisted field, independent of activeMode, so it's remembered
  // across reloads without affecting Briškula.
  const [tresetaPlayerCount, setTresetaPlayerCount] = useState(persisted.tresetaPlayerCount);

  // Per-mode score state — each mode keeps its own progress when you
  // switch away and back, since only the active board is mounted.
  // treseta3 is a fully independent match from treseta (2-player), so
  // toggling player count never touches either match's history.
  const [tresetaState, setTresetaState] = useState(persisted.treseta);
  const [treseta3State, setTreseta3State] = useState(persisted.treseta3);
  const [briskulaState, setBriskulaState] = useState(persisted.briskula);

  const updateTresetaState = (partial) =>
    setTresetaState((prev) => ({ ...prev, ...partial }));
  const updateTreseta3State = (partial) =>
    setTreseta3State((prev) => ({ ...prev, ...partial }));
  const updateBriskulaState = (partial) =>
    setBriskulaState((prev) => ({ ...prev, ...partial }));
```

- [ ] **Step 3: Persist the new state**

Change:
```js
  useEffect(() => {
    // Debounced so typing a team name doesn't re-serialize the whole
    // match state (including both modes' full rounds history) on every
    // keystroke.
    const timeoutId = setTimeout(() => {
      savePersistedState({
        activeMode,
        team1Name,
        team2Name,
        treseta: tresetaState,
        briskula: briskulaState,
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [activeMode, team1Name, team2Name, tresetaState, briskulaState]);
```
to:
```js
  useEffect(() => {
    // Debounced so typing a team name doesn't re-serialize the whole
    // match state (including every mode/variant's full rounds history)
    // on every keystroke.
    const timeoutId = setTimeout(() => {
      savePersistedState({
        activeMode,
        team1Name,
        team2Name,
        tresetaPlayerCount,
        treseta: tresetaState,
        treseta3: treseta3State,
        briskula: briskulaState,
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [
    activeMode,
    team1Name,
    team2Name,
    tresetaPlayerCount,
    tresetaState,
    treseta3State,
    briskulaState,
  ]);
```

- [ ] **Step 4: Add the player-count toggle and conditional board rendering**

Change:
```jsx
        {activeMode === "treseta" ? (
          <TresetaBoard
            soundEnabled={soundEnabled}
            banterEnabled={banterEnabled}
            team1Name={team1Name}
            team2Name={team2Name}
            onTeam1NameChange={setTeam1Name}
            onTeam2NameChange={setTeam2Name}
            state={tresetaState}
            onUpdate={updateTresetaState}
          />
        ) : (
          <BriskulaBoard
            soundEnabled={soundEnabled}
            banterEnabled={banterEnabled}
            team1Name={team1Name}
            team2Name={team2Name}
            onTeam1NameChange={setTeam1Name}
            onTeam2NameChange={setTeam2Name}
            state={briskulaState}
            onUpdate={updateBriskulaState}
          />
        )}
```
to:
```jsx
        {activeMode === "treseta" && (
          <div className="bg-felt-panel/80 border border-amber-500/30 p-1 rounded-2xl flex text-xs font-semibold text-felt-ink-muted shadow-inner">
            {[
              { key: 2, label: "👥 2 igrača" },
              { key: 3, label: "👥 3 igrača" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setTresetaPlayerCount(key);
                  if (soundEnabled) playSound("tap");
                }}
                className={`flex-1 min-h-11 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  tresetaPlayerCount === key
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold shadow-md"
                    : "hover:text-felt-ink"
                }`}
              >
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {activeMode === "treseta" ? (
          tresetaPlayerCount === 3 ? (
            <TresetaBoard3
              soundEnabled={soundEnabled}
              banterEnabled={banterEnabled}
              state={treseta3State}
              onUpdate={updateTreseta3State}
            />
          ) : (
            <TresetaBoard
              soundEnabled={soundEnabled}
              banterEnabled={banterEnabled}
              team1Name={team1Name}
              team2Name={team2Name}
              onTeam1NameChange={setTeam1Name}
              onTeam2NameChange={setTeam2Name}
              state={tresetaState}
              onUpdate={updateTresetaState}
            />
          )
        ) : (
          <BriskulaBoard
            soundEnabled={soundEnabled}
            banterEnabled={banterEnabled}
            team1Name={team1Name}
            team2Name={team2Name}
            onTeam1NameChange={setTeam1Name}
            onTeam2NameChange={setTeam2Name}
            state={briskulaState}
            onUpdate={updateBriskulaState}
          />
        )}
```

- [ ] **Step 5: Lint**

```bash
cd app && npm run lint
```

Expected: no errors.

- [ ] **Step 6: Manual verification in the browser**

```bash
cd app && npm run dev
```

Open the dev server URL and walk through the full flow (this is the project's standard verification method — no automated tests exist per `CLAUDE.md`):

1. Confirm Trešeta mode now shows a "👥 2 igrača / 👥 3 igrača" toggle above the target-score selector; Briškula mode shows no such toggle.
2. In 2-player Trešeta, record a hand or two, confirm nothing changed from prior behavior.
3. Switch to "3 igrača" — confirm 3 cards render side-by-side (compact, all fit without horizontal scroll on a narrow viewport — use browser devtools device toolbar at ~375px width), default names "Igrač 1/2/3".
4. Rename all 3 players, enter a hand via the two free inputs (e.g. Player 1 = 5, Player 2 = 3) and confirm the Player 3 badge shows `3` (11 − 5 − 3) and totals update to `5 / 3 / 3` after clicking "Dodaj".
5. Enter Player 1 = 8, Player 2 = 8 (sums to 16 > 11) and confirm the badge turns red/shows "—" and "Dodaj" is disabled.
6. Use an Akuže +3/+4 button on one player and confirm only that player's score and history row change.
7. Drive one player to the target score with a strictly higher score than the other two — confirm the winner modal names that player and "Pobjede" increments for them only.
8. Force a tie at the top (e.g. two players both reach the target with equal scores) — confirm no winner modal appears and the "Neriješeno" banner shows instead.
9. Delete a middle round from history and confirm all three running totals recalculate correctly (matches the pattern already relied on for 2-player undo/delete).
10. Switch back to "2 igrača" — confirm the 2-player match's scores/history are exactly as left, untouched by the 3-player session.
11. Reload the page — confirm both the 2-player and 3-player Trešeta matches, and the player-count toggle position, all survive the reload (validates the storage version bump end-to-end).
12. Switch to Briškula and back to Trešeta — confirm no state bleed.

Stop the dev server (Ctrl+C) once all checks pass. If any step fails, fix the relevant file before committing.

- [ ] **Step 7: Commit**

```bash
cd /Users/antunzebec/Work/01.Clients/xxx
git add app/src/App.jsx
git commit -m "$(cat <<'EOF'
Wire up 3-player Trešeta mode in the app shell

Adds a 2/3-player toggle inside Trešeta mode and mounts TresetaBoard3
with its own persisted state slice when 3 players is selected, leaving
the 2-player and Briškula matches fully independent.
EOF
)"
```

---

## Post-plan notes

- `PRODUCT.md`'s Capabilities/Positioning sections describe the 2-team Trešeta and Briškula feature set; consider a short follow-up edit there once this ships, noting the 3-player individual-play option exists (out of scope for this plan — docs-only, no code impact).
