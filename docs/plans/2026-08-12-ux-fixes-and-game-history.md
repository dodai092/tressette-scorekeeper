# UX Fixes & Completed-Games History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three real bugs found by hands-on playtesting (banter overlay blocking score entry, illegible hand-score input with real names, target-score change not re-checking the win condition), stop banter lines repeating back-to-back, and add a persisted "past games" log per game mode.

**Architecture:** All changes are localized to the existing four files that already own this logic — `storage.js` (persisted state shape), `banter.js` (line-picking), and the two board components (`TresetaBoard.jsx`, `BriskulaBoard.jsx`). No new components, no new dependencies, no new build tooling. The history feature reuses the exact persistence path that already exists for team names and scores (`loadPersistedState`/`savePersistedState` in `storage.js`, called from the debounced `useEffect` in `App.jsx:36-50`) — it's one more field in the same JSON blob, not a new storage mechanism.

**Tech Stack:** React 19 (function components, hooks), Vite, Tailwind v4. No test framework is present in this repo (`package.json` has `lint`/`build`/`dev`/`preview` only — no Jest/Vitest/etc). Do not introduce one as part of this plan; verification is `npm run lint`, `npm run build`, and manual checks against the running dev server (`npm run dev`, served at `http://localhost:5173/tressette-scorekeeper/`).

## Global Constraints

- No test framework exists in this repo — every "verify" step below is a manual browser check against the dev server, not an automated test. Do not add Jest/Vitest/Playwright-as-a-dependency or any test scaffolding as a side effect of this plan.
- All UI copy is Croatian only (no i18n, no English fallback) — match the existing tone/vocabulary already in each file (informal, e.g. "Još nema...", "Cilj", "bod").
- Match existing Tailwind class patterns exactly (parchment cards: `bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-3xl p-4 border-2 border-amber-300/80 shadow-xl`; mono labels: `text-[10-11px] font-bold uppercase tracking-wider font-mono`) — see `TresetaBoard.jsx`'s existing "Game Hand History" card (~line 300) as the reference pattern for the new history card.
- Every changed line must trace to one of the five fixes/additions below — no incidental refactors, no touching unrelated code.

---

### Task 1: Fix target-score change not re-checking the win condition

**Bug:** In `TresetaBoard.jsx`, tapping a different target score (31/41/51) after points are already on the board only does `onUpdate({ targetScore: pts })` — it never re-evaluates whether the new target has already been reached. A team sitting at 35 points that gets switched to the 31 target shows "35 / 31 bodova" with no winner declared until the next hand is entered.

**Files:**
- Modify: `app/src/games/TresetaBoard.jsx`

**Interfaces:**
- Modifies the existing `checkWinCondition(updated1, updated2)` function (currently ~`TresetaBoard.jsx:51`) to accept an optional third parameter.

- [ ] **Step 1: Add an optional target-override parameter to `checkWinCondition`**

Find the current function (reads `targetScore` from the outer closure in two places: `computeWinner(...)` and `BANTER_GAP_THRESHOLD(...)`):

```jsx
  const checkWinCondition = (updated1, updated2) => {
    const winner = computeWinner(updated1, updated2, targetScore, team1Name, team2Name);
    const gap = Math.abs(updated1 - updated2);
    const gapThreshold = BANTER_GAP_THRESHOLD(targetScore);
```

Change it to:

```jsx
  const checkWinCondition = (updated1, updated2, targetOverride = targetScore) => {
    const winner = computeWinner(updated1, updated2, targetOverride, team1Name, team2Name);
    const gap = Math.abs(updated1 - updated2);
    const gapThreshold = BANTER_GAP_THRESHOLD(targetOverride);
```

Further down in the same function, the tie check also reads `targetScore` directly:

```jsx
      const bothOverTarget = updated1 >= targetScore && updated2 >= targetScore;
```

Change `targetScore` to `targetOverride` on that line only.

- [ ] **Step 2: Call `checkWinCondition` with the new target when it changes**

Find the target-score segmented control's button (~`TresetaBoard.jsx:189-204`):

```jsx
            onClick={() => {
              onUpdate({ targetScore: pts });
              if (soundEnabled) playSound("tap");
            }}
```

Change to:

```jsx
            onClick={() => {
              onUpdate({ targetScore: pts });
              checkWinCondition(scoreTeam1, scoreTeam2, pts);
              if (soundEnabled) playSound("tap");
            }}
```

