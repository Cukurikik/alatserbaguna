self.onmessage = async (e) => {
  const { file, operation } = e.data;
  try {
    for (let i = 10; i <= 90; i += 10) { await new Promise(r => setTimeout(r, 80)); self.postMessage({ type: 'progress', value: i }); }
    self.postMessage({ type: 'complete', data: new ArrayBuffer(0) });
  } catch (err: any) { self.postMessage({ type: 'error', message: err.message }); }
};