# Autorun Frame Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page, client-side calculator that computes the number of sub-frames an astrophotography imaging session will produce, given duration, buffer/waste %, and exposure time.

**Architecture:** Three plain files at the repo root — `calculator-core.js` (pure calculation functions, no DOM), `app.js` (DOM wiring that calls the core functions), `index.html` + `styles.css` (markup and hand-rolled semantic CSS). No build step, no npm dependencies, no CDN requests. `calculator-core.js` is tested with Node's built-in test runner; `app.js`/`index.html` are verified by opening the file in a browser.

**Tech Stack:** Vanilla HTML/CSS/JS. Testing via `node --test` (Node 18+ built-in, zero dependencies).

## Global Constraints

- No build process, no npm dependencies, no CSS or JS framework, no CDN requests. (spec: Architecture)
- Frame count formula: `durationSeconds = duration × (unit === 'hours' ? 3600 : 60)`; `usableSeconds = durationSeconds × (1 − buffer/100)`; `frames = ceil(usableSeconds / exposureSeconds)`. (spec: Calculation)
- Buffer % default 15, clamped to 0–99 regardless of typed value. (spec: Inputs, Behavior)
- Exposure dropdown options: 60s, 120s, 180s, 300s, Other (Other reveals a numeric seconds input). (spec: Inputs)
- Non-numeric or negative duration/buffer treated as 0 for calculation — no error state, no blocking. (spec: Behavior)
- Live recalculation on every input change, no submit button. (spec: Behavior)
- Output: frame count headline + usable imaging time, time lost to buffer, actual total capture time, all formatted as h/m. (spec: Output)

---

### Task 1: Core frame calculation (`calculateFrames`, `clampBuffer`)

**Files:**
- Create: `calculator-core.js`
- Test: `calculator-core.test.js`

**Interfaces:**
- Produces: `calculateFrames({ duration, unit, bufferPercent, exposureSeconds }) => { frames, durationSeconds, usableSeconds, bufferSeconds, actualCaptureSeconds }`
- Produces: `clampBuffer(value) => number` (0–99)
- Both exported via `module.exports` when `module` is defined (Node), remain plain global functions in the browser (classic `<script>`, no bundler).

- [ ] **Step 1: Write the failing tests**

Create `calculator-core.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateFrames, clampBuffer } = require('./calculator-core.js');

test('clampBuffer keeps values within 0-99', () => {
  assert.equal(clampBuffer(15), 15);
  assert.equal(clampBuffer(150), 99);
  assert.equal(clampBuffer(-10), 0);
  assert.equal(clampBuffer('abc'), 0);
});

test('calculateFrames: 4 hours, 15% buffer, 300s exposure', () => {
  const result = calculateFrames({ duration: 4, unit: 'hours', bufferPercent: 15, exposureSeconds: 300 });
  assert.equal(result.durationSeconds, 14400);
  assert.equal(result.usableSeconds, 12240);
  assert.equal(result.frames, 41);
  assert.equal(result.actualCaptureSeconds, 12300);
  assert.equal(result.bufferSeconds, 2160);
});

test('calculateFrames: minutes unit, no buffer', () => {
  const result = calculateFrames({ duration: 90, unit: 'minutes', bufferPercent: 0, exposureSeconds: 60 });
  assert.equal(result.durationSeconds, 5400);
  assert.equal(result.usableSeconds, 5400);
  assert.equal(result.frames, 90);
  assert.equal(result.actualCaptureSeconds, 5400);
  assert.equal(result.bufferSeconds, 0);
});

test('calculateFrames: rounds partial frames up', () => {
  const result = calculateFrames({ duration: 1, unit: 'hours', bufferPercent: 0, exposureSeconds: 300 });
  // 3600s / 300s = 12 exactly, bump duration slightly via buffer-free minutes to force a remainder
  const result2 = calculateFrames({ duration: 61, unit: 'minutes', bufferPercent: 0, exposureSeconds: 300 });
  assert.equal(result.frames, 12);
  assert.equal(result2.durationSeconds, 3660);
  assert.equal(result2.frames, 13); // ceil(3660/300) = ceil(12.2) = 13
  assert.equal(result2.actualCaptureSeconds, 3900);
});

test('calculateFrames: negative or non-numeric duration treated as 0', () => {
  const result = calculateFrames({ duration: -5, unit: 'hours', bufferPercent: 15, exposureSeconds: 300 });
  assert.equal(result.durationSeconds, 0);
  assert.equal(result.frames, 0);

  const result2 = calculateFrames({ duration: 'abc', unit: 'hours', bufferPercent: 15, exposureSeconds: 300 });
  assert.equal(result2.durationSeconds, 0);
  assert.equal(result2.frames, 0);
});

test('calculateFrames: zero or missing exposure produces zero frames, no crash', () => {
  const result = calculateFrames({ duration: 4, unit: 'hours', bufferPercent: 15, exposureSeconds: 0 });
  assert.equal(result.frames, 0);
  assert.equal(result.actualCaptureSeconds, 0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test calculator-core.test.js`