- [ ] **Step 3: Verify manually**

Run `npm run dev` from `app/`, open `http://localhost:5173/tressette-scorekeeper/`.
1. Leave target at 41. Add hands via "+4" quick-add for one team until its score is 35 (nine taps).
2. Tap "🏆 Cilj 31 b".
3. Expected: the winner modal appears immediately for that team (35 ≥ 31), instead of the card just relabeling to "35 / 31 bodova" with no winner.
4. Refresh the page, repeat with scores below every target (e.g. stay at 10) and switch targets — expected: no winner modal, just the label updates, exactly as before.

- [ ] **Step 4: Commit**

```bash
git add app/src/games/TresetaBoard.jsx
git commit -m "fix: re-check win condition when target score changes mid-game"
```

---

### Task 2: Shorten the hand-score input placeholder so it doesn't get cut off

**Bug:** In `TresetaBoard.jsx`, the "Record Hand Score" input's placeholder is `` `${team1Name} bod. (0-${HAND_CAP})` ``. With the default 2-3 character names ("Mi") it fits; with a real name ("Ivan i Petra") it overflows the cramped input next to the opponent's score badge and the "Dodaj" button, and becomes unreadable.

**Files:**
- Modify: `app/src/games/TresetaBoard.jsx`

- [ ] **Step 1: Shorten the placeholder, keep the full text in `aria-label`**

Find (~`TresetaBoard.jsx:277-284`):

```jsx
              placeholder={`${team1Name} bod. (0-${HAND_CAP})`}
              aria-label={`${team1Name} bodovi ruke, 0 do ${HAND_CAP}`}
```

