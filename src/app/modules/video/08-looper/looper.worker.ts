/// <reference lib="webworker" />
addEventListener('message', async ({ data }) => {
  if (data.type === 'start') {
    const { loops } = data.config;
    // FFmpeg: -stream_loop N -i input.mp4 -c copy output.mp4
    postMessage({ type: 'progress', value: 0 });
    for (let i = 1; i <= loops; i++) { await new Promise(r => setTimeout(r, 300)); postMessage({ type: 'progress', value: Math.round((i / loops) * 100) }); }
    postMessage({ type: 'complete', data: new Blob([`looped ${loops}x`], { type: 'video/mp4' }) });
  }
});