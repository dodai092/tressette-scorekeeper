# Tressette Scorekeeper

A felt-table card scorekeeper for **Trešeta** and **Briškula** — built for real-world play, not a
generic tally counter. One phone sits at the table and gets tapped or passed around as points are
scored, no login and no multiplayer sync required.

Live at: https://dodai092.github.io/tressette-scorekeeper/

## Why

A plus/minus counter can add arbitrary numbers, but it can't enforce or reflect either game's real
scoring structure. This app can:

- **Trešeta** — hand scores are capped at 11 points; entering one team's score auto-fills the
  opponent's so they always sum to 11. Akuže declarations are tracked separately from hand points.
  Target score is a 31/41/51 choice matching real house-rule variants.
- **Briškula** — card-value quick-add buttons (Ace/Three/King/Knight/Jack) mirror the actual point
  values in the 120-point deck, a partija auto-resolves at 61+ points, and match structure is real
  best-of-4 partije with 4-0 "česalj" (sweep) detection.

Both modes keep their own independent match in progress, since a household may have one game going
in each. See [`PRODUCT.md`](./PRODUCT.md) for the full product rationale.

## Tech

React 19 + Vite + Tailwind v4, no backend. All state (scores, round history, team names) lives in
the browser's `localStorage`. Deployed as a static site to GitHub Pages, auto-built and published
on every push to `main`.

## Development

```bash
cd app
npm install
npm run dev       # start the dev server
npm run build     # production build
npm run lint       # oxlint
```

See [`CLAUDE.md`](./CLAUDE.md) for architecture notes if you're working on this with an AI coding
agent.
