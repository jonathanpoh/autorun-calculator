# Autorun Frame Calculator

A small calculator for planning astrophotography imaging sessions — built
mainly to sanity-check a ZWO ASIAir Autorun/Plan schedule, since the
ASIAir's own time estimate is just `frame count × exposure time` and
doesn't account for overhead (dithering settle, periodic autofocus,
meridian flips, plate solving).

Given a session duration, an overhead percentage, and an exposure time, it
tells you how many sub-frames the session will actually produce.

## Features

- Duration in hours or minutes, overhead % (default 15%), exposure time
  (60s/120s/180s/300s or a custom value)
- Live results: frame count, usable imaging time, time lost to overhead,
  and actual total capture time
- Installable as an offline-capable PWA — add it to your iOS home screen
  and use it with no signal at a dark site
- Manual "Night Vision" mode (dim red-on-black) to preserve dark
  adaptation in the field, independent of the device's system theme

## Usage

Open `index.html` directly in a browser — no build, no install, no
dependencies required.

To install it as an app: open the page in Safari on iOS, tap Share → Add
to Home Screen. Once installed it works fully offline.

## Development

Static site, zero build process, zero npm dependencies:

| File | Responsibility |
|---|---|
| `index.html` / `styles.css` | Markup and hand-rolled semantic CSS (no framework) |
| `calculator-core.js` | Pure calculation logic (frame count, overhead, duration formatting) |
| `app.js` | Wires the form inputs to `calculator-core.js` and updates the results live |
| `theme.js` | Night Vision toggle, persisted via `localStorage` |
| `manifest.json` / `sw.js` / `sw-register.js` | PWA install + offline caching |
| `icons/` | App icon source (`icon.svg`) and generated PNGs |

Run the calculation logic tests (Node's built-in test runner, no
dependencies needed):

```
node --test calculator-core.test.js
```

Service Workers require http(s) rather than `file://`, so to test PWA/
offline behavior locally, serve the directory over HTTP first:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/`.

## Deployment

Deployed as a static site to Cloudflare Pages — no build command, output
directory is the repo root. `wrangler.toml` pins the project name and
output dir for the Wrangler CLI:

```
wrangler pages deploy
```

(or `wrangler pages dev` for a local preview through Cloudflare's runtime).
