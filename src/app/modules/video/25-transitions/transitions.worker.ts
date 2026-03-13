self.onmessage = async (e) => {
  const { inputFiles, transition, duration } = e.data;
  try {
    for (let i = 5; i <= 90; i += 5) { await new Promise(r => setTimeout(r, 100)); self.postMessage({ type: 'progress', value: i }); }
    self.postMessage({ type: 'complete', data: new ArrayBuffer(0) });
  } catch (err: any) { self.postMessage({ type: 'error', message: err.message }); }
};