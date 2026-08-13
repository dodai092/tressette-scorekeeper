# Repository Guidelines

## Project Structure & Module Organization

The deployable React 19 application lives in `app/`; run all npm commands there. `app/src/App.jsx` owns the shared shell and persisted state. Game-specific UI and pure scoring logic are paired under `app/src/games/` (for example, `TresetaBoard.jsx` and `treseta.js`). Reusable UI belongs in `app/src/components/`, while persistence, sound, banter, and mode accents are separate modules in `app/src/`. Static icons and the web manifest live in `app/public/`. Product and visual decisions are documented in `PRODUCT.md` and `DESIGN.md`; implementation plans are under `docs/plans/`.

## Build, Test, and Development Commands

From `app/`, use:

```bash
npm install       # install locked dependencies
npm run dev       # start the Vite development server
npm run lint      # run Oxlint across the source tree
npm run build     # create the production bundle in app/dist
npm run preview   # serve the production bundle locally
```

Before submitting changes, run both `npm run lint` and `npm run build`. Pushes to `main` deploy through `.github/workflows/deploy.yml` to GitHub Pages.

## Coding Style & Naming Conventions

Follow the existing JavaScript/JSX style: two-space indentation, semicolons, double quotes, and ES modules. Name React components and component files in PascalCase (`TeamCard.jsx`); use camelCase for functions and state, and UPPER_SNAKE_CASE for constants. Keep scoring rules in pure game modules and UI state in board components. Use Tailwind v4 utilities and the CSS tokens in `index.css`; consult `DESIGN.md` before introducing new visual patterns. All user-facing copy, including accessibility labels, must remain Croatian.

## Testing Guidelines

There is currently no automated test framework or coverage threshold. Treat linting and building as baseline checks, then manually exercise the affected flow on a phone-sized viewport. Verify scoring, undo/history behavior, mode switching, reload persistence, and both felt themes when relevant. If tests are introduced, colocate them with source modules using `*.test.js` or `*.test.jsx`.

## Commit & Pull Request Guidelines

History uses short, imperative, sentence-case subjects such as `Add manual point entry for Briškula`. Keep each commit focused and explain non-obvious rule changes in the body. Pull requests should summarize user-visible behavior, list verification performed, link relevant issues or plans, and include before/after screenshots for UI changes. Call out localStorage schema changes explicitly; persisted-shape changes require a storage-key version bump.
