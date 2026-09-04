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
- **Superseded by DEC-14**: negatives are in, behind a switch. The bet held —
  adding them cost one field pair on `Card` and one new pure module.

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
- **Amended by DEC-16**: only Undo kept its place in the header. Reset and the
  hand-size toggle moved into the cogwheel menu — first-class, but not urgent.

## DEC-13: Solo per-player tool for v1
- **Context**: an alternative shape exists where the hint *giver* taps the cards in
  the receiver's hand on a shared synced session.
- **Chosen**: solo, local, one device per player, for v1.
- **Why**: keeps the app entirely client-side with no accounts, no backend, no
  network at the table.
- **Note**: this is the fork that most changes the project. It was raised and
  deliberately deferred, not settled — see the open questions.

## DEC-14: Negative hints are derived, never entered
- **Context**: DEC-2 deferred negatives. Advanced players do track them, and the
  information is free — a hint that skips your card tells you what it isn't.
- **Options considered**: a third pick row in the sheet for marking negatives by
  hand; deriving them from the hints already being recorded.
- **Chosen**: derived, from the selection a hint was given to. Off by default,
  switched on in the settings menu.
- **Why**: entering them by hand doubles the taps per hint and is exactly the
  bookkeeping the app exists to remove. The player already tells the app which
  cards a hint named; every other card in the hand follows from that.
- **Consequence**: it only works if a hint can name several cards at once, which
  is what pushed the hand to stay live under the open sheet (DEC-15).
- **Amended by DEC-17**: they are derived when the sheet closes, not per tap.
- **Not built**: deduction. Four negatives on a card do not become the fifth
  colour. That is the part of the game the app protects, and it is the line
  between recording what you were told and playing for you.

## DEC-15: The hand stays tappable while the hint sheet is open
- **Context**: hints name a set of cards, but the sheet's backdrop covered the
  hand, so the selection was frozen at one card the moment the sheet opened.
- **Chosen**: backdrop and sheet became separate layers with the card row
  slotted between them — above the dimming, under the sheet. Tapping a card adds
  or removes it from the selection; tapping anywhere else still closes.
- **Why**: it keeps the two-taps-per-hint budget for a hint on four cards, and
  the cards you are choosing between stay readable while you choose.
- **Cost**: nothing on screen announces it, so a one-off tooltip fires on the
  first card ever selected on the device (a localStorage flag, not part of the
  hand state). And on a landscape phone the sheet covers the bottom of the
  screen, which for a while left only the cards either side of it selectable —
  **amended by DEC-19**: the hand now moves above the panel instead.

## DEC-16: One cogwheel menu instead of a row of header controls
- **Context**: hand size, anti-hints, Install and Reset had all accumulated in
  the header, and anti-hints would have been the fifth control competing with the
  cards for a phone's width.
- **Chosen**: Undo stays in the header; everything else moved into a dropdown
  behind a cogwheel.
- **Why**: Undo is the only one reached for mid-turn, in a hurry. The rest are
  set once a game or once ever, and the header is meant to be recessive.
- **Note**: the menu dismisses on a document `pointerdown` outside itself rather
  than behind a full-screen backdrop. A backdrop appearing under the finger
  catches the phantom mouse click a touchscreen fires after every tap and closes
  the menu the tap just opened — the bug the hint sheet shipped with once.

## DEC-17: A hint is settled when the sheet closes, not on every tap
- **Context**: deriving negatives on each pick meant a player who tapped 2, saw
  it was wrong and tapped 3 left the rest of the hand knowing it wasn't a 2. The
  hand had learned something from a mis-tap that was never a hint.
- **Options considered**: an explicit Apply button; undoing the negatives on each
  correction; deferring the derivation to the end of the sheet session.
- **Chosen**: the sheet records which values it was shown, and works the
  negatives out once on close — reading each value's final state back off the
  cards, so one tapped on and off again settles to nothing.
- **Why**: picking is not the same as having picked. Nothing else in the app
  needs a commit step, and adding an Apply button would have cost the
  two-taps-per-hint budget for the sake of a mis-tap.
- **Consequence**: the settle deliberately skips the undo stack, so one Undo
  takes back the hint tap *and* the negatives it implied, rather than leaving the
  hand knowing things about a hint that no longer exists.
- **Known gap**: a hint whose last card is discarded before the sheet closes
  never settles. The card it was about is gone; the negatives it would have left
  are not worth a special case.

## DEC-18: A derived negative can be taken back off, from the sheet
- **Context**: negatives are only as true as the hint they came from. A card
  tapped into the selection by mistake, or one left out of it, leaves the rest of
  the hand marked with something it was never told — and it is usually noticed
  several hints later, long past what Undo can reach.
- **Options considered**: tapping the badge on the card itself; a long-press on
  the card; offering the selection's negatives back inside the hint sheet.
- **Chosen**: the sheet grows a "Ruled out" row when the selection carries any
  negatives — the same struck disc as on the card, on a 40px target, and tapping
  one clears it from every selected card.
- **Why**: the card is already spoken for by tap-to-select and drag-to-reorder,
  and a badge is a few millimetres wide in the middle of that gesture. The sheet
  is where a hint is corrected already (REQ-2.4), so the correction to what a
  hint implied belongs beside it. It also inherits multi-select for free: one tap
  fixes the same wrong negative across four cards.
- **Consequence**: it is a commit, unlike the settle (DEC-17) — a removal is an
  action taken on purpose, so it stands on the undo stack in its own right.
  Removing a negative settles nothing: what a card is *not* says nothing about
  the rest of the hand.
- **Note**: the row mirrors the card face, so a negative hidden under a positive
  on its own card is not offered either. The record survives underneath; if the
  positive is taken off, the negative shows again.

## DEC-19: In landscape, the hand climbs above the panel instead of hiding under it
- **Context**: the hint panel had grown to where it covered the hand outright on
  a rotated phone. Selecting a card animated it — a lift, a highlight ring —
  behind the panel, so the feedback that a tap had landed was invisible.
- **Options considered**: shrinking the cards while the panel is up; scrolling
  the panel; moving the hand.
- **Chosen**: while a card is selected on a short screen the discard zone gives
  up its space and the row packs against the top of the stage, leaving every card
  standing above the panel. OK moves up beside the heading there too, which buys
  back another row of card.
- **Why**: cards that resize on selection re-flow the drag metrics mid-gesture,
  and a scrolling panel hides its own hints. Moving the row costs nothing but the
  zone, which is only ever used at the *start* of a gesture — and no one drags a
  card away while choosing what to tell it.
- **Consequence**: the red drag-up-to-discard strip is off screen for as long as
  the panel is up. The gesture still works — the threshold is a fraction of card
  height, not a hit test on the zone — it just has no target drawn for it.
- **Cost**: ~85px of each card shows at 916x412 with the panel at its tallest.
  Enough for the lift, the ring and the top of a numeral; not the whole card.
- **Follow-on**: the negatives moved from the bottom edge of the card to the top,
  into that surviving strip. They are what you re-read while deciding which cards
  a hint names, so they are exactly the thing that must not be behind the panel.

