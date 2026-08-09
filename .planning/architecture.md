# Architecture: Hanabi hint tracker

The chat settled the shape of the client and the persistence strategy. It did not
settle a stack — treat everything below as constraints on the choice rather than
the choice itself.

## Stack

- **Client-only single-page app.** No server, no accounts, no network at runtime.
  [ref: NFR-3, DEC-13]
- **React**, carried over from the prototype. Not deliberated as such — if the
  real project has a reason to prefer something else, nothing in the design
  depends on React.
- **Framework, build tooling, styling approach and hosting: undecided.** The
  prototype used inline styles because the artifact sandbox restricts arbitrary
  Tailwind values; that constraint doesn't exist in a real project and shouldn't
  be inherited.
- **Reordering**: the prototype hand-rolls pointer-event drag with a manual settle
  frame. For the real build, prefer a FLIP-aware library — `framer-motion`'s
  `Reorder` — over maintaining that by hand. [ref: DEC-10]
- **PWA / offline**: the offline requirement (NFR-4) implies a service worker and
  an installable manifest. Not discussed; flagged as the likely shape.

## Data model (conceptual)

Two entities, both trivial, both entirely local:

- **Card** — an identity-stable id, one optional number hint (1–5), one optional
  color hint (one of five suits). Nothing else. There is deliberately no field for
  what the card *is*: the app cannot know. [ref: DEC-3]
- **Hand** — an ordered list of cards plus a hand size setting. Order is
  meaningful and player-controlled; it is not derived from anything.

Two extension points are worth leaving open rather than designing for now:

- Negative hints (REQ-2.5) would make each hint field a set of exclusions
  alongside the single positive value. Choosing a card representation that can
  grow that way costs nothing today.
- A shared session (DEC-13) would move the hand from local state to a synced
  document keyed by player. That is a rewrite of the persistence layer, not of the
  card model — worth keeping the storage boundary thin for that reason.

## Persistence

- **localStorage**, written on every state change, read once on mount. Hand
  contents, order and hand size. [ref: DEC-11, REQ-4]
- sessionStorage was the first instinct and was rejected: it dies with the tab,
  which at a table means a closed tab loses a game in progress.
- The prototype uses the Claude artifact storage API instead, because neither
  browser storage API functions in that sandbox. It is a one-line substitution in
  the real project — the load and save calls are already isolated behind a single
  key.
- Reads must tolerate absent, malformed and stale-shaped values by falling back to
  a fresh hand. [ref: REQ-4.3]

## Integration points

None in v1. That's a deliberate property, not a gap. The app has no external
services, no analytics discussed, and no authentication.

## Open architecture questions

- Framework and hosting are genuinely open. The requirements are light enough that
  almost anything works; pick for maintenance cost, not capability.
- Does v1 ship as an installable PWA, or as a plain page people bookmark? Offline
  (NFR-4) points to the former but it was never explicitly decided.
- If the shared-session fork (DEC-13) is on the horizon at all, it's worth knowing
  before choosing a stack — a synced version has real backend requirements, and
  choosing a stack that can't grow into it would be an avoidable regret.
- Multiple hands on one device (see PRD open questions) would need a hand
  identifier in the storage key. Cheap now, awkward to retrofit later.
