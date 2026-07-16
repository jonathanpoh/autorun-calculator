const test = require('node:test');
const assert = require('node:assert/strict');
const { getAstronomicalTwilightWindow, isAstronomicalNight } = require('./dist/twilight.js');

// Setubal, Portugal
const LAT = 38.52;
const LON = -8.89;

test('getAstronomicalTwilightWindow: summer night starts evening, ends next morning', () => {
  const window = getAstronomicalTwilightWindow(new Date('2026-07-16T12:00:00Z'), LAT, LON);
  assert.ok(window.start instanceof Date);
  assert.ok(window.end instanceof Date);
  assert.ok(window.start.getUTCDate() === 16);
  assert.ok(window.end.getUTCDate() === 17);
  assert.ok(window.end.valueOf() > window.start.valueOf());
});

test('getAstronomicalTwilightWindow: winter night is longer than summer night', () => {
  const summer = getAstronomicalTwilightWindow(new Date('2026-07-16T12:00:00Z'), LAT, LON);
  const winter = getAstronomicalTwilightWindow(new Date('2026-01-16T12:00:00Z'), LAT, LON);
  const summerHours = (summer.end - summer.start) / 3600000;
  const winterHours = (winter.end - winter.start) / 3600000;
  assert.ok(winterHours > summerHours);
});

test('isAstronomicalNight: true late evening and before dawn, false at midday', () => {
  assert.equal(isAstronomicalNight(new Date('2026-07-16T23:00:00Z'), LAT, LON), true);
  assert.equal(isAstronomicalNight(new Date('2026-07-17T02:00:00Z'), LAT, LON), true);
  assert.equal(isAstronomicalNight(new Date('2026-07-16T12:00:00Z'), LAT, LON), false);
});

test('isAstronomicalNight: false right after dawn ends, true right before it', () => {
  const window = getAstronomicalTwilightWindow(new Date('2026-07-16T12:00:00Z'), LAT, LON);
  const justBeforeDawn = new Date(window.end.getTime() - 60000);
  const justAfterDawn = new Date(window.end.getTime() + 60000);
  assert.equal(isAstronomicalNight(justBeforeDawn, LAT, LON), true);
  assert.equal(isAstronomicalNight(justAfterDawn, LAT, LON), false);
});

test('isAstronomicalNight: false right before dusk starts, true right after it', () => {
  const window = getAstronomicalTwilightWindow(new Date('2026-07-16T12:00:00Z'), LAT, LON);
  const justBeforeDusk = new Date(window.start.getTime() - 60000);
  const justAfterDusk = new Date(window.start.getTime() + 60000);
  assert.equal(isAstronomicalNight(justBeforeDusk, LAT, LON), false);
  assert.equal(isAstronomicalNight(justAfterDusk, LAT, LON), true);
});
