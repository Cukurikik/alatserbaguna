/// <reference lib="webworker" />
addEventListener('message', async ({ data }) => {
  if (data.type === 'start') {
    const { flip, rotation } = data.config;
    // Build vf filter chain: hflip, vflip, transpose=1, etc.
    const filters: string[] = [];
    if (flip === 'horizontal' || flip === 'both') filters.push('hflip');
    if (flip === 'vertical' || flip === 'both') filters.push('vflip');
    if (rotation === 90) filters.push('transpose=1');
    if (rotation === 180) filters.push('transpose=1,transpose=1');
    if (rotation === 270) filters.push('transpose=2');
    // ffmpeg -i input.mp4 -vf "hflip,transpose=1" -c:v libx264 -preset ultrafast output.mp4
    postMessage({ type: 'progress', value: 0 });
    for (let i = 1; i <= 10; i++) { await new Promise(r => setTimeout(r, 250)); postMessage({ type: 'progress', value: i * 10 }); }
    postMessage({ type: 'complete', data: new Blob([`transformed: ${filters.join(',')}`], { type: 'video/mp4' }) });
  }
});