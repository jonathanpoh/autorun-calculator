function clampBuffer(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.min(99, Math.max(0, n));
}

function formatDuration(totalSeconds) {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
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
  module.exports = { calculateFrames, clampBuffer, formatDuration };
}
