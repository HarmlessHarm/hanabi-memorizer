# Implementation plan — Hanabi hint tracker

This document records the stack and structural decisions made when turning the
handoff bundle and the single-file prototype (`prototype-hanabi-hand.jsx`) into a
real project. The requirement IDs (REQ-*, NFR-*) and decision IDs (DEC-*) refer to
[prd.md](./prd.md) and [decisions.md](./decisions.md).

## Stack chosen

| Concern      | Choice                          | Rationale |
|--------------|---------------------------------|-----------|
| Framework    | React 18 + TypeScript           | Carried from prototype (architecture.md); TS for maintenance. |
| Build/tooling| Vite                            | Zero-config SPA, instant Vercel support, fast dev. |
| Hosting      | Vercel (static SPA)             | Explicit requirement. |
| Styling      | Plain CSS + design tokens       | The prototype's inline styles were an artifact-sandbox workaround (architecture.md); a real project uses a stylesheet. Dynamic per-frame values (card size, drag transforms) stay inline because they are computed. |
| Offline/PWA  | `vite-plugin-pwa` (Workbox)     | NFR-4 MUST: works offline after first load. Installable manifest + precache service worker. |
| Persistence  | `localStorage`                  | DEC-11 / REQ-4. Swapped in for the prototype's artifact storage API. |
| Drag/reorder | Hand-rolled pointer events      | See note below. |

## Why not framer-motion Reorder (DEC-10)

architecture.md suggests preferring a FLIP-aware library for reordering. We keep a
hand-rolled pointer implementation instead because the gesture is *dual-purpose in a
single drag*: sideways = reorder, up-past-threshold = discard intent (DEC-8, UX
state 2). `Reorder.Group` owns the pointer and constrains it to one axis, which
fights the "drag up to discard" branch. A unified `pointerdown/move/up` handler
expresses both cleanly and is already proven in the prototype. The only wart —
the reorder "settle frame" (DEC-10) — is preserved and documented in code.

## Data model (architecture.md)

```ts
type SuitKey = 'red' | 'yellow' | 'green' | 'blue' | 'white';
interface Card { id: number; rank: Rank | null; suit: SuitKey | null; }
interface HandState { cards: Card[]; handSize: 4 | 5; }
```

Positive hints only (DEC-2). Extension points left open but **not** built:
- Negative hints (REQ-2.5) would turn each hint field into `{ value, not: Set }`.
  Isolated inside `Card` + the hint sheet; no other module assumes the shape.
- Shared session (DEC-13) would move persistence to a synced doc. The storage
  boundary is a single module (`lib/storage.ts`) so that swap stays local.

## Structure

```
src/
  main.tsx              # React root
  App.tsx               # composition + top-level state via useHand
  lib/
    types.ts            # Card, HandState, Rank, SuitKey
    suits.ts            # suit palette + ink (DEC-6, DEC-7)
    storage.ts          # thin localStorage load/save boundary (DEC-11, REQ-4.3)
  hooks/
    useHand.ts          # hand state, undo stack, persistence (DEC-12, REQ-4)
    useStageSize.ts     # ResizeObserver -> card sizing (REQ-1.5)
    useHandDrag.ts       # pointer drag: reorder + discard intent (DEC-8/9/10)
  components/
    Header.tsx          # hand-size toggle, Undo, Reset (REQ-3.4/3.5/3.6)
    Hand.tsx            # the row of cards + draw slots + discard zone
    Card.tsx            # one card back (color flood + centre numeral)
    Burst.tsx           # firework ornament
    DiscardZone.tsx     # drop zone, visible only while dragging (REQ-3.2)
    HintSheet.tsx       # bottom sheet hint controls (REQ-2)
    DiscardConfirm.tsx  # "Discard this card?" sheet (REQ-3.2.1)
  styles/index.css      # design tokens, layout, motion (respects reduced-motion)
```

## Requirement coverage checklist

- REQ-1 hand display, color flood, centre numeral, neutral back, dual-axis fit ✓
- REQ-2 tap to open, one rank, one suit, re-tap removes, Clear ✓
- REQ-3 drag reorder, drag-up discard + confirm, draw at left, size 4/5, reset, undo ✓
- REQ-4 localStorage silent persistence + corrupt-value fallback ✓
- REQ-5 8px tap/drag threshold, `touch-action: none` ✓
- NFR-1..7 touch targets, portrait/landscape, client-only, offline PWA, legible
  palette, reduced-motion, visible focus ✓

## Out of scope for v1 (confirmed against handoff open questions)

Multiplayer sync (DEC-13), negative hints (DEC-2), hand size > 5, rainbow suit,
per-card hint history, multiple hands per device. Deferred, not designed for.
