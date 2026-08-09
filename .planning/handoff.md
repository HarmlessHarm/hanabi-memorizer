# Handoff: Hanabi hint tracker

- **Target**: new-project
- **PRD maturity**: developing
- **Branches present**: ux-design, architecture
- **Framework hint**: detect from repo
- **Repo creation requested**: no

## Source context

A design chat that went from an idea to a working, test-driven prototype in one
sitting: a phone app that records the hints a Hanabi player receives about their
own face-away cards, so the memory bookkeeping stops crowding out the deduction.
Three rounds of revision on a React artifact settled the interaction model —
whole-card color, large centre numeral, drag sideways to reorder, drag up to
discard, local persistence. It left off with the prototype working and the real
project not yet started; no stack, framework or hosting has been chosen.

The prototype (`hanabi-hand.jsx`, single-file React) is the reference for *feel*
and gesture thresholds. It is not a codebase to port — several of its choices
exist only to work inside the artifact sandbox.

## Open questions / assumptions to verify

Read these first; several would change early structural choices.

- **The biggest fork was deferred, not decided.** v1 is a solo per-player tool,
  but a shared session where the hint-*giver* taps cards in the receiver's hand
  was raised and parked. It turns a client-only app into a synced multi-device
  one. Confirm it's genuinely out of scope before picking a stack. [DEC-13]
- **Negative hints are the likeliest v1 regret.** They were cut for simplicity,
  but they're real Hanabi information, and the players this app serves lose them
  to memory too. Verify the group doesn't play with them. [DEC-2, REQ-2.5]
- **The chat assumes one hand per device and never says so.** Sharing a phone, or
  a player tracking a hand for someone else, isn't supported.
- **Offline capability is required but never specified.** NFR-4 implies a service
  worker and probably a PWA; nobody said "PWA" out loud.
- **The prototype's storage call is an artifact-sandbox API, not localStorage.**
  Swap it on day one — the design decision is localStorage. [DEC-11]
- **Hand size is fixed at 4 or 5.** Variants and house rules using 6 will not fit.
- **No accessibility testing has happened.** The legibility bar is "older players
  at a table in indoor light", which was designed toward but never verified with
  the actual players. Test with them before hardening the palette.
- **Suit ink colors were chosen for contrast, not brand.** Yellow and white cards
  use dark numerals, deviating from the original brief. Confirm this reads right
  in the room before treating the palette as settled. [DEC-7]

## Files in this bundle

- idea.md
- decisions.md
- prd.md
- ux-design.md
- architecture.md
