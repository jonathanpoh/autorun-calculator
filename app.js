(function () {
  const durationInput = document.getElementById('duration');
  const unitSelect = document.getElementById('duration-unit');
  const overheadInput = document.getElementById('overhead');
  const exposureSelect = document.getElementById('exposure');
  const exposureCustomInput = document.getElementById('exposure-custom');

  const frameCountEl = document.getElementById('frame-count');
  const usableTimeEl = document.getElementById('usable-time');
  const overheadTimeEl = document.getElementById('overhead-time');
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
      overheadPercent: overheadInput.value,
      exposureSeconds: getExposureSeconds(),
    });

    frameCountEl.textContent = result.frames;
    usableTimeEl.textContent = formatDuration(result.usableSeconds);
    overheadTimeEl.textContent = formatDuration(result.overheadSeconds);
    captureTimeEl.textContent = formatDuration(result.actualCaptureSeconds);
  }

  [durationInput, unitSelect, overheadInput, exposureSelect, exposureCustomInput].forEach((el) => {
    el.addEventListener('input', () => {
      updateExposureVisibility();
      recalculate();
    });
  });

  updateExposureVisibility();
  recalculate();
})();
