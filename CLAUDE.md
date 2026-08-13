# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page React app that scores two Croatian card games — Trešeta and Briškula — for
in-person play on a shared phone (see `PRODUCT.md` for full product context: users, positioning,
principles). No backend, no accounts; state lives entirely in `localStorage`.

## Commands

All commands run from `app/` (the repo root only holds docs and the project shell):

```bash
cd app
npm run dev       # start Vite dev server
npm run build     # production build to app/dist
npm run lint      # oxlint
npm run preview   # preview a production build
```

There is no automated test suite. After making a change, verify it by running the dev server
and exercising the affected flow in the browser (or use the `/run` skill) rather than assuming
correctness from a lint/build pass alone.

Deploys are automatic: pushing to `main` triggers `.github/workflows/deploy.yml`, which builds
`app/` and publishes `app/dist` to GitHub Pages under the `/tressette-scorekeeper/` base path
(set in `vite.config.js`).

## Architecture

**Shell vs. modes.** `App.jsx` owns everything shared across both games: the header, team name
inputs, sound/banter/theme toggles, and the mode switcher. It loads/saves the *entire* persisted
blob (both modes' state at once) and passes each mode a slice of state plus an `onUpdate(partial)`
setter. Only the active mode's board is mounted — switching modes doesn't unmount-and-lose the
other mode's in-progress match, since state lives in `App`, not in the board components.

**Two independent game modes, same shape of code.** `treseta`/`briskula` each get:
- a pure logic module (`src/games/treseta.js`, `src/games/briskula.js`) — win/partija conditions,
  running-total recalculation (`recalcTotals`/`recalcPartijaTotals`), constants. No React, no I/O.
- a board component (`src/games/TresetaBoard.jsx`, `src/games/BriskulaBoard.jsx`) — all UI, local
  UI state (modals, banter jab text, pending inputs), and calls into the logic module.

These two modes must never share scoring logic or bleed state into each other — only the shell
(header, team names, toggles, felt/parchment theme) is shared. When adding a feature to one mode,
check whether the equivalent exists in the other before assuming parity, but don't force identical
UI if the underlying game rule differs (see `PRODUCT.md` → Product Principles).

**Rounds are newest-first.** Both games store `rounds` as an array with index 0 = most recent.
`recalcTotals`/`recalcPartijaTotals` walk the array backwards to rebuild running totals bottom-up
— this is what makes undo/delete-a-round safe (recompute from the full history rather than
patching a running counter). Follow this pattern for any new history-mutating feature.

**Persistence** (`storage.js`): one versioned localStorage key
(`tressette-scorekeeper-state-v2`). On any shape mismatch (old version, corrupted JSON, missing
fields) it falls back to defaults wholesale rather than migrating — this is a single-user local
app, so migration logic isn't worth it. If you change the persisted shape, bump the version
suffix rather than writing a migration. Saves are debounced (300ms) in `App.jsx` so typing a team
name doesn't re-serialize both modes' full round history on every keystroke.

**Session-only vs. persisted state.** Sound/banter toggle state and theme are intentionally *not*
persisted (they reset to defaults each load) — only match/score state and team names survive a
reload. Keep this distinction when adding new toggles or settings.

**Styling.** Tailwind v4 via `@tailwindcss/vite` (no `tailwind.config.js` — v4 is CSS-first,
see `index.css`). The felt/gold/parchment visual language and per-component tokens are specified
in `DESIGN.md`; `modeAccents.js` centralizes the per-mode (Trešeta gold vs. Briškula rose) Tailwind
class sets so an accent change is one edit instead of a grep-and-replace across board components.
Light mode ("Sunlit Felt") is toggled via `data-theme="light"` on the root div.

**UI language is Croatian.** All user-facing strings (labels, aria-labels, button text) are in
Croatian — this app is not internationalized and has no plan to be; keep new strings consistent
with the existing register (see git history: "Translate app to Croatian").

**Banter system** (`banter.js`, `BanterOverlay.jsx`): a shared pool of taunt lines shown either as
a mid-game overlay (team meaningfully behind, gap ≥ ~35% of target/pool) or in the end-of-match
winner modal. Purely cosmetic — never gates or alters scoring. Both game logic modules define
their own `BANTER_GAP_THRESHOLD` scaled to that game's own scoring range.
