# Autorun Calculator — Design Spec

Date: 2026-07-15

## Purpose

A single-page, client-side calculator for planning astrophotography imaging
sessions. Given a total session duration, an overhead ("buffer/waste")
percentage, and an exposure time, it calculates how many sub-frames the
session will produce.

## Architecture

- Static site, no build process, no dependencies, no server.
- `index.html` — markup only, semantic elements, minimal classes.
- `styles.css` — hand-rolled CSS with semantic class names
  (`.calculator`, `.field-group`, `.result-summary`, etc). No CSS
  framework.
- `calculator.js` — vanilla JS. Reads inputs, computes results, writes
  output back to the DOM. No external JS libraries.
- Opened directly in a browser via `file://` — no dev server required.

## Inputs

| Field | Type | Notes |
|---|---|---|
| Duration | number | Paired with a Hours/Minutes toggle that changes how the number is interpreted |
| Buffer / waste % | number | Default `15`. Represents time lost to dithering, autofocus, meridian flips, etc. Clamped to 0–99. |
| Exposure time | select | Options: 60s, 120s, 180s, 300s, Other. Selecting "Other" reveals a numeric seconds input. |

## Calculation

```
durationSeconds = duration × (unit === 'hours' ? 3600 : 60)
usableSeconds   = durationSeconds × (1 − buffer / 100)
frames          = ceil(usableSeconds / exposureSeconds)
actualCaptureSeconds = frames × exposureSeconds
bufferSeconds   = durationSeconds − usableSeconds
```

Frame count rounds **up** (`ceil`): a partial frame still requires a full
exposure to be attempted, so the session should be planned for the
capture time implied by the rounded-up count.

## Output

- **Headline:** frame count (large, primary).
- **Breakdown** (secondary, smaller text):
  - Usable imaging time (`usableSeconds`, formatted as h/m)
  - Time lost to buffer (`bufferSeconds`, formatted as h/m)
  - Actual total capture time (`actualCaptureSeconds`, formatted as h/m) —
    will be ≥ the usable imaging time because of rounding up to a whole
    frame count.

## Behavior

- Recalculates live on every input change — no submit button.
- Validation: non-numeric or negative duration/buffer treated as `0` for
  calculation purposes (no error state, no blocking). Buffer clamped to
  the 0–99 range regardless of typed value.
- "Other" exposure input only appears when "Other" is selected in the
  dropdown; defaults to empty until the user types a value.

## Styling

- Single centered card layout, clean and minimal per CLAUDE.md.
- Responsive: usable on mobile and desktop viewports.
- No JS framework, no CSS framework — the whole page is three files.

## Out of scope (for this spec)

- Multiple exposure times / mixed filter sequences in one calculation.
- Saving/loading sessions, persistence, or URL-shareable state.
- Dark mode theming.
- Any backend, analytics, or telemetry.
