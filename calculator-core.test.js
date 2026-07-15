const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateFrames, clampOverhead, formatDuration } = require('./dist/calculator-core.js');

test('clampOverhead keeps values within 0-99', () => {
  assert.equal(clampOverhead(15), 15);
  assert.equal(clampOverhead(150), 99);
  assert.equal(clampOverhead(-10), 0);
  assert.equal(clampOverhead('abc'), 0);
});

test('calculateFrames: 4 hours, 15% overhead, 300s exposure', () => {
  const result = calculateFrames({ duration: 4, unit: 'hours', overheadPercent: 15, exposureSeconds: 300 });
  assert.equal(result.durationSeconds, 14400);
  assert.equal(result.usableSeconds, 12240);
  assert.equal(result.frames, 41);
  assert.equal(result.actualCaptureSeconds, 12300);
  assert.equal(result.overheadSeconds, 2160);
});

test('calculateFrames: minutes unit, no overhead', () => {
  const result = calculateFrames({ duration: 90, unit: 'minutes', overheadPercent: 0, exposureSeconds: 60 });
  assert.equal(result.durationSeconds, 5400);
  assert.equal(result.usableSeconds, 5400);
  assert.equal(result.frames, 90);
  assert.equal(result.actualCaptureSeconds, 5400);
  assert.equal(result.overheadSeconds, 0);
});

test('calculateFrames: rounds partial frames up', () => {
  const result = calculateFrames({ duration: 1, unit: 'hours', overheadPercent: 0, exposureSeconds: 300 });
  // 3600s / 300s = 12 exactly, bump duration slightly via overhead-free minutes to force a remainder
  const result2 = calculateFrames({ duration: 61, unit: 'minutes', overheadPercent: 0, exposureSeconds: 300 });
  assert.equal(result.frames, 12);
  assert.equal(result2.durationSeconds, 3660);
  assert.equal(result2.frames, 13); // ceil(3660/300) = ceil(12.2) = 13
  assert.equal(result2.actualCaptureSeconds, 3900);
});

test('calculateFrames: negative or non-numeric duration treated as 0', () => {
  const result = calculateFrames({ duration: -5, unit: 'hours', overheadPercent: 15, exposureSeconds: 300 });
  assert.equal(result.durationSeconds, 0);
  assert.equal(result.frames, 0);

  const result2 = calculateFrames({ duration: 'abc', unit: 'hours', overheadPercent: 15, exposureSeconds: 300 });
  assert.equal(result2.durationSeconds, 0);
  assert.equal(result2.frames, 0);
});

test('calculateFrames: zero or missing exposure produces zero frames, no crash', () => {
  const result = calculateFrames({ duration: 4, unit: 'hours', overheadPercent: 15, exposureSeconds: 0 });
  assert.equal(result.frames, 0);
  assert.equal(result.actualCaptureSeconds, 0);
});

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
