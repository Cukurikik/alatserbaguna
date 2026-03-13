self.onmessage = async (e) => {
  const { file, model, factor } = e.data;
  try {
    for (let i = 2; i <= 95; i += 3) { await new Promise(r => setTimeout(r, 200)); self.postMessage({ type: 'progress', value: i }); }
    self.postMessage({ type: 'complete', data: new ArrayBuffer(0) });
  } catch (err: any) { self.postMessage({ type: 'error', message: err.message }); }
};