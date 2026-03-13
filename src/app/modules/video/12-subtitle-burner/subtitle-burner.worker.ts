self.onmessage = async (e) => {
  const { videoFile, srtFile, fontName, fontSize, fontColor, position } = e.data;
  try {
    const yPos = position === 'bottom' ? '(h-text_h-20)' : '20';
    const filter = `subtitles=filename=sub.srt:force_style='FontName=${fontName},FontSize=${fontSize},PrimaryColour=${fontColor}'`;
    for (let i = 10; i <= 90; i += 10) { await new Promise(r => setTimeout(r, 80)); self.postMessage({ type: 'progress', value: i }); }
    self.postMessage({ type: 'complete', data: new ArrayBuffer(0), filter });
  } catch (err: any) { self.postMessage({ type: 'error', message: err.message }); }
};