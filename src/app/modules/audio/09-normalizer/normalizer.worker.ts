/// <reference lib="webworker" />
// Audio Normalizer Worker — processes audio in background thread
// Runs inside Web Worker, no Angular context available

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;
  try {
    self.postMessage({ type: 'progress', value: 10 });
    // TODO: Implement normalizer audio processing logic here
    // For now: pass through using FFmpeg via postMessage
    self.postMessage({ type: 'log', message: '[normalizer] Worker started, processing...' });
    self.postMessage({ type: 'progress', value: 50 });
    // Signal completion with empty result (actual FFmpeg runs in effects via FfmpegAudioService)
    self.postMessage({ type: 'complete', data: null });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Unknown worker error', errorCode: 'WORKER_CRASHED' });
  }
};
