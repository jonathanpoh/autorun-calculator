// Astronomical twilight (sun at -12deg altitude) start/end times, derived
// from the low-precision solar position formulas in Jean Meeus'
// "Astronomical Algorithms" (the same public-domain equations behind most
// sunrise/sunset calculators). No external libraries, no network calls.
(function (global) {
  const RAD = Math.PI / 180;
  const DAY_MS = 1000 * 60 * 60 * 24;
  const J1970 = 2440588;
  const J2000 = 2451545;
  const OBLIQUITY = RAD * 23.4397;
  const ASTRONOMICAL_TWILIGHT_ANGLE = RAD * -12;

  function toDays(date) {
    return date.valueOf() / DAY_MS - 0.5 + J1970 - J2000;
  }

  function fromJulian(j) {
    return new Date((j + 0.5 - J1970) * DAY_MS);
  }

  function solarMeanAnomaly(d) {
    return RAD * (357.5291 + 0.98560028 * d);
  }

  function eclipticLongitude(M) {
    const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    const P = RAD * 102.9372;
    return M + C + P + Math.PI;
  }

  function declination(L) {
    return Math.asin(Math.sin(OBLIQUITY) * Math.sin(L));
  }

  function julianCycle(d, lw) {
    return Math.round(d - 0.0009 - lw / (2 * Math.PI));
  }

  function approxTransit(Ht, lw, n) {
    return 0.0009 + (Ht + lw) / (2 * Math.PI) + n;
  }

  function solarTransitJ(ds, M, L) {
    return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  }

  // Returns the astronomical dusk (evening) and dawn (morning) Date objects
  // for the night that starts on `date`'s evening. Either field is null if
  // the sun never reaches -12deg at this latitude/time of year (polar
  // summer), in which case there's no well-defined twilight window.
  function getAstronomicalTwilightWindow(date, lat, lon) {
    const lw = RAD * -lon;
    const phi = RAD * lat;

    function computeDay(d0) {
      const d = toDays(d0);
      const n = julianCycle(d, lw);
      const ds = approxTransit(0, lw, n);
      const M = solarMeanAnomaly(ds);
      const L = eclipticLongitude(M);
      const dec = declination(L);
      const Jnoon = solarTransitJ(ds, M, L);

      const cosH = (Math.sin(ASTRONOMICAL_TWILIGHT_ANGLE) - Math.sin(phi) * Math.sin(dec)) /
        (Math.cos(phi) * Math.cos(dec));
      if (cosH < -1 || cosH > 1) return null;

      const w = Math.acos(cosH);
      const a = approxTransit(w, lw, n);
      const Jset = solarTransitJ(a, M, L);
      const Jrise = Jnoon - (Jset - Jnoon);
      return { dawn: fromJulian(Jrise), dusk: fromJulian(Jset) };
    }

    const today = computeDay(date);
    const tomorrow = computeDay(new Date(date.getTime() + DAY_MS));

    return {
      start: today ? today.dusk : null,
      end: tomorrow ? tomorrow.dawn : null,
    };
  }

  // Whether `date` falls between the start of astronomical twilight one
  // evening and the end of astronomical twilight the following morning.
  function isAstronomicalNight(date, lat, lon) {
    const window = getAstronomicalTwilightWindow(date, lat, lon);
    if (window.start && date >= window.start) return true;

    const yesterday = new Date(date.getTime() - DAY_MS);
    const prevWindow = getAstronomicalTwilightWindow(yesterday, lat, lon);
    if (prevWindow.start && prevWindow.end) {
      return date >= prevWindow.start && date < prevWindow.end;
    }
    return false;
  }

  const api = { getAstronomicalTwilightWindow, isAstronomicalNight };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.Twilight = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
