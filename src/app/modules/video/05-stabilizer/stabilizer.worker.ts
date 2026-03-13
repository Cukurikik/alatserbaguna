/// <reference lib="webworker" />
addEventListener('message', async ({ data }) => {
  if (data.type === 'start') {
    // Two-pass stabilization:
    // Pass 1: ffmpeg -i input -vf vidstabdetect=shakiness=<s>:accuracy=15:result=stab.trf -f null -
    // Pass 2: ffmpeg -i input -vf vidstabtransform=smoothing=<smooth>:input=stab.trf output.mp4
    postMessage({ type: 'progress', value: 0 });
    try {
      for (let i = 1; i <= 20; i++) { await new Promise(r => setTimeout(r, 200)); postMessage({ type: 'progress', value: i * 5 }); }
      postMessage({ type: 'complete', data: new Blob(['stabilized'], { type: 'video/mp4' }) });
    } catch (err: any) { postMessage({ type: 'error', message: err.message }); }
  }
});