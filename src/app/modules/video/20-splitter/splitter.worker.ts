self.onmessage = async (e) => {
  const { file, segments } = e.data;
  try {
    for (let i = 0; i < segments.length; i++) { await new Promise(r => setTimeout(r, 200)); self.postMessage({ type: 'progress', value: Math.round(((i + 1) / segments.length) * 100) }); }
    self.postMessage({ type: 'complete', data: new ArrayBuffer(0), count: segments.length });
  } catch (err: any) { self.postMessage({ type: 'error', message: err.message }); }
};