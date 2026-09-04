# PRD: Hanabi hint tracker

## Summary

A single-player, client-side web app that represents one player's Hanabi hand and
lets them attach the hints they receive to individual cards. The app never knows
what any card actually is — it only records what the player has been told. It
replaces the memory bookkeeping of Hanabi so the deduction stays intact,
particularly for mixed-age groups where recall load is uneven.

## Background & context

Hanabi (Antoine Bauza, 2010) is cooperative: 50 cards across five suits — red,
yellow, green, blue, white — with three 1s, two each of 2/3/4 and a single 5 per
suit. Players hold their hands facing away from themselves and can see everyone's
cards but their own. On your turn you either play a card, discard it, or spend a
clue token to tell one teammate about *all* cards in their hand matching one
number or one color. Hands are five cards at 2–3 players and four at 4–5.

Two consequences shape this product. First, a card has exactly one number and one
color, so a player can hold at most one positive number hint and one positive
color hint per card. Second, the app is on the receiving player's device and
therefore cannot know card identities — no scoring, no play stack, no discard
pile is possible, and none is wanted.

A working prototype exists as a single-file React artifact and has been
test-driven through three rounds of revision. It is the reference implementation
for feel, not a codebase to port; the real app is a fresh project. [ref: DEC-1]

## Goals

- A player never has to ask "what was I told about this card?"
- Recording a received hint takes less time than the hint took to give.
- The hand on screen matches the hand in the player's hand without conscious
  syncing effort.
- A game survives a phone lock, a tab switch, or a browser reload.
- A player with mid-range eyesight can read their whole hand at a glance without
  bringing the phone closer.

## Non-goals

- **Knowing or storing card identities.** The app records hints, not cards. This
  removes scoring, play stacks, discard tracking and win/loss detection from scope
  permanently. [ref: DEC-3]
- **Playing Hanabi online.** The physical game happens at a real table; this is an
  accessory to it, not a replacement.
- **Teaching the rules.** No tutorial, no rules reference.
- **Multiplayer sync in v1.** [ref: DEC-13]
- **Deriving inferences for the player.** The app stores what was said; working
  out what a card must be is the part of the game we're protecting, not
  automating.

## Requirements

- **REQ-1** (MUST): Display the player's hand as face-down cards.
  - **REQ-1.1** (MUST): Show up to the configured hand size; empty positions render
    as draw slots. [ref: DEC-4]
  - **REQ-1.2** (MUST): A card with a color hint renders with that color across the
    entire card back. [ref: DEC-6]
  - **REQ-1.3** (MUST): A card with a number hint renders that number as a large
    bare numeral centred on the card, with ink color chosen per suit for
    contrast. [ref: DEC-7]
  - **REQ-1.4** (MUST): A card with no hints is visually distinct from both — a
    neutral dark back.
  - **REQ-1.5** (MUST): The full hand is legible without scrolling in both portrait
    and landscape; cards size to fit the available box on both axes.
- **REQ-2** (MUST): Record hints on individual cards.
  - **REQ-2.1** (MUST): Tapping a card opens its hint controls.
  - **REQ-2.2** (MUST): Assign one number, 1–5. Assigning replaces any existing
    number. [ref: DEC-2]
  - **REQ-2.3** (MUST): Assign one color from the five suits. Assigning replaces
    any existing color.
  - **REQ-2.4** (MUST): Re-selecting an assigned hint removes it, and a Clear
    control removes both — mistyped hints are common and must be cheap to fix.
  - **REQ-2.5** (MAY): Record negative hints ("not red", "not 3"). Deferred from
    v1; the card model should accommodate it without restructuring. [ref: DEC-2]
  - **REQ-2.6** (MUST): Remove a negative hint from a card. Negatives are derived
    from a selection, so a mis-tapped or incomplete selection leaves the hand
    holding something it was never told — usually noticed long past what Undo
    reaches. [ref: DEC-18]
