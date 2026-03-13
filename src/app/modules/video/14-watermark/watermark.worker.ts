self.onmessage = async (e) => {
  const { file, text, position, opacity, fontSize, fontColor } = e.data;
  try {
    const posMap: Record<string, string> = { 'top-left':'x=20:y=20','top-right':'x=w-tw-20:y=20','bottom-left':'x=20:y=h-th-20','bottom-right':'x=w-tw-20:y=h-th-20','center':'x=(w-tw)/2:y=(h-th)/2' };
    const xy = posMap[position] || posMap['bottom-right'];
    const opHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
    const filter = `drawtext=text='${text}':${xy}:fontsize=${fontSize}:fontcolor=${fontColor}@${opHex}`;
    for (let i = 10; i <= 90; i += 10) { await new Promise(r => setTimeout(r, 80)); self.postMessage({ type: 'progress', value: i }); }
    self.postMessage({ type: 'complete', data: new ArrayBuffer(0), filter });
  } catch (err: any) { self.postMessage({ type: 'error', message: err.message }); }
};