self.onmessage = async (e) => {
  const { file, count, quality, timestamp } = e.data;
  try {
    const interval = timestamp > 0 ? 0 : 1 / count;
    for (let i = 0; i < count; i++) { await new Promise(r => setTimeout(r, 60)); self.postMessage({ type: 'progress', value: Math.round((i / count) * 100) }); }
    self.postMessage({ type: 'complete', data: new ArrayBuffer(0), count, quality });
  } catch (err: any) { self.postMessage({ type: 'error', message: err.message }); }
};