- **REQ-3** (MUST): Manage the hand as the game progresses.
  - **REQ-3.1** (MUST): Reorder cards by dragging horizontally; neighbours move out
    of the way and the new order persists. [ref: DEC-9, DEC-10]
  - **REQ-3.2** (MUST): Discard a card by dragging it up into a drop zone, which is
    visible only while dragging and highlights when the card is far enough to
    release. [ref: DEC-8]
    - **REQ-3.2.1** (MUST): Releasing over the zone asks for confirmation before
      the card is removed.
    - **REQ-3.2.2** (MUST): A single Discard action covers both playing and
      discarding a card. [ref: DEC-3]
  - **REQ-3.3** (MUST): Draw a replacement into an empty slot; new cards enter at
    the left end. [ref: DEC-5]
  - **REQ-3.4** (SHOULD): Switch hand size between 4 and 5 to match player count.
  - **REQ-3.5** (SHOULD): Reset to a fresh hand for a new game.
  - **REQ-3.6** (SHOULD): Undo the last hand-changing action. [ref: DEC-12]
- **REQ-4** (MUST): Persist state locally.
  - **REQ-4.1** (MUST): Hand contents, card order and hand size survive a reload,
    a tab switch and a device lock. [ref: DEC-11]
  - **REQ-4.2** (MUST): Persistence is silent — no save button, no restore prompt.
  - **REQ-4.3** (SHOULD): A corrupt or unreadable stored value falls back to a
    fresh hand rather than a broken screen.
- **REQ-5** (SHOULD): Make the touch model forgiving.
  - **REQ-5.1** (MUST): A tap and a drag are distinguished by a movement threshold,
    not by timing, so a slightly shaky tap still opens the hint controls.
  - **REQ-5.2** (SHOULD): Dragging never scrolls the page.

## Non-functional requirements

- **NFR-1** (MUST): Touch-first. Every interactive target is comfortably tappable
  one-handed; hint controls are the largest elements on screen after the cards.
- **NFR-2** (MUST): Works in portrait and landscape without layout breakage.
- **NFR-3** (MUST): Client-side only for v1 — no backend, no accounts, no network
  dependency at the table. [ref: DEC-13]
- **NFR-4** (MUST): Functions offline after first load; table venues have poor
  connectivity and the app has no reason to need any.
- **NFR-5** (SHOULD): Colors and numerals meet a legibility bar aimed at older
  players in indoor lighting, not a minimum contrast ratio on paper. [ref: DEC-7]
- **NFR-6** (SHOULD): Respect `prefers-reduced-motion`; animation is feedback, never
  the only signal.
- **NFR-7** (SHOULD): Keyboard focus is visible, for desktop use and for switch
  access.

## Success criteria

- A full game is played end to end with no player consulting anything outside the
  app for hint recall.
- A player who received a hint two rounds ago answers what they know about a card
  in under a second, by looking.
- No player loses their hand state to a lock screen or an app switch during a
  session.
- The reason a hint is missing from the app is never "I couldn't work out how to
  put it there".

## Open questions

- Are negative hints in scope for v1 after all? The chat deferred them, but a
  group that plays with them will find the app actively lossy. If added: how are
  they entered — long-press a suit? — and how are up to nine marks per card shown
  without wrecking the whole-card color treatment? [ref: DEC-2]
- Does a hand size above 5 need supporting? Some variants and house rules use 6.
- Is the six-suit rainbow variant in scope? It changes the color picker and the
  card treatment, and rainbow-as-wild changes what a color hint even means.
- Should the app handle the endgame explicitly — a deck-empty state where the hand
  legitimately shrinks and draw slots should stop inviting a draw? [ref: DEC-4]
- Is there value in a per-card hint history ("told 3 on turn 4") or is the current
  state all that matters?
- Should one device be able to hold more than one hand, for a shared phone or for
  a player teaching another?
