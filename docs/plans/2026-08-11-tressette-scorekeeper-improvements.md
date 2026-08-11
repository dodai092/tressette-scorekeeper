# Tressette Scorekeeper Improvement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Fix the correctness bugs and structural debt in `code.js`, a single-file React scorekeeper for the card game Tressette, while keeping it a single-file component compatible with the iOS wrapper it's already embedded in (built by Gemini — no local package.json/build tooling exists in this folder, and this plan does not introduce any).

**Architecture:** `code.js` stays a single default-exported React component (`App`). Game logic (scoring, win detection, undo/delete recompute) gets pulled into a small set of pure helper functions defined at the top of the same file, above the component, so they're easy to unit-reason about even without a test runner. Presentation gets a `TeamCard` sub-component to kill the Team 1/Team 2 JSX duplication. No new files, no new dependencies, no build tooling.

**Tech Stack:** React (hooks), lucide-react icons, Tailwind utility classes — all as currently used in `code.js`. No test framework is introduced (per explicit decision — see Global Constraints).

## Global Constraints

- Single file: all changes stay inside `code.js`. Do not create a multi-file project, package.json, or build config.
- No test runner: verification is manual (open the app, click through the scenario, confirm on-screen). Do not add Vitest/Jest/etc.
- No new npm dependencies — everything must work with what's already imported (`react`, `lucide-react`).
- Preserve existing visual design (Tailwind classes, colors, copy) exactly unless a task explicitly changes markup structure for deduplication — in that case the rendered output must look identical.
- Preserve existing exported interface: `export default function App()` with no props.

---

### Task 1: Extract scoring/game-logic into pure helper functions

**Files:**
- Modify: `code.js:106-217` (`checkWinCondition`, `addRoundScore`, `addQuickPoints`, `undoLastRound`, `removeRoundById`)

**Interfaces:**
- Produces (pure functions, defined above the `App` component, near `playSound`):
  - `computeWinner(updated1, updated2, targetScore, team1Name, team2Name) -> string | null` — returns the winning team's name, or `null` if no one has won yet (including the tie-at-target case).
  - `recalcTotals(rounds) -> { rounds: <rounds with total1/total2 recomputed>, total1: number, total2: number }` — takes an array of round entries **ordered newest-first** (same order as state), returns a new array with `total1`/`total2` recomputed bottom-up, plus the final totals.
- Consumes: nothing new: same `rounds` shape already used (`{ id, pts1, pts2, total1, total2, details, timestamp }`).

