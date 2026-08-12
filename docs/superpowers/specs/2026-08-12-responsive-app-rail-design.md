# Responsive App Rail Design

## Goal

Align the desktop header with the main game content while preserving the existing narrow, phone-first layout on small screens.

## Decisions

- Use a shared responsive rail for both `header` and `main`.
- Keep the mobile maximum width at `28rem` (`max-w-md`).
- Expand the maximum width to `42rem` (`max-w-2xl`) at the `md` breakpoint (`768px`).
- Keep the header panel, border, logo, controls, and main content inside the same centered rail.
- Preserve existing padding, sticky behavior, game layout, state, persistence, and Croatian copy.

## Implementation

Define the rail classes once in `App.jsx` and apply them to both top-level layout elements. The shared class includes full width, centered margins, the mobile cap, and the tablet/desktop cap. No new component or CSS token is needed because the rail is used only by the two elements in the shared shell.

## Verification

- Run `npm run lint` from `app/`.
- Run `npm run build` from `app/`.
- Manually inspect narrow mobile, tablet, and desktop widths.
- Confirm header and main outer edges align at each viewport.
- Confirm controls remain usable and existing game behavior is unchanged.
