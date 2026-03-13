/// <reference lib="webworker" />
addEventListener('message', async ({ data }) => {
  if (data.type === 'start') {
    const { inputFile, outputFormat, crf, preset } = data.config;
    postMessage({ type: 'progress', value: 0 });
    try {
      // FFmpeg command: ffmpeg -i input -c:v libx264 -crf <crf> -preset <preset> output.<format>
      for (let i = 1; i <= 12; i++) {
        await new Promise(r => setTimeout(r, 200));
        postMessage({ type: 'progress', value: Math.round((i / 12) * 100) });
      }
      const blob = new Blob(['Compressed video output'], { type: `video/${outputFormat}` });
      postMessage({ type: 'complete', data: blob });
    } catch (err: any) {
      postMessage({ type: 'error', message: err.message });
    }
  }
});