# Decisions

Harvested from the design chat, in roughly the order they were settled. Several
were reversed mid-conversation after test-driving the prototype; where that
happened, the superseded position is recorded rather than erased.

## DEC-1: Prototype in a chat artifact before building the real app
- **Context**: the idea needed to be felt at a table before committing to a stack.
- **Options considered**: go straight to a real project; build a throwaway
  interactive prototype first.
- **Chosen**: prototype first, as a single-file React artifact.
- **Why**: the whole product is a physical interaction — card sizes, drag feel,
  legibility at arm's length. None of that is decidable on paper, and the
  prototype produced three rounds of substantive changes within one sitting.
- **Rejected**: straight to a real project — would have baked in the corner-token
  design that testing immediately killed (see DEC-6).

## DEC-2: Track positive hints only in v1
- **Context**: real Hanabi information includes negative inference — a "3s" hint
  that skips your card tells you it isn't a 3. Advanced players track this.
- **Options considered**: positive only; positive plus explicit negative marks.
- **Chosen**: positive only.
- **Why**: matches how the target group actually plays, and each card then holds
  at most one number and one color, which is what makes the whole-card visual
  treatment possible.
- **Rejected**: negative marks — not dropped on principle, deferred. It's the
  first candidate for v2, and the data model should not make it hard to add.

## DEC-3: Play and discard collapse into one action
- **Context**: the prototype initially offered both.
- **Options considered**: separate Play / Discard actions; a single removal action.
- **Chosen**: one action, labelled Discard, with a confirmation.
- **Why**: the app never knows a card's identity, so it cannot track a play stack
  or a discard pile. Both actions do exactly one thing — remove the card from the
  hand — and the distinction only exists on the physical table.
- **Rejected**: separate actions, and with them any discard log or score display.

## DEC-4: No automatic draw after a card leaves the hand
- **Context**: by the rules you draw immediately after playing or discarding, so
  auto-draw looked like free friction removal.
- **Options considered**: auto-draw; manual draw.
- **Chosen**: manual draw, via a dashed empty slot that acts as the draw button.
- **Why**: the deck runs out before the game ends, and from that point hands
  legitimately shrink. Auto-draw would be wrong for the entire endgame — the most
  tense part of the game.

## DEC-5: New cards enter at the left
- **Context**: the app has to pick an end for freshly drawn cards.
- **Chosen**: insert at index 0, leftmost.
- **Why**: follows the common convention where the newest card is slot 1 and the
  chop (oldest unclued card) sits at the right end. Dragging can override it.

## DEC-6: Hint shown as whole-card color plus a large centre numeral
- **Context**: v1 of the prototype put a number token in the top-left corner and a
  color token in the top-right, as originally specified. Test-driving killed it.
- **Options considered**: corner tokens; full-card color with a centre numeral.
- **Chosen**: the entire card back takes the hint color, with a single large bare
  numeral centred on it. Corner tokens removed entirely.
- **Why**: readable across the table and at a glance, which is the whole point for
  the players this is built for. A 30px token is not.
- **Rejected**: corner tokens — they also visually implied a card could carry
  several hints per corner, which under DEC-2 it can't.

## DEC-7: Numeral ink varies by suit
- **Context**: the brief said white numeral, no background.
- **Chosen**: white on red / green / blue, dark ink on yellow and white.
- **Why**: white on the yellow and white suits fails contrast badly, and
  legibility for older eyes is the product's reason to exist. Deviating from the
  stated brief was the smaller cost.

## DEC-8: Discard by dragging up into a drop zone
- **Context**: discard started life as a menu item inside the tap sheet.
- **Options considered**: menu item; swipe/drag gesture.
- **Chosen**: drag the card up past ~a third of a card height into a red dashed
  zone spanning most of the screen width, then confirm.
- **Why**: it mirrors the physical motion of pushing a card into the middle of the
  table, and it clears the tap sheet down to hints only.
- **Note**: the confirmation is deliberate friction — an accidental discard is
  unrecoverable at the table without Undo.

## DEC-9: Pointer events for drag, not HTML5 drag-and-drop
- **Context**: reordering is core and the primary device is a phone.
- **Chosen**: `pointerdown/move/up` with pointer capture, `touch-action: none`,
  and an 8px movement threshold separating a tap from a drag.
- **Why**: HTML5 DnD doesn't fire on touch at all.
- **Rejected**: a drag library, for the prototype only — see DEC-10.

## DEC-10: Hand-rolled reorder needs a settle frame (and probably shouldn't be hand-rolled)
- **Context**: on release, cards flew from the wrong position. Cause: the array
  reorder changes flex layout instantly in the same frame that the drag
  `translateX` is still animating back to zero, so the element moves twice.
- **Chosen**: force `transition: none` for the frame the reorder lands in, then
  re-enable after two `requestAnimationFrame`s.
- **Why**: correct, and cheap in a single-file prototype.
- **Note for the real build**: this is the layout-vs-transform conflict that
  FLIP-style libraries exist to solve. If reordering gets any richer, use
  `framer-motion`'s `Reorder` instead of maintaining the settle frame by hand.

## DEC-11: State survives a reload
- **Context**: a phone locking or a tab switching mid-game must not wipe the hand.
- **Options considered**: sessionStorage (first instinct); localStorage.
- **Chosen**: localStorage for the real app.
- **Why**: sessionStorage dies with the tab, and at a table that means a closed
  tab or an aggressive mobile browser loses the hand mid-game.
- **Note**: the prototype uses the artifact storage API because neither
  localStorage nor sessionStorage functions inside a Claude artifact sandbox.
  It's a one-line swap.

## DEC-12: Undo and Reset are first-class controls
- **Context**: every destructive action (discard, reorder, clearing hints) is
  otherwise irreversible mid-game.
- **Chosen**: a bounded undo stack of previous hand states in the header,
  alongside Reset and the hand-size toggle.
- **Why**: a misdrag with a phone in one hand is common, and the alternative is
  reconstructing hints from memory — the exact failure the app exists to prevent.

## DEC-13: Solo per-player tool for v1
- **Context**: an alternative shape exists where the hint *giver* taps the cards in
  the receiver's hand on a shared synced session.
- **Chosen**: solo, local, one device per player, for v1.
- **Why**: keeps the app entirely client-side with no accounts, no backend, no
  network at the table.
- **Note**: this is the fork that most changes the project. It was raised and
  deliberately deferred, not settled — see the open questions.