Change the placeholder line only (leave `aria-label` exactly as-is — it's not visually squeezed, no reason to shorten it):

```jsx
              placeholder={`${team1Name} (0-${HAND_CAP})`}
              aria-label={`${team1Name} bodovi ruke, 0 do ${HAND_CAP}`}
```

- [ ] **Step 2: Verify manually**

1. In the running app, rename Team A to "Ivan i Petra" (tap the name field, replace the text).
2. Look at the "Record Hand Score" input's placeholder text.
3. Expected: `Ivan i Petra (0-11)` is fully visible, not clipped, inside the input box.

- [ ] **Step 3: Commit**

```bash
git add app/src/games/TresetaBoard.jsx
git commit -m "fix: shorten hand-score input placeholder to prevent overflow with long names"
```

---

### Task 3: Banter lines never repeat back-to-back

**Change:** `pickRandom` in `banter.js` currently has no memory — the same line can be picked twice in a row. Both boards should track the last line shown (across jab and roast, since they're the same visual language) and exclude it from the next pick.

**Files:**
- Modify: `app/src/banter.js`
- Modify: `app/src/games/TresetaBoard.jsx`
- Modify: `app/src/games/BriskulaBoard.jsx`

**Interfaces:**
- `pickRandom(pool, exclude)` — `exclude` is optional; when given and the pool has more than one entry, the returned line will never equal `exclude`.

- [ ] **Step 1: Give `pickRandom` an optional exclude parameter**

In `app/src/banter.js`, replace:

```js
export const pickRandom = (pool) => pool[Math.floor(Math.random() * pool.length)];
```

with:

```js
export const pickRandom = (pool, exclude) => {
  const options = exclude != null && pool.length > 1 ? pool.filter((line) => line !== exclude) : pool;
  return options[Math.floor(Math.random() * options.length)];
};
```

- [ ] **Step 2: Track the last shown line in `TresetaBoard.jsx`**

Add a new piece of state alongside the existing `banterJab`/`roastLine` state (~`TresetaBoard.jsx:46-47`):

```jsx
  const [banterJab, setBanterJab] = useState(null);
  const [roastLine, setRoastLine] = useState(null);
  const [lastBanterLine, setLastBanterLine] = useState(null);
```

Then update both `pickRandom` call sites inside `checkWinCondition` to pass and update `lastBanterLine`. Find:

```jsx
      if (banterEnabled && !isTie && gap >= gapThreshold) {
        setBanterJab(pickRandom(BANTER_LINES));
      } else {
        setBanterJab(null);
      }
```

Change to:

```jsx
      if (banterEnabled && !isTie && gap >= gapThreshold) {
        const line = pickRandom(BANTER_LINES, lastBanterLine);
        setBanterJab(line);
        setLastBanterLine(line);
      } else {
        setBanterJab(null);
      }
```

And find:

```jsx
    if (banterEnabled) {
      setRoastLine(pickRandom(BANTER_LINES));
    } else {
      setRoastLine(null);
    }
```

Change to:

```jsx
    if (banterEnabled) {
      const line = pickRandom(BANTER_LINES, lastBanterLine);
      setRoastLine(line);
      setLastBanterLine(line);
    } else {
      setRoastLine(null);
    }
```

- [ ] **Step 3: Same change in `BriskulaBoard.jsx`**

Add the state (~`BriskulaBoard.jsx:50-51`):

```jsx
  const [banterJab, setBanterJab] = useState(null);
  const [roastLine, setRoastLine] = useState(null);
  const [lastBanterLine, setLastBanterLine] = useState(null);
```

Find:

```jsx
      if (banterEnabled && !isTie && gap >= BANTER_GAP_THRESHOLD) {
        setBanterJab(pickRandom(BANTER_LINES));
      } else {
        setBanterJab(null);
      }
```

Change to:

```jsx
      if (banterEnabled && !isTie && gap >= BANTER_GAP_THRESHOLD) {
        const line = pickRandom(BANTER_LINES, lastBanterLine);
        setBanterJab(line);
        setLastBanterLine(line);
      } else {
        setBanterJab(null);
      }
```

Find:

```jsx
      if (banterEnabled && status.matchWinner) {
        setRoastLine(pickRandom(BANTER_LINES));
      } else {
        setRoastLine(null);
      }
```

Change to:

```jsx
      if (banterEnabled && status.matchWinner) {
        const line = pickRandom(BANTER_LINES, lastBanterLine);
        setRoastLine(line);
        setLastBanterLine(line);
      } else {
        setRoastLine(null);
      }
```

- [ ] **Step 4: Verify manually**

1. In Trešeta, repeatedly add hands for the losing team to trigger the banter overlay multiple times in one game (it will now only show once per team per game after Task 4 — for this check, temporarily undo hands with "Poništi zadnje" and re-add them to force multiple triggers, or check Briškula which naturally re-triggers per partija).
2. Note each line shown. Expected: no two consecutive triggers show the identical line (10 lines total, so with repeats excluded you should see variety).

- [ ] **Step 5: Commit**

```bash
git add app/src/banter.js app/src/games/TresetaBoard.jsx app/src/games/BriskulaBoard.jsx
git commit -m "fix: banter lines never repeat back-to-back"
```

---

### Task 4: Banter overlay shows at most once per losing team per game

**Bug:** `checkWinCondition`/`checkPartijaCondition` re-triggers the big `BanterOverlay` on every single hand added while a team remains behind the gap threshold — it never remembers it already showed one. This blocks quick-add taps under the overlay repeatedly through a game, contradicting PRODUCT.md's "banter... never blocks or slows down actual score entry."

**Files:**
- Modify: `app/src/games/TresetaBoard.jsx`
- Modify: `app/src/games/BriskulaBoard.jsx`

**Interfaces:**
- Consumes: `lastBanterLine` state added in Task 3 (same file, no interface change).
- Produces: new `jabShown` state, `{ team1: boolean, team2: boolean }`, reset alongside the existing reset points that already clear `banterJab`/`roastLine`.

- [ ] **Step 1: Add `jabShown` state to `TresetaBoard.jsx`**

Next to the state added in Task 3:

```jsx
  const [banterJab, setBanterJab] = useState(null);
  const [roastLine, setRoastLine] = useState(null);
  const [lastBanterLine, setLastBanterLine] = useState(null);
  const [jabShown, setJabShown] = useState({ team1: false, team2: false });
```

- [ ] **Step 2: Only show the jab if this team hasn't been shown one yet this game**

Find the jab branch inside `checkWinCondition` (as left after Task 3):

```jsx
      if (banterEnabled && !isTie && gap >= gapThreshold) {
        const line = pickRandom(BANTER_LINES, lastBanterLine);
        setBanterJab(line);
        setLastBanterLine(line);
      } else {
        setBanterJab(null);
      }
```

Change to:

```jsx
      const loserKey = updated1 < updated2 ? "team1" : "team2";
      if (banterEnabled && !isTie && gap >= gapThreshold && !jabShown[loserKey]) {
        const line = pickRandom(BANTER_LINES, lastBanterLine);
        setBanterJab(line);
        setLastBanterLine(line);
        setJabShown((prev) => ({ ...prev, [loserKey]: true }));
      } else if (!banterJab) {
        setBanterJab(null);
      }
```

(The `else if (!banterJab)` guard avoids clearing an already-visible overlay just because a later hand doesn't newly qualify — it still clears on tie/win same as before via the other branches, and the overlay is dismissed by the user or its own countdown, never by this check.)

- [ ] **Step 3: Reset `jabShown` when the game resets**

Find `resetGame` (~`TresetaBoard.jsx:170`):

```jsx
  const resetGame = (fullReset) => {
    if (soundEnabled) playSound("tap");
    onUpdate({ scoreTeam1: 0, scoreTeam2: 0, rounds: [] });
    setShowWinnerModal(false);
    setBanterJab(null);
    setRoastLine(null);
```

Add one line:

```jsx
  const resetGame = (fullReset) => {
    if (soundEnabled) playSound("tap");
    onUpdate({ scoreTeam1: 0, scoreTeam2: 0, rounds: [] });
    setShowWinnerModal(false);
    setBanterJab(null);
    setRoastLine(null);
    setJabShown({ team1: false, team2: false });
```

- [ ] **Step 4: Same pattern in `BriskulaBoard.jsx`, reset per-partija (not just per-match)**

Add the state next to the Task 3 addition:

```jsx
  const [banterJab, setBanterJab] = useState(null);
  const [roastLine, setRoastLine] = useState(null);
  const [lastBanterLine, setLastBanterLine] = useState(null);
  const [jabShown, setJabShown] = useState({ team1: false, team2: false });
```

Find the jab branch inside `checkPartijaCondition`:

```jsx
      if (banterEnabled && !isTie && gap >= BANTER_GAP_THRESHOLD) {
        const line = pickRandom(BANTER_LINES, lastBanterLine);
        setBanterJab(line);
        setLastBanterLine(line);
      } else {
        setBanterJab(null);
      }
```

Change to:

```jsx
      const loserKey = updated1 < updated2 ? "team1" : "team2";
      if (banterEnabled && !isTie && gap >= BANTER_GAP_THRESHOLD && !jabShown[loserKey]) {
        const line = pickRandom(BANTER_LINES, lastBanterLine);
        setBanterJab(line);
        setLastBanterLine(line);
        setJabShown((prev) => ({ ...prev, [loserKey]: true }));
      } else if (!banterJab) {
        setBanterJab(null);
      }
```

Briškula scores reset every partija (unlike Trešeta's whole-game target), so `jabShown` must reset at every point that already resets `banterJab`/`roastLine` — that's `startNextPartija`, `replayTiedPartija`, and `resetMatch`. Find each:

```jsx
  const startNextPartija = () => {
    if (soundEnabled) playSound("tap");
    onUpdate({ scoreTeam1: 0, scoreTeam2: 0, rounds: [], currentPartija: currentPartija + 1 });
    setPartijaCompleteInfo(null);
  };
```

Change to:

```jsx
  const startNextPartija = () => {
    if (soundEnabled) playSound("tap");
    onUpdate({ scoreTeam1: 0, scoreTeam2: 0, rounds: [], currentPartija: currentPartija + 1 });
    setPartijaCompleteInfo(null);
    setJabShown({ team1: false, team2: false });
  };
```

```jsx
  const replayTiedPartija = () => {
    if (soundEnabled) playSound("tap");
    onUpdate({ scoreTeam1: 0, scoreTeam2: 0, rounds: [] });
    setPartijaTieNotice(false);
  };
```

Change to:

```jsx
  const replayTiedPartija = () => {
    if (soundEnabled) playSound("tap");
    onUpdate({ scoreTeam1: 0, scoreTeam2: 0, rounds: [] });
    setPartijaTieNotice(false);
    setJabShown({ team1: false, team2: false });
  };
```

And in `resetMatch`, next to the existing `setBanterJab(null); setRoastLine(null);`:

```jsx
    setBanterJab(null);
    setRoastLine(null);
    setMatchResult(null);
```

Change to:

```jsx
    setBanterJab(null);
    setRoastLine(null);
    setJabShown({ team1: false, team2: false });
    setMatchResult(null);
```

- [ ] **Step 5: Verify manually**

1. In Trešeta, add hands for one team only until the gap threshold is crossed (e.g. six "+4" taps with the other team at 0). Expected: overlay appears once.
2. Dismiss it (tap ×). Add another hand for the same losing team (still behind). Expected: **no** overlay this time — the game continues uninterrupted.
3. Tap "Nova igra" to reset, confirm. Repeat step 1. Expected: overlay appears again (fresh game, counter reset).
4. In Briškula, repeat the same check but across partije: trigger the overlay once in partija 1, confirm it doesn't re-trigger for more hands in partija 1, then start partija 2 (win or tie it out) and confirm the overlay can trigger again in the new partija.

- [ ] **Step 6: Commit**

```bash
git add app/src/games/TresetaBoard.jsx app/src/games/BriskulaBoard.jsx
git commit -m "fix: show banter overlay at most once per losing team per game/partija"
```

---

### Task 5: Add a persisted "Past Games" history to `storage.js`

**Files:**
- Modify: `app/src/storage.js`

**Interfaces:**
- Produces: `DEFAULT_TRESETA_STATE.history` and `DEFAULT_BRISKULA_STATE.history`, both `[]`.
- Produces: `addHistoryEntry(history, entry, cap = 20)` — pure function, returns a new array with `entry` prepended and truncated to `cap` items. Later tasks call this and pass the result to `onUpdate`.

- [ ] **Step 1: Add `history: []` to both default state objects**

In `app/src/storage.js`, find:

```js
export const DEFAULT_TRESETA_STATE = {
  targetScore: 41,
  scoreTeam1: 0,
  scoreTeam2: 0,
  gamesWon1: 0,
  gamesWon2: 0,
  rounds: [],
};
```

Change to:

```js
export const DEFAULT_TRESETA_STATE = {
  targetScore: 41,
  scoreTeam1: 0,
  scoreTeam2: 0,
  gamesWon1: 0,
  gamesWon2: 0,
  rounds: [],
  history: [],
};
```

Find:

```js
export const DEFAULT_BRISKULA_STATE = {
  scoreTeam1: 0,
  scoreTeam2: 0,
  rounds: [],
  partijeWon1: 0,
  partijeWon2: 0,
  currentPartija: 1,
  completedPartije: [],
};
```

Change to:

```js
export const DEFAULT_BRISKULA_STATE = {
  scoreTeam1: 0,
  scoreTeam2: 0,
  rounds: [],
  partijeWon1: 0,
  partijeWon2: 0,
  currentPartija: 1,
  completedPartije: [],
  history: [],
};
```

No change is needed to `loadPersistedState`'s merge logic — it already does `{ ...DEFAULT_TRESETA_STATE, ...parsed.treseta }`, so a user with old saved state (no `history` field) automatically gets `history: []` filled in from the default.

- [ ] **Step 2: Add the capped-prepend helper**

At the bottom of `app/src/storage.js`, after `savePersistedState`:

```js

// Prepends a new entry to a history array, capping its length so
// localStorage doesn't grow unbounded over months of play.
export const addHistoryEntry = (history, entry, cap = 20) =>
  [entry, ...history].slice(0, cap);
```

- [ ] **Step 3: Verify manually**

Run `npm run build` — confirms no syntax errors. (No UI change yet from this task alone; the field just exists in the default shape.)

- [ ] **Step 4: Commit**

```bash
git add app/src/storage.js
git commit -m "feat: add capped completed-games history field to persisted state"
```

---

### Task 6: Record and display Trešeta game history

**Files:**
- Modify: `app/src/games/TresetaBoard.jsx`

**Interfaces:**
- Consumes: `addHistoryEntry` from `app/src/storage.js` (Task 5).
- Consumes: `state.history` (array of `{ id, winner, score1, score2, targetScore, playedAt }`).

- [ ] **Step 1: Import the helper and destructure `history` from state**

Find the import block and add `addHistoryEntry`:

```jsx
import { playSound } from "../sound.js";
```

There's no existing import from `storage.js` in this file — add one:

```jsx
import { playSound } from "../sound.js";
import { addHistoryEntry } from "../storage.js";
```

Find the state destructure (~`TresetaBoard.jsx:34`):

```jsx
  const { targetScore, scoreTeam1, scoreTeam2, gamesWon1, gamesWon2, rounds } = state;
```

Change to:

```jsx
  const { targetScore, scoreTeam1, scoreTeam2, gamesWon1, gamesWon2, rounds, history } = state;
```

- [ ] **Step 2: Push a history entry when a game is won**

Find the winner branch in `checkWinCondition`, specifically the `onUpdate(...)` call that increments `gamesWon1`/`gamesWon2`:

```jsx
    onUpdate(
      winner === team1Name
        ? { gamesWon1: gamesWon1 + 1 }
        : { gamesWon2: gamesWon2 + 1 }
    );
```

Change to:

```jsx
    const historyEntry = {
      id: Date.now(),
      winner,
      score1: updated1,
      score2: updated2,
      targetScore: targetOverride,
      playedAt: new Date().toLocaleString([], {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    onUpdate({
      ...(winner === team1Name
        ? { gamesWon1: gamesWon1 + 1 }
        : { gamesWon2: gamesWon2 + 1 }),
      history: addHistoryEntry(history, historyEntry),
    });
```

- [ ] **Step 3: Add the "Prošle igre" card**

Find the closing of the "SCORE HISTORY SECTION" card, right before the "Reset Action" comment (~`TresetaBoard.jsx:366-369`):

```jsx
      </div>

      {/* Reset Action */}
```

Insert a new card between them:

```jsx
      </div>

      {/* PAST GAMES */}
      {history.length > 0 && (
        <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-3xl p-4 border-2 border-amber-300/80 shadow-xl space-y-2 text-slate-900">
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-serif border-b border-amber-200/80 pb-2">
            <Trophy size={14} className="text-amber-700" />
            Prošle igre ({history.length})
          </h2>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between bg-white/80 p-2 rounded-xl text-xs border border-amber-200/80"
              >
                <span className="text-slate-500 font-mono text-[10px] shrink-0">{h.playedAt}</span>
                <span className="font-bold text-amber-800 text-[11px] truncate px-2">{h.winner} pobjeđuje</span>
                <span className="font-mono font-bold text-slate-900 text-[11px] shrink-0">
                  {h.score1} - {h.score2}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Action */}
```

`Trophy` is already imported in this file (used by the winner modal icon), so no new import is needed for the card heading icon.

- [ ] **Step 4: Verify manually**

1. Play a full Trešeta game to completion (any target). Dismiss the winner modal.
2. Scroll down — expected: a new "Prošle igre (1)" card appears below the hand history, showing the date/time, winner name, and final score.
3. Play a second game with a different winner. Expected: the card now shows "Prošle igre (2)" with the newest game listed first.
4. Refresh the page. Expected: both entries are still there (persisted).
5. Play 21 games in a row (or temporarily lower `cap` to 2 in dev tools to check faster) — expected: the list never exceeds 20 entries, oldest drops off.

- [ ] **Step 5: Commit**

```bash
git add app/src/games/TresetaBoard.jsx
git commit -m "feat: record and display past Trešeta games"
```

---

### Task 7: Record and display Briškula match history

**Files:**
- Modify: `app/src/games/BriskulaBoard.jsx`

**Interfaces:**
- Consumes: `addHistoryEntry` from `app/src/storage.js` (Task 5).
- Consumes: `state.history` (array of `{ id, winner, partije1, partije2, tied, sweep, playedAt }`).

Only full **matches** are recorded (not individual partije — those already live in `completedPartije` within the in-progress match and reset with it).

- [ ] **Step 1: Import the helper and destructure `history` from state**

```jsx
import { playSound } from "../sound.js";
import { addHistoryEntry } from "../storage.js";
```

Find the state destructure (~`BriskulaBoard.jsx:37-45`):

```jsx
  const {
    scoreTeam1,
    scoreTeam2,
    rounds,
    partijeWon1,
    partijeWon2,
    currentPartija,
    completedPartije,
  } = state;
```

Change to:

```jsx
  const {
    scoreTeam1,
    scoreTeam2,
    rounds,
    partijeWon1,
    partijeWon2,
    currentPartija,
    completedPartije,
    history,
  } = state;
```

- [ ] **Step 2: Push a history entry when the match ends**

Find the `status.matchOver` branch in `checkPartijaCondition`:

```jsx
    if (status.matchOver) {
      if (banterEnabled && status.matchWinner) {
        const line = pickRandom(BANTER_LINES, lastBanterLine);
        setRoastLine(line);
        setLastBanterLine(line);
      } else {
        setRoastLine(null);
      }
      setMatchResult(status);
      setShowMatchWinnerModal(true);
    } else {
```

Add the history push right after `setMatchResult(status);`:

```jsx
    if (status.matchOver) {
      if (banterEnabled && status.matchWinner) {
        const line = pickRandom(BANTER_LINES, lastBanterLine);
        setRoastLine(line);
        setLastBanterLine(line);
      } else {
        setRoastLine(null);
      }
      setMatchResult(status);
      onUpdate({
        history: addHistoryEntry(history, {
          id: Date.now(),
          winner: status.matchWinner,
          partije1: newPartijeWon1,
          partije2: newPartijeWon2,
          tied: status.tied,
          sweep: status.sweep,
          playedAt: new Date().toLocaleString([], {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }),
      });
      setShowMatchWinnerModal(true);
    } else {
```

- [ ] **Step 3: Add the "Prošle igre" card**

Find the closing of the "COMPLETED PARTIJE HISTORY" card (~`BriskulaBoard.jsx:414-437`), right before the "Reset Action" comment:

```jsx
        </div>
      )}

      {/* Reset Action */}
```

Insert:

```jsx
        </div>
      )}

      {/* PAST MATCHES */}
      {history.length > 0 && (
        <div className="bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-3xl p-4 border-2 border-amber-300/80 shadow-xl space-y-2 text-slate-900">
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-serif border-b border-amber-200/80 pb-2">
            <Trophy size={14} className="text-amber-700" />
            Prošli mečevi ({history.length})
          </h2>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between bg-white/80 p-2 rounded-xl text-xs border border-amber-200/80"
              >
                <span className="text-slate-500 font-mono text-[10px] shrink-0">{h.playedAt}</span>
                <span className="font-bold text-amber-800 text-[11px] truncate px-2">
                  {h.tied ? "Neriješeno" : h.sweep ? `${h.winner} (česalj)` : `${h.winner} pobjeđuje`}
                </span>
                <span className="font-mono font-bold text-slate-900 text-[11px] shrink-0">
                  {h.partije1} - {h.partije2}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Action */}
```

`Trophy` is already imported in this file (used by the match-winner modal icon).

- [ ] **Step 4: Verify manually**

1. Play a full Briškula match to completion (4 partije, any result — win, sweep, or 2-2 tie).
2. Dismiss the match winner modal.
3. Scroll down — expected: a "Prošli mečevi (1)" card appears, showing date/time, result (winner, "(česalj)" if swept, or "Neriješeno" if tied), and the partije score.
4. Refresh the page. Expected: the entry persists.
5. Switch to Trešeta and back to Briškula — expected: Briškula's history is untouched by anything happening in Trešeta (separate `history` arrays per mode, per the existing state-isolation pattern already used for `rounds`/`completedPartije`).

- [ ] **Step 5: Commit**

```bash
git add app/src/games/BriskulaBoard.jsx
git commit -m "feat: record and display past Briškula matches"
```

---

### Task 8: Final verification pass

- [ ] **Step 1: Lint**

```bash
cd app && npm run lint
```

Expected: no errors (oxlint).

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: builds cleanly, no bundler errors.

- [ ] **Step 3: Full manual regression pass on the dev server**

Run `npm run dev`, open `http://localhost:5173/tressette-scorekeeper/`, clear localStorage (`localStorage.clear()` in devtools, then reload) and walk through:
1. Play one Trešeta game and one Briškula match to completion — confirm both "Prošle igre"/"Prošli mečevi" cards appear and persist across a reload.
2. Trigger the banter overlay in each mode — confirm it shows once per losing team per game/partija, not on every hand, and that two consecutive lines are never identical.
3. Rename a team to something longer than 10 characters — confirm the hand-score input placeholder stays readable.
4. Change the Trešeta target score after scoring past the new target — confirm the winner modal fires immediately instead of waiting for the next hand.

- [ ] **Step 4: Commit (if any fixups were needed)**

```bash
git add -A
git commit -m "chore: fixups from final verification pass"
```
