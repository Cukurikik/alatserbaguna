self.onmessage = async (e) => {
  const { file, brightness, contrast, saturation, gamma, hue, sharpness } = e.data;
  try {
    // Build FFmpeg eq filter chain
    const eqFilter = `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}:gamma=${gamma},hue=h=${hue}${sharpness !== 0 ? `,unsharp=5:5:${sharpness}:3:3:0` : ''}`;
    // Simulated progress
    for (let i = 10; i <= 90; i += 10) {
      await new Promise(r => setTimeout(r, 100));
      self.postMessage({ type: 'progress', value: i });
    }
    // In production: call FFmpeg WASM with -vf eqFilter
    self.postMessage({ type: 'complete', data: new ArrayBuffer(0), filter: eqFilter });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message });
  }
};