---
name: Tressette Scorekeeper
description: A felt-table card scorekeeper for Trešeta and Briškula, lit like a real table at night
colors:
  deep-felt: "#022c22"
  felt-panel: "#064e3b"
  gold-leaf-deep: "#b45309"
  gold-leaf: "#f59e0b"
  gold-leaf-bright: "#eab308"
  parchment: "#fffbeb"
  parchment-deep: "#fef3c7"
  parchment-border: "#fde68a"
  garnet-deep: "#be123c"
  garnet: "#e11d48"
  garnet-bright: "#f43f5e"
  team-harbor-blue: "#1e3a8a"
  team-crimson: "#7f1d1d"
  ember: "#f97316"
  ink: "#0f172a"
  ink-soft: "#475569"
typography:
  display:
    fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
    fontSize: "3rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.625rem"
    fontWeight: 700
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
components:
  button-quick-add:
    backgroundColor: "{colors.parchment-border}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 8px"
  button-primary-treseta:
    backgroundColor: "{colors.gold-leaf}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-briskula:
    backgroundColor: "{colors.garnet}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  card-scorecard:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  modal-surface:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: Tressette Scorekeeper

## Overview

**Creative North Star: "The Felt Table at Night"**

The whole system reads as one physical object: a card table lit from above in a dim room. The base is a near-black emerald felt that recedes into shadow at the edges — never a flat, evenly-lit app background. Every interactive surface traces itself in warm metal or stone: Gold Leaf for Trešeta, Garnet for Briškula, both inlaid rather than painted on, both catching light the way real trim does. The scorecards themselves aren't UI panels — they're parchment dealt face-up onto the felt, cream and slightly warm, holding the actual numbers in heavy serif type like ink on paper.

Two games share one table. Trešeta and Briškula never repaint the felt or the parchment — they only swap which metal is inlaid into the trim, so switching modes feels like the dealer changing the game, not the app changing skins. Team identity (blue vs. crimson) is separate from mode identity again: it belongs to the players sitting at the table, not to which game they're playing, so it never changes when the mode switch is tapped.

Nothing here is flat-app-default. There is no white background, no system sans-serif headline, no drop-shadow-free card. The felt is dark, the trim is warm and directional, and the parchment holds a real shadow like it's sitting slightly above the table.

**Key Characteristics:**
- Near-black emerald felt base, never a light or neutral-gray background
- One warm metallic/stone accent per game mode (Gold Leaf / Garnet), used for trim, active states, and primary actions — never for both modes' UI at once
- Parchment-cream scorecards and modals, warm and slightly aged, not stark white
- Heavy serif display type for anything that's "the number" (scores, headlines); monospace for anything tabular (history rows, timestamps, running totals)
- Every tap gives tactile feedback (`active:scale-95`); every elevated surface casts a real, often colored, shadow

## Colors

Warm and low-saturation everywhere except the two mode accents, which are saturated on purpose — they're the only elements allowed to feel "bright."

### Primary
- **Gold Leaf** (`#f59e0b` → `#eab308` gradient, "gold-leaf" / "gold-leaf-bright"): Trešeta's mode accent. Used for the active mode-switch tab, the target-score segmented control, primary action buttons, and the trophy/win modal. Deeper tone **Gold Leaf Deep** (`#b45309`) is text-on-parchment (icons, labels, small captions).

### Secondary
- **Garnet** (`#e11d48` → `#f43f5e` gradient, "garnet" / "garnet-bright"): Briškula's mode accent, doing the identical job Gold Leaf does for Trešeta (active tab, progress bar, primary buttons, win/sweep modal) so switching modes is legible at a glance. **Garnet Deep** (`#be123c`) borders the win modal and confirm dialogs.

### Neutral
- **Deep Felt** (`#022c22`): the page background itself — near-black emerald, set directly on `html, body`, not a token most components reference.
- **Felt Panel** (`#064e3b`): the header bar and any chrome panel sitting directly on the felt (progress bars, segmented-control tracks) — one step lighter than the base so it reads as a panel, not a hole.
- **Parchment** (`#fffbeb` → `#fef3c7` gradient, "parchment" / "parchment-deep"): every scorecard, modal, and input surface. Warm cream, never pure white.
- **Parchment Border** (`#fde68a`): the hairline border/divider on every parchment surface, and the resting color of Quick Add / Card Points buttons before they're pressed.
- **Ink** (`#0f172a`) / **Ink Soft** (`#475569`): body and secondary text on parchment. Ink for anything that must read immediately (scores, names); Ink Soft for captions and helper copy.

