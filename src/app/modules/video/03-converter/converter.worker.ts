/// <reference lib="webworker" />
addEventListener('message', async ({ data }) => {
  if (data.type === 'start') {
    const { inputFile, outputFormat, resolution, crf } = data.config;
    postMessage({ type: 'progress', value: 0 });
    try {
      // FFmpeg command: ffmpeg -i input -vf scale=<res> -c:v libx264 -crf <crf> -preset ultrafast output.<format>
      for (let i = 1; i <= 10; i++) {
        await new Promise(r => setTimeout(r, 250));
        postMessage({ type: 'progress', value: i * 10 });
      }
      const blob = new Blob(['Converted video output'], { type: `video/${outputFormat}` });
      postMessage({ type: 'complete', data: blob });
    } catch (err: any) {
      postMessage({ type: 'error', message: err.message });
    }
  }
});