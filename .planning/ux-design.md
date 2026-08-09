# UX Design: Hanabi hint tracker

## User flows

**Receive a hint** [ref: REQ-2]
A teammate says "these two are 3s" and points. Player taps the first card → hint
controls open → taps `3` → taps Done or the backdrop → repeats for the second
card. Two taps per card is the budget; anything more and players will skip
recording hints under social pressure to keep the turn moving.

**Discard or play a card** [ref: REQ-3.2]
Player drags the card upward. Once it clears roughly a third of a card height, a
red dashed zone across the top lights up. Releasing there asks "Discard this
card?" with Keep it / Discard. Confirming removes the card and leaves an empty
slot behind.

**Draw** [ref: REQ-3.3]
The empty slot left by a discard sits at the left end and reads as a dashed card
with `+ Draw`. Tapping it produces a fresh hintless card in that position. The
slot *is* the button — there's no separate draw control to find.

**Reorder** [ref: REQ-3.1]
Drag a card sideways; the others slide aside to open a gap; release and it lands.
Used when a group's convention moves clued cards to one end.

**Recover from a mistake** [ref: REQ-3.6]
Undo in the header reverses the last hand-changing action, including a confirmed
discard. Reset starts a fresh hand for a new game.

## Interaction model

The hand is the screen. There is no navigation, no menu and no second view — every
control either sits in a thin header or appears in response to touching a card.

Three states:

1. **Idle** — the hand, a header, and a hint line telling the player what the two
   gestures do. Nothing else competes.
2. **Dragging** — the drop zone appears at the top; the dragged card lifts and
   follows the finger. Sideways movement reorders live; upward movement past the
   threshold switches to discard intent and stops the reorder shuffle, so the two
   gestures never fight each other.
3. **Card focused** — a bottom sheet holds the hint controls; the chosen card lifts
   slightly and the rest of the hand dims to a third opacity, so it's unambiguous
   which card you're about to label. Tapping the backdrop dismisses.

Gesture disambiguation matters more than it looks. A tap and a drag start
identically, so the split is an 8px movement threshold rather than a long-press
timer — long-press punishes exactly the slower, less confident touch this app is
built to serve. [ref: REQ-5.1]

## Layout & visual intent

**The card is the interface.** Cards should be as large as the viewport allows,
sized against both width and height so landscape works, and laid out in a single
row matching the physical hand's left-to-right order.

**Hints are the card, not badges on it.** A color hint floods the whole back; a
number hint is a single oversized numeral in the centre. A card that is fully
known reads as "big red 3" from across the table. This was the pivotal revision:
corner tokens were legible only to the person holding the phone. [ref: DEC-6]

**Tone.** Dark, night-sky ground — the game is about fireworks, and dark makes the
five suit colors sing rather than compete. One quiet firework mark on each card
back is the only ornament. Everything not a card is deliberately recessive:
small, grey, at the edges.

**Type.** A geometric grotesk with strong figures, since the numerals are the
single most important glyphs in the product. Numerals set very large and bold;
all supporting text small, letterspaced and quiet.

**Motion.** Three uses only — a hint popping in when placed, cards sliding aside
during a reorder, the sheet rising. Motion confirms an action landed; it never
carries information on its own. [ref: NFR-6]

**Empty and destructive states carry the direction.** The empty slot invites the
draw. The drop zone is the only red in the product and only exists while a card
is in the air.

## Open UX questions

- The drop zone is invisible until a drag begins, so discard is discoverable only
  via the idle hint line. Does that hold up with players who don't read hint
  lines? A first-run affordance may be needed.
- Confirming every discard is friction on the most common destructive action.
  Undo may make the confirm redundant — worth testing both at a table.
- The dimming of unfocused cards assumes the player looks at the screen while
  labelling. If they're mostly looking at the table, a stronger signal on the
  focused card may serve better.
- If negative hints arrive, they need a visual language that coexists with the
  whole-card color rather than fighting it. [ref: REQ-2.5]
- Nothing currently distinguishes a card the player has already reasoned out
  ("this is definitely playable") from one merely clued. Groups may want a mark
  for that, but it edges toward the app doing the deduction. [ref: DEC-13]
