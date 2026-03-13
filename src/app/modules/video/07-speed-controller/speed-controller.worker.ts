/// <reference lib="webworker" />
addEventListener('message', async ({ data }) => {
  if (data.type === 'start') {
    const { speed } = data.config;
    // FFmpeg: -vf "setpts=(1/speed)*PTS" -af "atempo=speed" 
    postMessage({ type: 'progress', value: 0 });
    for (let i = 1; i <= 10; i++) { await new Promise(r => setTimeout(r, 250)); postMessage({ type: 'progress', value: i * 10 }); }
    postMessage({ type: 'complete', data: new Blob([`video at ${speed}x`], { type: 'video/mp4' }) });
  }
});