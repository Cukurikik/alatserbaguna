self.onmessage = async (e) => {
  const { inputFile, startTime, duration, fps, width, loop } = e.data;
  try {
    // 2-pass GIF: palettegen then paletteuse
    for (let i = 5; i <= 90; i += 5) { await new Promise(r => setTimeout(r, 90)); self.postMessage({ type: 'progress', value: i }); }
    self.postMessage({ type: 'complete', data: new ArrayBuffer(0) });
  } catch (err: any) { self.postMessage({ type: 'error', message: err.message }); }
};