Expected: FAIL — `Cannot find module './calculator-core.js'`

- [ ] **Step 3: Write the implementation**

Create `calculator-core.js`:

```js
function clampBuffer(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.min(99, Math.max(0, n));
}

function calculateFrames({ duration, unit, bufferPercent, exposureSeconds }) {
  const safeDuration = Math.max(0, Number(duration) || 0);
  const safeBuffer = clampBuffer(bufferPercent);
  const safeExposure = Math.max(0, Number(exposureSeconds) || 0);

  const durationSeconds = safeDuration * (unit === 'hours' ? 3600 : 60);
  const usableSeconds = durationSeconds * (1 - safeBuffer / 100);
  const frames = safeExposure > 0 ? Math.ceil(usableSeconds / safeExposure) : 0;
  const actualCaptureSeconds = frames * safeExposure;
  const bufferSeconds = durationSeconds - usableSeconds;

  return { frames, durationSeconds, usableSeconds, bufferSeconds, actualCaptureSeconds };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateFrames, clampBuffer };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test calculator-core.test.js`
Expected: PASS — `# pass 6`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add calculator-core.js calculator-core.test.js
git commit -m "feat: add core frame calculation logic"
```

---

### Task 2: Duration formatting helper (`formatDuration`)

**Files:**
- Modify: `calculator-core.js`
- Modify: `calculator-core.test.js`

**Interfaces:**
- Consumes: nothing from Task 1 (standalone pure function).
- Produces: `formatDuration(totalSeconds) => string` — e.g. `"3h 24m"`, `"1h"`, `"30m"`, `"0m"`. Exported alongside `calculateFrames`/`clampBuffer`.

- [ ] **Step 1: Write the failing tests**

Append to `calculator-core.test.js` (update the require line to also pull in `formatDuration`):

```js
const { calculateFrames, clampBuffer, formatDuration } = require('./calculator-core.js');
```

Add these tests:

```js
test('formatDuration: hours and minutes', () => {
  assert.equal(formatDuration(12240), '3h 24m'); // 204 min
  assert.equal(formatDuration(5400), '1h 30m'); // 90 min
});

test('formatDuration: whole hours only', () => {
  assert.equal(formatDuration(3600), '1h');
});

test('formatDuration: minutes only', () => {
  assert.equal(formatDuration(1800), '30m');
  assert.equal(formatDuration(0), '0m');
});

