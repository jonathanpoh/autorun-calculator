(function () {
  const toggle = document.getElementById('theme-toggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const LIGHT_THEME_COLOR = '#f2f4f7'; // matches styles.css :root --page-bg
  const DARK_THEME_COLOR = '#101216'; // matches styles.css prefers-color-scheme: dark --page-bg
  const NIGHT_THEME_COLOR = '#000000'; // matches styles.css [data-theme="night"] --page-bg
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function isNightVisionOn() {
    return document.documentElement.getAttribute('data-theme') === 'night';
  }

  function syncToggleState() {
    toggle.setAttribute('aria-pressed', String(isNightVisionOn()));
  }

  function syncThemeColorMeta() {
    if (isNightVisionOn()) {
      themeColorMeta.setAttribute('content', NIGHT_THEME_COLOR);
    } else {
      themeColorMeta.setAttribute('content', darkModeQuery.matches ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    }
  }

  function setNightVision(on) {
    if (on) {
      document.documentElement.setAttribute('data-theme', 'night');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem('nightVision', on ? 'on' : 'off');
    } catch (e) {}
    syncToggleState();
    syncThemeColorMeta();
  }

  toggle.addEventListener('click', () => {
    setNightVision(!isNightVisionOn());
  });

  syncToggleState();
  syncThemeColorMeta();

  darkModeQuery.addEventListener('change', syncThemeColorMeta);

  // Auto night vision: enable from the start of astronomical twilight
  // through to the end of astronomical twilight the next morning. Requires
  // geolocation; if permission is denied or unavailable, this silently
  // no-ops and the toggle above stays fully manual.
  const AUTO_CHECK_INTERVAL_MS = 60 * 1000;
  let coords = loadCachedCoords();
  let lastComputedNight = null;

  function loadCachedCoords() {
    try {
      const lat = localStorage.getItem('astroLat');
      const lon = localStorage.getItem('astroLon');
      return lat !== null && lon !== null ? { lat: Number(lat), lon: Number(lon) } : null;
    } catch (e) {
      return null;
    }
  }

  function cacheCoords(lat, lon) {
    try {
      localStorage.setItem('astroLat', String(lat));
      localStorage.setItem('astroLon', String(lon));
    } catch (e) {}
  }

  function applyAutoNightVision() {
    if (!coords || typeof window.Twilight === 'undefined') return;
    const computed = window.Twilight.isAstronomicalNight(new Date(), coords.lat, coords.lon);
    // Only force a change when the astro state itself has flipped (a real
    // dusk/dawn transition), not just because it differs from whatever the
    // manual toggle currently shows - that would fight the manual override.
    if (lastComputedNight === null || computed !== lastComputedNight) {
      lastComputedNight = computed;
      setNightVision(computed);
    }
  }

  if (coords) applyAutoNightVision();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        coords = { lat: position.coords.latitude, lon: position.coords.longitude };
        cacheCoords(coords.lat, coords.lon);
        applyAutoNightVision();
      },
      () => {},
      { maximumAge: 60 * 60 * 1000 }
    );
  }

  setInterval(applyAutoNightVision, AUTO_CHECK_INTERVAL_MS);
})();
