self.onmessage = async (e) => {
  const { images, duration, fps, transition } = e.data;
  try {
    for (let i = 0; i < images.length; i++) { await new Promise(r => setTimeout(r, 150)); self.postMessage({ type: 'progress', value: Math.round(((i+1)/images.length)*100) }); }
    self.postMessage({ type: 'complete', data: new ArrayBuffer(0) });
  } catch (err: any) { self.postMessage({ type: 'error', message: err.message }); }
};