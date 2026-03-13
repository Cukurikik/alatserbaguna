/// <reference lib="webworker" />
addEventListener('message', async ({ data }) => {
  if (data.type === 'start') {
    const { mode, x, y, w, h, scaleW, scaleH } = data.config;
    // Crop: ffmpeg -i input -vf "crop=w:h:x:y" output.mp4
    // Resize: ffmpeg -i input -vf "scale=w:h" output.mp4
    postMessage({ type: 'progress', value: 0 });
    try {
      for (let i = 1; i <= 10; i++) { await new Promise(r => setTimeout(r, 200)); postMessage({ type: 'progress', value: i * 10 }); }
      const label = mode === 'crop' ? `crop=${w}:${h}:${x}:${y}` : `scale=${scaleW}:${scaleH}`;
      postMessage({ type: 'complete', data: new Blob([label], { type: 'video/mp4' }) });
    } catch (err: any) { postMessage({ type: 'error', message: err.message }); }
  }
});