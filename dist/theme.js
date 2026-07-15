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
})();