### Named Rules
**The One Metal Rule.** Only one mode accent (Gold Leaf or Garnet) is active on screen at a time, and it's whichever mode is currently selected. Never blend or alternate them within one board.
**The Team-Stays-Put Rule.** Team A/Team B colors (Harbor Blue / Team Crimson, below) never change when the mode switches — they identify the player, not the game.

## Typography

**Display Font:** `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif` (system serif — no webfont is loaded)
**Body/UI Font:** `ui-sans-serif, system-ui, sans-serif`
**Label/Mono Font:** `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

**Character:** A heavy serif carries every number and every heading that matters — it's what makes a "44" on a scorecard feel like a printed total rather than a UI counter. Sans-serif is reserved for interactive chrome (buttons, toggles, form fields). Monospace marks anything tabular or literally counted (hand numbers, running totals, timestamps), so the eye can scan a column of numbers without the display font's weight fighting it.

### Hierarchy
- **Display** (font-black, `text-5xl`/48px, line-height 1): the live score number on each TeamCard — the single most important number on screen.
- **Title** (font-bold, `text-base`–`text-xl`/16–20px, serif): app header title, modal headlines ("VICTORY!", "ČESALJ! SWEEP!").
- **Body** (font-bold/font-semibold, `text-xs`/12px, sans): button labels, banner copy, form placeholders — the working size for nearly all UI text.
- **Label** (font-bold, `text-[9-11px]`, mono, uppercase, tracked): section headings ("QUICK ADD", "AKUŽE (DECLARATIONS)"), score-suffix captions, hand/partija numbers, timestamps.

### Named Rules
**The Printed-Number Rule.** Any number that represents "the score" — the live TeamCard total, final scores in a winner modal — is always the serif Display style, never mono or sans. Mono is for counting/indexing (hand #, timestamps), not for the score itself.

## Layout

Single-column mobile-first layout, capped at `max-w-md` (28rem) and centered — this is a phone-in-hand tool, not a responsive multi-column dashboard. Content stacks vertically in a fixed rhythm: mode switcher → progress/target indicator → notices (tie/banter) → two-column team grid (`grid-cols-2`, `gap-3`) → primary entry surface → history list → reset action, all separated by a consistent `space-y-4` (16px) rhythm. The header is `sticky top-0` so mode switching and toggles stay reachable while the history list scrolls. History lists internally scroll (`max-h-64`–`max-h-80 overflow-y-auto`) rather than growing the page, so the fixed-height "table" never reflows around a long game.

## Elevation & Depth

Tactile and lamplit, not flat. Every parchment surface sits visibly above the felt with a real shadow (`shadow-xl` on cards, `shadow-2xl` on modals) — depth is structural, not just a hover response. Circular icon badges (header logo, trophy/sweep icon) carry a soft colored glow matched to their own accent (`shadow-amber-900/50`, `shadow-amber-500/30`, `shadow-rose-500/30`) rather than a generic gray shadow, reinforcing which "metal" is lit. Recessed surfaces (segmented controls, input fields) use `shadow-inner` to read as a groove cut into the felt/parchment rather than a raised chip.

### Shadow Vocabulary
- **Card elevation** (`shadow-xl`): scorecards, main content panels — the primary "sitting on the table" depth.
- **Modal elevation** (`shadow-2xl`): confirm dialogs and winner/sweep modals — the highest surface in the stack.
- **Button elevation** (`shadow-sm`/`shadow-md`): quick-add buttons, primary actions — light lift, confirms tappability.
- **Recessed** (`shadow-inner`): segmented controls, text inputs — a groove, not a raised element.
- **Accent glow** (`shadow-{accent}-500/30`, `shadow-{accent}-900/50`): circular icon badges and trophy/sweep icons, colored to match whichever accent (gold or garnet) is active.

### Named Rules
**The Lit-From-Above Rule.** Shadows are always warm/colored when they sit under an accent element (icons, trophy circles) and neutral only for plain parchment surfaces. A gray shadow under a gold or garnet circle would break the "lit table" illusion.

## Shapes

Rounded throughout, never sharp — this is a soft, tactile object, not a technical instrument. Corner radius scales with surface size: small interactive chips and buttons use `rounded-xl` (12px), major content cards and modals use `rounded-3xl` (24px), and every circular badge (logo mark, toggle buttons, trophy icon) is `rounded-full`. Borders are consistently 2px on primary surfaces (`border-2`) and hairline (1px, high-opacity-reduced) on internal dividers — never no border on a parchment surface, since the border is what separates "dealt card" from "background."

## Components

### Buttons
- **Shape:** `rounded-xl` (12px) for quick-add/card-point buttons and primary actions; `rounded-full` for circular icon toggles (Sound/Wake-Lock/Banter).
- **Quick Add / Card Points (Team-tinted):** background is the team's own tint (Harbor Blue `blue-100`/`blue-200` or Team Crimson `red-100`/`red-200`), never the mode accent — these buttons belong to the player, not the game mode.
- **Primary action (mode-tinted):** solid Gold Leaf or Garnet fill depending on active mode ("Start Next Partija", segmented target-score control's active state). `active:scale-95` on every button, no exceptions — the tactile-press feedback is load-bearing for the "physical table" feel.
- **Destructive:** solid `red-700`/`red-800` regardless of active mode — reset confirmation is a semantic red, not a mode accent, so it never gets confused with Team Crimson or Garnet.
- **Ghost/ Icon toggles:** transparent/dark until active, then accent-tinted background at low opacity (`bg-amber-500/20`) with a matching border — used for the header's Sound/Wake-Lock/Banter toggles.

### Cards (TeamCard)
- **Corner Style:** `rounded-3xl` (24px).
- **Background:** Parchment gradient (`from-amber-50 to-amber-100/90`).
- **Border:** 2px, `parchment-border` at reduced opacity.
- **Shadow Strategy:** `shadow-xl`, see Elevation.
- **Internal Padding:** 16px (`p-4`), with an internal `space-y-3` rhythm separating name/score/quick-add zones, and a divider (`border-t`) before the quick-add row.
- **Signature behavior:** the score number re-triggers a `score-pop` scale animation (`320ms cubic-bezier(0.16, 1, 0.3, 1)`) on every change, keyed by the score value itself — this is the one moment of motion players actually watch.

### Modals (Confirm / Winner / Sweep)
- **Corner Style:** `rounded-3xl` (24px).
- **Background:** Parchment, solid for confirm dialogs, gradient for winner/sweep modals.
- **Border:** 2px, mode-accent-tinted on winner/sweep modals (Gold Leaf or Garnet border depending on mode), neutral parchment border on confirm dialogs.
- **Entrance:** `modal-in` (scale 0.94→1 + translateY 8px→0, 320ms) over a `fade-in` (180ms) backdrop blur — always together, never the backdrop alone.
- **Icon badge:** circular, gradient-filled in the mode accent, centered above the headline — Trophy for a normal win, PartyPopper for a sweep/česalj.

### Navigation (Mode Switcher / Segmented Controls)
- **Style:** pill-shaped track (`rounded-2xl`) on Felt Panel background with `shadow-inner`, containing equal-width segment buttons; the active segment gets a solid accent gradient fill and a `shadow-md` lift, inactive segments are transparent text-only.
- **Mode-specific accent:** critical distinction — the mode switcher's active-tab fill is Gold Leaf when Trešeta is selected and Garnet when Briškula is selected, making the switcher itself the primary "which game am I in" signal.

## Do's and Don'ts

### Do:
- **Do** keep the felt (`deep-felt`/`felt-panel`) and parchment (`parchment`/`parchment-deep`) pairing as the base of every screen — dark base, warm-light content surfaces.
- **Do** use Gold Leaf for all Trešeta-mode chrome and Garnet for all Briškula-mode chrome, consistently across the mode switcher, progress indicators, primary buttons, and win modals.
- **Do** keep Team A/Team B (Harbor Blue/Team Crimson) fixed regardless of active mode.
- **Do** give every elevated surface a real, often colored, shadow — this system has no flat cards.
- **Do** use the serif Display style for score numbers specifically, never for arbitrary large text.
- **Do** add `active:scale-95` to every tappable control.

### Don't:
- **Don't** introduce a third mode-accent color; the system is built for exactly two games sharing one felt/parchment base.
- **Don't** use Garnet or Gold Leaf for team identity, or Harbor Blue/Team Crimson for mode identity — those two axes must stay independent.
- **Don't** flatten cards or modals to a borderless, shadowless surface — it breaks the "dealt onto the table" read.
- **Don't** introduce a webfont; the serif/sans/mono system stack is deliberate (fast load on a phone at a card table, no FOUT).
- **Don't** use pure white or pure black surfaces; even "white" rows inside history lists are `white/80` over parchment, never opaque white.
