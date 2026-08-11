# PIA media capture

Regenerate the PIA case-study media from the running PIA app, so updating the
video and screenshots when PIA changes is one command instead of a hand-built
pipeline. Assets land in **both** language bundles
(`content/english/works/pia/` and `content/swedish/works/pia/`).

## Setup (once)

```bash
cd tools/pia-capture
npm install
npx playwright install chromium    # downloads the browser Playwright drives
```

Needs Node 18+ and `ffmpeg` — bundled via `ffmpeg-static`, nothing to install
system-wide.

## What it captures

| Command         | Asset(s)                            | Spec                                  | How                                                     |
| --------------- | ----------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| `npm run demo`  | `02-tour.mp4`, `02-tour-poster.png` | 1600×840, 25fps, H.264, seamless loop | records the `demo` reel, finds a seamless seam, encodes |
| `npm run shots` | `01-hero-session.png`               | 1600×840                              | `whoareyou`, airy padding, scaled down                  |
| `npm run shots` | `04-editor-nano.png`                | 2400×1440                             | `nano notes.md` + a few lines                           |
| `npm run shots` | `05-game-2048.png`                  | ~app-sized                            | `brew install 2048`, `2048`, a few moves                |

Run a subset: `node capture-shots.mjs hero` (or `nano` / `2048`).

## Which PIA does it record?

Defaults to the deployed site, **https://pia.tor2dbear.com/**. So the usual
flow is: ship the PIA change → run the capture here → commit the portfolio.

To capture **un-deployed** changes, point it at a local dev server:

```bash
# in the pia-terminal checkout:
npx vite --port 5199

# here:
npm run demo -- --url http://127.0.0.1:5199/
npm run shots -- --url http://127.0.0.1:5199/
```

## Options

- `--url <URL>` — which PIA to drive (or `PIA_URL` env).
- `--out <dir>` — write to `<dir>` instead of the two bundles (for testing,
  so you don't overwrite the committed assets).
- `PIA_CHROMIUM=<path>` — use a specific Chromium binary instead of the one
  `npx playwright install` provides.

## After running

```bash
git status content/*/works/pia   # review the changed assets
git add content/*/works/pia && git commit
```

## Not covered here (kept as separate, deliberate steps)

- **`09-architecture.svg`** — a generated, self-contained SVG (JetBrains Mono
  subset embedded), not a screenshot. It has its own generator; edit that when
  the architecture changes.
- **`10-terminal-tour.mp4`** — a bespoke clip (pipes, then `theme amber` /
  `theme ice`), not the `demo` reel. If you want it scripted too, copy
  `record-demo.mjs` and swap the command sequence + marker.
- **`11-crt-overlay.mp4`** — a bespoke seamless loop of the CRT overlay
  (`crt on` over the neofetch identity). The held screen's only motion is the
  4s phosphor breathe and the 1s cursor blink, so a ~4s window loops cleanly;
  reproduce by copying `record-demo.mjs` and holding the `crt on` screen.
- **`07-mobile-mockup.png`** — a hand-composited device mock, not an app
  screenshot. Reproduce it in the design tool.

## How the seamless loop works

The `demo` reel is deterministic and periodic (~70s). `record-demo.mjs` records
~2.3 loops, reads the period from the recurring neofetch marker, and:

- **Loop cut** — trims between two near-identical _held_ frames one period apart.
  It cuts on the static fresh-prompt hold just before the reel types `neofetch`,
  because the identity screen itself has a blinking cursor that won't pixel-align
  across a period. First↔last frame lands well above 50 dB PSNR — visually
  seamless.
- **Poster** — grabbed from the identity frame (matched by content against a
  reference screenshot taken during recording), so the still shown before
  playback / under reduced-motion is PIA introducing itself, even though the
  loop is cut a moment earlier.
