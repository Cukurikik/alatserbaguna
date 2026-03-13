/// <reference lib="webworker" />
addEventListener('message', async ({ data }) => {
  if (data.type === 'start') {
    // FFmpeg: ffmpeg -i input.mp4 -vf reverse -af areverse output.mp4
    postMessage({ type: 'progress', value: 0 });
    try {
      for (let i = 1; i <= 10; i++) { await new Promise(r => setTimeout(r, 300)); postMessage({ type: 'progress', value: i * 10 }); }
      postMessage({ type: 'complete', data: new Blob(['reversed'], { type: 'video/mp4' }) });
    } catch (err: any) { postMessage({ type: 'error', message: err.message }); }
  }
});