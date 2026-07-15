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