test('formatDuration: rounds to nearest minute', () => {
  assert.equal(formatDuration(89), '1m'); // 89s rounds to 1m
  assert.equal(formatDuration(29), '0m'); // 29s rounds to 0m
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test calculator-core.test.js`
Expected: FAIL — `formatDuration is not a function` (or `is not defined`)

- [ ] **Step 3: Write the implementation**

In `calculator-core.js`, add the function above `calculateFrames` (order doesn't matter, keep functions grouped) and update the export block:

```js
function formatDuration(totalSeconds) {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}
```

Update the export block at the bottom of `calculator-core.js`:

```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateFrames, clampBuffer, formatDuration };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test calculator-core.test.js`
Expected: PASS — `# pass 10`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add calculator-core.js calculator-core.test.js
git commit -m "feat: add duration formatting helper"
```

---

### Task 3: Page markup and styling

**Files:**
- Create: `index.html`
- Create: `styles.css`

**Interfaces:**
- Produces: DOM element IDs that Task 4 binds to: `duration`, `duration-unit`, `buffer`, `exposure`, `exposure-custom`, `frame-count`, `usable-time`, `buffer-time`, `capture-time`.
- Consumes: nothing (static markup; `calculator-core.js`/`app.js` are loaded via `<script>` tags but not required to exist yet for this task's manual check — a blank page with no console errors is sufficient here since `app.js` doesn't exist until Task 4).

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Autorun Frame Calculator</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="calculator">
    <h1 class="calculator__title">Autorun Frame Calculator</h1>
    <p class="calculator__subtitle">Plan how many sub-frames an imaging session will produce.</p>

    <form class="calculator__form">
      <div class="field-group">
        <label for="duration">Session duration</label>
        <div class="field-group__row">
          <input type="number" id="duration" min="0" step="0.1" value="4" inputmode="decimal">
          <select id="duration-unit">
            <option value="hours" selected>Hours</option>
            <option value="minutes">Minutes</option>
          </select>
        </div>
      </div>

      <div class="field-group">
        <label for="buffer">Buffer / waste %</label>
        <input type="number" id="buffer" min="0" max="99" step="1" value="15" inputmode="decimal">
      </div>

      <div class="field-group">
        <label for="exposure">Exposure time</label>
        <select id="exposure">
          <option value="60">60s</option>
          <option value="120">120s</option>
          <option value="180">180s</option>
          <option value="300" selected>300s</option>
          <option value="other">Other</option>
        </select>
        <input type="number" id="exposure-custom" min="1" step="1" placeholder="Seconds" class="field-group__custom" hidden>
      </div>
    </form>

    <section class="result" aria-live="polite">
      <p class="result__headline"><span id="frame-count">0</span> frames</p>
      <dl class="result__breakdown">
        <div class="result__row">
          <dt>Usable imaging time</dt>
          <dd id="usable-time">0m</dd>
        </div>
        <div class="result__row">
          <dt>Time lost to buffer</dt>
          <dd id="buffer-time">0m</dd>
        </div>
        <div class="result__row">
          <dt>Actual total capture time</dt>
          <dd id="capture-time">0m</dd>
        </div>
      </dl>
    </section>
  </main>

  <script src="calculator-core.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `styles.css`**

```css
:root {
  color-scheme: light dark;
  --card-bg: #ffffff;
  --page-bg: #f2f4f7;
  --text: #1a1a1a;
  --text-muted: #5b6270;
  --border: #d9dce1;
  --accent: #2f6fed;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 1rem;
  background: var(--page-bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.calculator {
  width: 100%;
  max-width: 32rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 2rem;
}

.calculator__title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}

.calculator__subtitle {
  margin: 0 0 1.5rem;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.calculator__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.field-group input,
.field-group select {
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font-size: 1rem;
  background: var(--card-bg);
  color: var(--text);
}

.field-group__row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
}

.field-group__custom {
  margin-top: 0.5rem;
}

.result {
  margin-top: 1.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.result__headline {
  margin: 0 0 1rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--accent);
}

.result__breakdown {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result__row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.result__row dt {
  font-weight: 500;
}

.result__row dd {
  margin: 0;
  color: var(--text);
}

@media (prefers-color-scheme: dark) {
  :root {
    --card-bg: #1c1f26;
    --page-bg: #101216;
    --text: #edeef0;
    --text-muted: #9aa2b1;
    --border: #2c303a;
    --accent: #5b8dfb;
  }
}
```

- [ ] **Step 3: Manually verify markup renders**

Open `index.html` directly in a browser (double-click the file, or `open index.html` on macOS). Confirm: the form renders with duration/unit/buffer/exposure fields, the result section shows placeholder zeros, and there are no console errors other than `calculateFrames is not defined` (expected — `app.js` doesn't exist yet).

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "feat: add calculator page markup and styling"
```

---

### Task 4: DOM wiring and live recalculation

**Files:**
- Create: `app.js`
- Modify: `index.html` (already references `app.js`, no change needed — verify the `<script>` tag from Task 3 is present)

**Interfaces:**
- Consumes: `calculateFrames({ duration, unit, bufferPercent, exposureSeconds })` and `formatDuration(totalSeconds)` as global functions from `calculator-core.js` (Tasks 1–2). Consumes DOM element IDs from Task 3: `duration`, `duration-unit`, `buffer`, `exposure`, `exposure-custom`, `frame-count`, `usable-time`, `buffer-time`, `capture-time`.
- Produces: live-updating text content in `#frame-count`, `#usable-time`, `#buffer-time`, `#capture-time` on any input change.

- [ ] **Step 1: Create `app.js`**

```js
(function () {
  const durationInput = document.getElementById('duration');
  const unitSelect = document.getElementById('duration-unit');
  const bufferInput = document.getElementById('buffer');
  const exposureSelect = document.getElementById('exposure');
  const exposureCustomInput = document.getElementById('exposure-custom');

  const frameCountEl = document.getElementById('frame-count');
  const usableTimeEl = document.getElementById('usable-time');
  const bufferTimeEl = document.getElementById('buffer-time');
  const captureTimeEl = document.getElementById('capture-time');

  function getExposureSeconds() {
    if (exposureSelect.value === 'other') {
      return Number(exposureCustomInput.value) || 0;
    }
    return Number(exposureSelect.value);
  }

  function updateExposureVisibility() {
    exposureCustomInput.hidden = exposureSelect.value !== 'other';
  }

  function recalculate() {
    const result = calculateFrames({
      duration: durationInput.value,
      unit: unitSelect.value,
      bufferPercent: bufferInput.value,
      exposureSeconds: getExposureSeconds(),
    });

    frameCountEl.textContent = result.frames;
    usableTimeEl.textContent = formatDuration(result.usableSeconds);
    bufferTimeEl.textContent = formatDuration(result.bufferSeconds);
    captureTimeEl.textContent = formatDuration(result.actualCaptureSeconds);
  }

  [durationInput, unitSelect, bufferInput, exposureSelect, exposureCustomInput].forEach((el) => {
    el.addEventListener('input', () => {
      updateExposureVisibility();
      recalculate();
    });
    el.addEventListener('change', () => {
      updateExposureVisibility();
      recalculate();
    });
  });

  updateExposureVisibility();
  recalculate();
})();
```

- [ ] **Step 2: Manually verify end-to-end in a browser**

Open `index.html` (or refresh if already open). With the default values (4 hours, 15% buffer, 300s exposure), confirm the result section shows:
- `41 frames`
- Usable imaging time: `3h 24m`
- Time lost to buffer: `36m`
- Actual total capture time: `3h 25m`

Then check live updates:
- Change duration unit to "Minutes" and duration to `90`, buffer to `0`, exposure to `60s` → expect `90 frames`, usable time `1h 30m`, buffer time `0m`, capture time `1h 30m`.
- Select exposure "Other" → confirm the custom seconds input appears; type `45` → frame count recalculates using 45s exposure.
- Clear the duration field entirely → confirm frame count drops to `0` with no thrown error in the console.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: wire calculator UI to core calculation logic"
```

---

## Self-Review Notes

- **Spec coverage:** duration (hours/minutes toggle) → Task 3/4; buffer % default 15, clamped 0–99 → Task 1/3; exposure dropdown 60/120/180/300/Other → Task 3/4; formula (durationSeconds/usableSeconds/frames/actualCaptureSeconds/bufferSeconds) → Task 1; output breakdown → Task 3/4; live recalculation → Task 4; validation (non-numeric/negative → 0) → Task 1; styling (semantic CSS, responsive, no framework) → Task 3. All spec sections have a task.
- **Placeholder scan:** none — every step has complete, runnable code.
- **Type consistency:** `calculateFrames` return shape (`frames`, `durationSeconds`, `usableSeconds`, `bufferSeconds`, `actualCaptureSeconds`) is identical across Task 1's implementation and Task 4's consumption. `formatDuration(totalSeconds)` signature matches between Task 2 and Task 4. DOM IDs match exactly between Task 3's markup and Task 4's `getElementById` calls.
