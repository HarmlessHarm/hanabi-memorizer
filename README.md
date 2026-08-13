# Hanabi — hint tracker

A phone-sized web app that stands in for the notes you can't write on the back of
your own [Hanabi](https://en.wikipedia.org/wiki/Hanabi_(card_game)) cards. You hold
cards you're not allowed to look at; when a teammate tells you "these two are 3s",
you tap those cards and the hint sticks to them. Reorder, discard, draw — the app
mirrors your real hand.

It records **what you were told**, never what a card actually is. There's no
scoring, no play stack, no deduction done for you — that's the part of the game
this protects, not automates.

## Features

- **Hints are the card, not badges on it.** A color hint floods the whole card
  back; a number hint is one oversized centred numeral. A fully-known card reads
  as "big red 3" from across the table.
- **Two taps to record a hint** — tap the card, tap the number or color. Re-tap to
  remove; **Clear** wipes both.
- **Drag sideways to reorder**, **drag up to discard** — no confirmation, a
  mistaken discard is one **Undo** away. New cards are drawn into the empty slot
  at the left.
- **Undo / Reset** and a **4 / 5** hand-size toggle in the header.
- **Silent local persistence** — survives a reload, a tab switch or a phone lock.
- **Works offline** and is installable as a PWA.

## Tech

React 18 + TypeScript, built with [Vite](https://vitejs.dev/), offline via
[`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/). State lives entirely in the
browser (`localStorage`); there is no backend. Hosted on Vercel.

Design rationale and requirements live in [`.planning/`](./.planning/) — start with
[`implementation-plan.md`](./.planning/implementation-plan.md).

## Develop

```bash
npm install
npm run icons   # regenerate PWA icons + favicon (only when the mark changes)
npm run dev     # http://localhost:5173
```

```bash
npm run build   # type-check + production build to dist/
npm run preview # serve the production build locally
```

## Test

```bash
npx playwright install chromium   # one-off, downloads the browser
npm test                          # starts the dev server itself and runs both projects
npm test -- --project=phone       # touch only
npm test -- --headed --debug      # watch it happen / step through
npm run test:report               # open the HTML report after a failure
```

[Playwright](https://playwright.dev/) end-to-end tests in [`tests/`](./tests/), split
into a **phone** project (Pixel 7 emulation, real touch input) and a **desktop**
project (mouse).

The split is the point. Both bugs this app has actually shipped were browser
behaviours that are invisible with a mouse on a desktop and that reading the code
does not reveal — a touchscreen replaying every tap as a phantom mouse click a few
ms later, and a finished CSS animation restarting whenever the browser re-inserts
its node. Neither is reachable by unit-testing a component, so the tests drive a
real engine with real touch events and assert on what it does: whether the sheet is
still open, and which numerals fired their `animationstart`. Anything added here
should be checked to fail against the code from before the fix — a test for a
browser quirk is very easy to write so that it passes for the wrong reason.

## Deploy

Hosted on Vercel as a static SPA (`vercel.json` sets the Vite framework preset).
Pushing to the default branch triggers a production deploy once the project is
linked; `vercel --prod` deploys from the CLI.

## Scope

v1 is a **solo, per-player, offline** tool — one hand per device. Deliberately out
of scope: multiplayer sync, negative hints, hands larger than 5, and the rainbow
suit. See [`.planning/decisions.md`](./.planning/decisions.md) for the reasoning.
