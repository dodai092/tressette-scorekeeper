# Responsive App Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the header and main content on desktop while expanding the shared centered rail from `28rem` to `42rem` at the `md` breakpoint.

**Architecture:** Keep the existing single-column shell in `app/src/App.jsx`. Define the responsive rail utility string once in the component module and apply it to both the header and main elements, preserving all existing child layout and behavior.

**Tech Stack:** React 19, Tailwind CSS v4 utilities, Vite, Oxlint.

## Global Constraints

- Keep the mobile cap at `28rem` via `max-w-md`.
- Expand the rail to `42rem` via `md:max-w-2xl` at `768px`.
- Keep the header and main centered with `mx-auto w-full`.
- Preserve existing padding, sticky behavior, game state, persistence, and Croatian copy.
- Run `npm run lint` and `npm run build` from `app/`.

---

### Task 1: Apply the shared responsive rail

**Files:**
- Modify: `app/src/App.jsx:1-166`

**Interfaces:**
- Consumes: Existing `App` shell and Tailwind utility classes.
- Produces: A shared `CONTENT_RAIL_CLASS` applied to both `header` and `main`.

- [ ] **Step 1: Define the shared rail classes**

Add this module-level constant after the imports:

```jsx
const CONTENT_RAIL_CLASS = "w-full max-w-md md:max-w-2xl mx-auto";
```

- [ ] **Step 2: Apply the rail to the header**

Change the header class from the full-viewport layout to include the shared rail while retaining its current visual and positioning classes:

```jsx
<header className={`${CONTENT_RAIL_CLASS} sticky top-0 z-30 bg-felt-panel/90 backdrop-blur-md border-b border-amber-600/30 px-4 py-3 flex flex-wrap items-center gap-y-2 shadow-lg`}>
```

- [ ] **Step 3: Apply the rail to the main element**

Replace the main element’s existing `max-w-md mx-auto w-full` segment with the shared class, preserving its `flex-1`, padding, spacing, stacking, z-index, and font utilities:

```jsx
<main className={`${CONTENT_RAIL_CLASS} flex-1 px-4 py-4 flex flex-col space-y-4 z-10 font-sans`}>
```

- [ ] **Step 4: Review the diff for scope**

Run:

```bash
git diff -- app/src/App.jsx
```

Expected: only the shared rail constant and header/main class changes appear; no game or persistence code changes are present.

### Task 2: Verify responsive shell behavior

**Files:**
- Verify: `app/src/App.jsx`

- [ ] **Step 1: Run lint**

Run from `app/`:

```bash
npm run lint
```

Expected: Oxlint completes successfully.

- [ ] **Step 2: Run the production build**

Run from `app/`:

```bash
npm run build
```

Expected: Vite produces the production bundle in `app/dist` without errors.

- [ ] **Step 3: Manually inspect responsive widths**

Run from `app/`:

```bash
npm run dev
```

Check a narrow mobile viewport and viewports at or above `768px`. Confirm the header panel and main content share the same centered left and right edges, the rail is `28rem` below `md`, and it expands to `42rem` at `md` and above. Confirm the header controls and mode switcher remain usable.