This task only extracts logic — it does not yet fix the tie bug (that's Task 2) or the undo-after-win bug (Task 3). Keep behavior identical to today.

- [x] **Step 1: Add `computeWinner` above the `App` component**

Insert directly below the `playSound` function (after line 49):

```javascript
// Returns the winning team's name once one side has reached targetScore
// with a strictly higher total than the other, otherwise null.
const computeWinner = (updated1, updated2, targetScore, team1Name, team2Name) => {
  if (updated1 < targetScore && updated2 < targetScore) return null;
  if (updated1 === updated2) return null;
  return updated1 > updated2 ? team1Name : team2Name;
};
```

- [x] **Step 2: Add `recalcTotals` above the `App` component**

Insert directly below `computeWinner`:

```javascript
// rounds is newest-first (index 0 = most recent). Recomputes running
// totals bottom-up and returns them in the same newest-first order.
const recalcTotals = (rounds) => {
  let run1 = 0;
  let run2 = 0;
  const recalculated = [...rounds]
    .reverse()
    .map((r) => {
      run1 += r.pts1;
      run2 += r.pts2;
      return { ...r, total1: run1, total2: run2 };
    })
    .reverse();
  return { rounds: recalculated, total1: run1, total2: run2 };
};
```

- [x] **Step 3: Rewrite `checkWinCondition` to use `computeWinner`**

Replace lines 106-117:

```javascript
  // Check win condition whenever scores change
  const checkWinCondition = (updated1, updated2) => {
    const winner = computeWinner(updated1, updated2, targetScore, team1Name, team2Name);
    if (winner === null) return;
    if (winner === team1Name) setGamesWon1((g) => g + 1);
    else setGamesWon2((g) => g + 1);
    setWinnerTeam(winner);
    setShowWinnerModal(true);
    if (soundEnabled) playSound("win");
  };
```

Note: this is behavior-preserving vs. today (still returns `null` on a tie at/above target — Task 2 fixes that).

- [x] **Step 4: Rewrite `removeRoundById` to use `recalcTotals`**

Replace lines 194-217:

```javascript
  const removeRoundById = (id) => {
    if (soundEnabled) playSound("tap");
    const filtered = rounds.filter((r) => r.id !== id);
    const { rounds: recalculated, total1, total2 } = recalcTotals(filtered);
    setRounds(recalculated);
    setScoreTeam1(total1);
    setScoreTeam2(total2);
  };
```

- [x] **Step 5: Manual verification**

Open the app (in whatever host renders `code.js` today — the iOS wrapper or your usual preview environment):
1. Add a few hands via Quick Add and the custom hand form.
2. Confirm totals update exactly as before.
3. Delete a hand from the middle of the history list, confirm all totals below it recompute correctly (same as before this change).
4. Play out a game to a clean (non-tied) win, confirm the winner modal and Games Won counter still work exactly as before.

- [x] **Step 6: Commit**

```bash
git add code.js
git commit -m "refactor: extract win-check and totals recompute into pure helpers"
```
(If this folder is not a git repo, skip this step and just save the file — confirm with the user which applies.)

---

### Task 2: Fix the tie-at-target-score edge case

**Files:**
- Modify: `code.js` (`computeWinner`, from Task 1, plus new UI feedback)

**Interfaces:**
- Consumes: `computeWinner` from Task 1.
- Produces: a new piece of transient UI state, `tieNotice` (string or null), shown when both teams cross target score in the same round and are tied.

Currently: if both teams hit target and are tied, `checkWinCondition` silently does nothing — no modal, no message, play just continues with no explanation. In Tressette this is a real scenario (you keep playing past target until someone's ahead). The fix: keep `computeWinner` returning `null` for ties (correct — no one has won), but surface a one-line notice so the players understand why no winner was declared.

- [x] **Step 1: Add `tieNotice` state**

Near the other UI state declarations (around line 71-72, after `winnerTeam`):

```javascript
  const [tieNotice, setTieNotice] = useState(false);
```

- [x] **Step 2: Set/clear the notice in `checkWinCondition`**

Update the function from Task 1, Step 3:

```javascript
  const checkWinCondition = (updated1, updated2) => {
    const winner = computeWinner(updated1, updated2, targetScore, team1Name, team2Name);
    if (winner === null) {
      const bothOverTarget = updated1 >= targetScore && updated2 >= targetScore;
      setTieNotice(bothOverTarget && updated1 === updated2);
      return;
    }
    setTieNotice(false);
    if (winner === team1Name) setGamesWon1((g) => g + 1);
    else setGamesWon2((g) => g + 1);
    setWinnerTeam(winner);
    setShowWinnerModal(true);
    if (soundEnabled) playSound("win");
  };
```

- [x] **Step 3: Render the notice in the JSX**

Add just below the "Target Score Segmented Control" block (after the closing `</div>` around line 315), before the "TEAM 1 & TEAM 2 PARCHMENT CARDS" grid:

```jsx
        {tieNotice && (
          <div className="bg-amber-500/20 border border-amber-500/60 text-amber-200 text-xs font-semibold rounded-xl px-3 py-2 text-center">
            Tied at {scoreTeam1} — keep playing until someone's ahead.
          </div>
        )}
```

- [x] **Step 4: Clear `tieNotice` on new match**

In `executeNewMatch` (Task 1 area, originally lines 220-227), add `setTieNotice(false);` alongside the other resets.

- [x] **Step 5: Manual verification**

1. Set target score to 41.
2. Enter hands so both teams reach exactly 41-41 in the same hand (e.g. two 20-20 hands then a 1-1 hand, or any combination that lands both totals equal at/above 41).
3. Confirm: no winner modal appears, and the new amber notice banner shows instead.
4. Add one more hand that breaks the tie — confirm the winner modal now appears and the notice disappears.
5. Start a new game — confirm the notice is cleared.

- [x] **Step 6: Commit**

```bash
git add code.js
git commit -m "fix: surface a tie notice instead of silently doing nothing at target score"
```

---

### Task 3: Fix stale win state after undo

**Files:**
- Modify: `code.js` (`undoLastRound`)

**Interfaces:**
- Consumes: nothing new.
- Produces: no new interface — internal fix only.

Bug: if the last round pushed a team over target and triggered the winner modal, and the user (or an accidental double-tap) calls `undoLastRound`, the scores roll back but `gamesWon1`/`gamesWon2` and `showWinnerModal`/`winnerTeam` are left stale — the modal may still be showing (or was already dismissed) while a game-won count was already incremented for a game that's no longer won.

- [x] **Step 1: Guard `undoLastRound` against undoing a round that produced a win**

Replace `undoLastRound` (originally lines 185-192):

```javascript
  const undoLastRound = () => {
    if (rounds.length === 0) return;
    if (showWinnerModal) return; // don't allow undo while a win is pending confirmation
    if (soundEnabled) playSound("tap");
    const [last, ...rest] = rounds;
    setRounds(rest);
    setScoreTeam1(scoreTeam1 - last.pts1);
    setScoreTeam2(scoreTeam2 - last.pts2);
  };
```

This is the simplest correct fix: once the winner modal is showing, the only way forward is to dismiss it (which already resets the match via the modal's "Start New Game" button) — undo is disabled until then, so `gamesWon` and the modal never get out of sync.

- [x] **Step 2: Manual verification**

1. Play a game up to one hand before target score.
2. Add the winning hand — confirm the winner modal appears.
3. Without dismissing the modal, try tapping "Undo Last" (it's behind the modal / or test by temporarily reordering — at minimum confirm via code path that `undoLastRound` now no-ops while `showWinnerModal` is true).
4. Dismiss the modal via "Start New Game", confirm undo works normally again on the fresh match.

- [x] **Step 3: Commit**

```bash
git add code.js
git commit -m "fix: disable undo while a win is pending to avoid stale gamesWon state"
```

---

### Task 4: Reuse a single AudioContext instead of creating one per sound

**Files:**
- Modify: `code.js:15-49` (`playSound`)

**Interfaces:**
- Produces: `playSound(type)` keeps the same call signature used throughout the component (`playSound("tap")`, `playSound("win")`, `playSound("score")`) — no caller changes needed.

Bug: every call to `playSound` creates a brand new `AudioContext`, never closed. Browsers cap the number of live contexts and will start warning/throttling in a long game session (potentially hundreds of taps).

- [x] **Step 1: Move the AudioContext into a module-level singleton getter**

Replace lines 15-49:

```javascript
// Helper for Web Audio sound effects
let sharedAudioCtx = null;
const getAudioContext = () => {
  if (!sharedAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    sharedAudioCtx = new Ctx();
  }
  return sharedAudioCtx;
};

const playSound = (type) => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "tap") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "win") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "score") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    // Audio fallback
  }
};
```

- [x] **Step 2: Manual verification**

1. Toggle sound on, tap several Quick Add buttons rapidly (10+ taps).
2. Confirm each tap still plays the tap sound (no silence, no errors in the console).
3. Trigger a win — confirm the win sound still plays.
4. Check the browser/webview console for any AudioContext-related warnings — should be none (vs. before, where rapid tapping could log context-limit warnings).

- [x] **Step 3: Commit**

```bash
git add code.js
git commit -m "perf: reuse a single shared AudioContext instead of one per sound"
```

---

### Task 5: Extract `TeamCard` to remove Team 1 / Team 2 JSX duplication

**Files:**
- Modify: `code.js:317-416` (the two near-identical team card blocks)

**Interfaces:**
- Produces: `TeamCard` component defined above `App` (or as a nested function above the `return` — keep it above `return` so it's not redefined every render):
  - Props: `{ label, icon, name, onNameChange, score, targetScore, gamesWon, accentColor, onQuickAdd, quickAmounts }`
    - `accentColor`: `"blue"` or `"red"` — used to pick the existing blue/red Tailwind classes.
    - `onQuickAdd(amount)`: called when a quick-add button is tapped.
    - `quickAmounts`: array of numbers, e.g. `[3, 4]`.

This task changes markup structure but must render pixel-identical output to today for both teams.

- [x] **Step 1: Add the `TeamCard` component above `App`**

Insert directly above `export default function App()`:

```javascript
function TeamCard({
  icon,
  label,
  name,
  onNameChange,
  score,
  targetScore,
  gamesWon,
  accentColor,
  onQuickAdd,
  quickAmounts,
}) {
  const accent =
    accentColor === "blue"
      ? {
          label: "text-blue-800",
          text: "text-blue-900",
          border: "border-blue-200 focus:border-blue-600",
          gamesWon: "text-blue-900",
          quickBtn: "bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300/60",
        }
      : {
          label: "text-red-800",
          text: "text-red-900",
          border: "border-red-200 focus:border-red-600",
          gamesWon: "text-red-900",
          quickBtn: "bg-red-100 hover:bg-red-200 text-red-900 border-red-300/60",
        };

  return (
    <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-3xl p-4 border-2 border-amber-300/80 shadow-xl relative flex flex-col justify-between text-slate-900">
      <div className="space-y-3">
        <div>
          <label
            className={`text-[9px] uppercase font-bold ${accent.label} tracking-wider flex items-center gap-1 mb-0.5 font-mono`}
          >
            <span>{icon}</span> {label}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className={`bg-transparent font-black text-base ${accent.text} tracking-tight w-full outline-none border-b ${accent.border} py-0.5 font-serif`}
            placeholder={label}
          />
        </div>

        <div className="text-center py-1">
          <span className="text-5xl font-black tracking-tight text-slate-950 font-serif drop-shadow-sm">
            {score}
          </span>
          <p className="text-[10px] uppercase font-bold tracking-widest text-amber-800/70 font-mono mt-0.5">
            / {targetScore} Points
          </p>
          <p className="text-[10px] text-slate-600 mt-1 font-medium">
            Games Won: <strong className={accent.gamesWon}>{gamesWon}</strong>
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-amber-200/80 space-y-1 mt-2">
        <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
          Quick Add:
        </span>
        <div className="flex items-center gap-1.5 justify-between">
          {quickAmounts.map((pts) => (
            <button
              key={pts}
              onClick={() => onQuickAdd(pts)}
              className={`flex-1 py-1.5 ${accent.quickBtn} font-bold text-xs rounded-xl active:scale-95 transition shadow-sm`}
            >
              +{pts}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Replace the two card blocks in `App`'s JSX**

Replace lines 317-416 (the whole `{/* TEAM 1 & TEAM 2 PARCHMENT CARDS */}` grid) with:

```jsx
        {/* TEAM 1 & TEAM 2 PARCHMENT CARDS */}
        <div className="grid grid-cols-2 gap-3">
          <TeamCard
            icon="⚔️"
            label="Team A"
            name={team1Name}
            onNameChange={setTeam1Name}
            score={scoreTeam1}
            targetScore={targetScore}
            gamesWon={gamesWon1}
            accentColor="blue"
            onQuickAdd={(pts) => addQuickPoints(1, pts)}
            quickAmounts={[3, 4]}
          />
          <TeamCard
            icon="🍷"
            label="Team B"
            name={team2Name}
            onNameChange={setTeam2Name}
            score={scoreTeam2}
            targetScore={targetScore}
            gamesWon={gamesWon2}
            accentColor="red"
            onQuickAdd={(pts) => addQuickPoints(2, pts)}
            quickAmounts={[3, 4]}
          />
        </div>
```

- [x] **Step 3: Manual verification**

1. Compare the rendered UI before/after side by side (screenshot or eyeball): team card layout, colors (blue for Team A, red for Team B), fonts, spacing should be pixel-identical.
2. Edit both team names, confirm input still works and placeholder still shows the right default per team.
3. Tap Quick Add +3/+4 on both cards, confirm scores update correctly per team (this also exercises that `onQuickAdd` wiring didn't get team indices crossed).

- [x] **Step 4: Commit**

```bash
git add code.js
git commit -m "refactor: extract TeamCard component to remove Team 1/2 JSX duplication"
```

---

### Task 6: Persist match state to localStorage

**Files:**
- Modify: `code.js` (`App` component — state initialization and a new persistence effect)

**Interfaces:**
- Produces: no new external interface. Internally, a `STORAGE_KEY` constant and a `saveState`/`loadState` pair of helpers.

Goal: a page refresh / app relaunch (this is a webview-hosted iOS app, so reloads happen) shouldn't wipe an in-progress match. Persist: `targetScore`, `team1Name`, `team2Name`, `scoreTeam1`, `scoreTeam2`, `gamesWon1`, `gamesWon2`, `rounds`. Do not persist transient UI state (`showWinnerModal`, `showConfirmModal`, `tieNotice`, `soundEnabled`, `screenLocked`, `customPts1`).

- [x] **Step 1: Add storage helpers above `App`**

Insert above `export default function App()` (below `TeamCard` from Task 5, or below `recalcTotals` if Task 5 wasn't done yet):

```javascript
const STORAGE_KEY = "tressette-scorekeeper-state-v1";

const loadPersistedState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const savePersistedState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Storage unavailable (e.g. private mode) — fail silently.
  }
};
```

- [x] **Step 2: Initialize state from persisted values**

Replace the state declarations at lines 52-64 with:

```javascript
  const persisted = loadPersistedState();

  const [targetScore, setTargetScore] = useState(persisted?.targetScore ?? 41);
  const [team1Name, setTeam1Name] = useState(persisted?.team1Name ?? "Us");
  const [team2Name, setTeam2Name] = useState(persisted?.team2Name ?? "Them");
  const [scoreTeam1, setScoreTeam1] = useState(persisted?.scoreTeam1 ?? 0);
  const [scoreTeam2, setScoreTeam2] = useState(persisted?.scoreTeam2 ?? 0);
  const [gamesWon1, setGamesWon1] = useState(persisted?.gamesWon1 ?? 0);
  const [gamesWon2, setGamesWon2] = useState(persisted?.gamesWon2 ?? 0);
  const [rounds, setRounds] = useState(persisted?.rounds ?? []);
```

Note: `loadPersistedState()` is called once per component instance (not per render, since it's outside any hook and `App` only mounts once) — this is intentional and matches the existing codebase's style of computing initial values inline.

- [x] **Step 3: Add a persistence effect**

Add near the other `useEffect` (after the wake lock effect, originally lines 100-103):

```javascript
  useEffect(() => {
    savePersistedState({
      targetScore,
      team1Name,
      team2Name,
      scoreTeam1,
      scoreTeam2,
      gamesWon1,
      gamesWon2,
      rounds,
    });
  }, [targetScore, team1Name, team2Name, scoreTeam1, scoreTeam2, gamesWon1, gamesWon2, rounds]);
```

- [x] **Step 4: Clear persisted state on new match**

In `executeNewMatch`, the existing `setScoreTeam1(0)` / `setScoreTeam2(0)` / `setRounds([])` calls already trigger the effect above to re-save a cleared state — no extra call needed. Just confirm this in verification.

- [x] **Step 5: Manual verification**

1. Play a partial game (a few hands, non-default team names, target score set to 51).
2. Reload the page / relaunch the app.
3. Confirm scores, rounds, team names, and target score all restored exactly.
4. Start a new game via the reset flow, reload again, confirm the reset (empty) state is what persists — not the old game.
5. Test in a private/incognito webview if possible, confirm the app still loads (falls back to defaults) without throwing.

- [x] **Step 6: Commit**

```bash
git add code.js
git commit -m "feat: persist match state to localStorage across reloads"
```

---

## Explicitly out of scope for this plan

- Adding automated tests / a test runner — decided against for this file (no existing build tooling to hook into; see Global Constraints).
- Multi-file restructuring — stays a single `code.js` file to match how it's currently consumed by the iOS wrapper.
- Any visual/design changes beyond what's needed for the `TeamCard` extraction (Task 5), which must be visually identical to today.
