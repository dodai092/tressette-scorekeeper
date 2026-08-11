# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The host (and whoever else picks up the phone at the table) during an in-person Trešeta or Briškula card game, played with friends and family. It's a shared single-device scorekeeper — one phone sits at the table and gets tapped/passed as points are scored, not a per-player synced app. There is no login, no accounts, no multiplayer sync; state lives in that one device's `localStorage`.

## Product Purpose

Tracks live score for two Croatian trick-taking card games — Trešeta and Briškula — during real-world play, so players don't need pen and paper or a generic tally counter. Each game mode encodes that game's actual scoring structure (not just "+1" buttons), so a hand or partija can't be mis-recorded relative to the real rules.

## Positioning

A generic score counter or pen-and-paper tally can add arbitrary numbers, but can't enforce or reflect either game's real structure. This app can, because it's built around each game's actual mechanism:

- **Trešeta**: hand scores are capped at 11 points; the "Record Hand Score" entry auto-fills the opponent's points so they always sum to 11, and Akuže declarations are tracked as a separate, clearly labeled category from hand points. Target score is a 31/41/51 choice matching real house-rule variants.
- **Briškula**: card-value quick-add buttons (Ace/Three/King/Knight/Jack, worth 11/10/4/3/2) mirror the actual point values in the 120-point deck, a partija auto-resolves at 61+ points, and match structure is real best-of-4 partije with 4-0 "česalj" (sweep) detection.

That rule-accuracy is the actual reason this exists over a generic counter — not just convenience.

## Operating Context

Used mid-game, at a physical table, likely one-handed while holding cards. Sessions are short bursts of taps between hands/partije, interleaved with real conversation and play — the UI needs to stay out of the way and not demand attention beyond quick score entry. The Wake Lock ("keep screen awake") toggle exists because the phone sits idle on the table between taps and shouldn't lock mid-game. Two independent modes (Trešeta / Briškula) each keep their own in-progress match state, since a household may have one game going in each.

## Capabilities and Constraints

- Two independently-scored game modes (Trešeta, Briškula) behind a shared shell: header, team names, Sound/Wake-Lock/Banter toggles.
- No backend, no accounts — `localStorage` only, versioned schema (`tressette-scorekeeper-state-v2`), falls back to defaults on any old/mismatched shape rather than migrating.
- Wake Lock API requires a secure context (https/localhost); the toggle is present but disabled with an explanation when unavailable (e.g. testing over plain http on a LAN IP).
- Deployed as a static site to GitHub Pages under a subpath (`/tressette-scorekeeper/`), auto-deployed via GitHub Actions on push to `main`.
- Optional "Banter" system (on by default, toggleable) shows lighthearted, Michael-Scott-register taunt lines for whoever's losing; purely cosmetic, never affects scoring.

## Brand Commitments

Name: "Tressette" (header) / page title "Tressette". Visual identity is an established "card table" felt-and-gold aesthetic (dark emerald felt background, amber/gold trim, cream parchment score cards) — this is incumbent, not to be treated as undecided. Briškula mode carries its own rose/red accent within that same shared visual language, distinct from Trešeta's gold and from the fixed blue/red Team A/Team B card colors.

## Evidence on Hand

None (no testimonials, press, or third-party assets). Card game rules referenced in-app were sourced from Croatian Wikipedia (Trešeta, Briškula) during development; do not fabricate additional sourcing or claims beyond what's implemented.

## Product Principles

1. **Rule-accuracy over generic convenience.** Every scoring control should reflect the real structure of the game (hand caps, partija thresholds, declaration categories), not just be a bigger plus-button.
2. **Table-usable, not desk-usable.** Design for one-handed mobile taps mid-conversation, not sustained focused attention — large targets, minimal reading, fast feedback.
3. **Each mode is its own contained world.** Trešeta and Briškula must never bleed state or scoring logic into each other; only the shell (header, team names, toggles, felt/parchment base theme) is shared.
4. **Local-first, zero-friction.** No accounts, no setup, no network dependency beyond the initial page load — it must work standalone once open.
5. **Personality without getting in the way.** Banter/taunts add character but are strictly optional and never block or slow down actual score entry.

## Accessibility & Inclusion

No specific accessibility requirement established beyond general mobile-web practice (tap target sizing, contrast). Revisit if outdoor/bright-light use or players needing larger text/targets comes up in practice.
