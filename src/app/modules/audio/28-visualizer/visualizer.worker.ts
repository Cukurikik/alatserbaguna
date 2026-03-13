/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { VisualizerConfig } from './visualizer.schema';

let ffmpeg: FFmpeg | null = null;

const COLORS: Record<string, string[]> = {
  cyan:    ['#06b6d4', '#0891b2', '#0e7490'],
  purple:  ['#a855f7', '#9333ea', '#7c3aed'],
  rainbow: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6'],
  green:   ['#22c55e', '#16a34a', '#15803d'],
};

/**
 * Render a single frame onto an OffscreenCanvas based on FFT/waveform data.
 * Returns PNG ArrayBuffer.
 */
async function renderFrame(canvas: OffscreenCanvas, fftData: Float32Array, timeData: Float32Array, config: VisualizerConfig, frame: number): Promise<ArrayBuffer> {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const colors = COLORS[config.colorTheme] ?? COLORS['cyan'];

  // Background
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  if (config.style === 'bars') {
    const barCount = Math.min(fftData.length, 128);
    const barWidth = width / barCount;
    for (let i = 0; i < barCount; i++) {
      const normalized = Math.max(0, (fftData[i] + 140) / 140); // -140dB to 0
      const barH = normalized * height;
      const color = colors[i % colors.length];
      ctx.fillStyle = color;
      ctx.fillRect(i * barWidth, height - barH, barWidth - 1, barH);
    }
  } else if (config.style === 'waveform') {
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < timeData.length; i++) {
      const x = (i / timeData.length) * width;
      const y = ((timeData[i] + 1) / 2) * height;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else if (config.style === 'circle') {
    const cx = width / 2, cy = height / 2;
    const radius = Math.min(width, height) * 0.25;
    const count = Math.min(fftData.length, 256);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const normalized = Math.max(0, (fftData[i] + 140) / 140);
      const len = normalized * radius;
      const x1 = cx + Math.cos(angle) * radius;
      const y1 = cy + Math.sin(angle) * radius;
      const x2 = cx + Math.cos(angle) * (radius + len);
      const y2 = cy + Math.sin(angle) * (radius + len);
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
  }

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return blob.arrayBuffer();
}

self.onmessage = async (event: MessageEvent) => {
  const config = event.data as VisualizerConfig;
  const { file, resolution, fps, style, colorTheme, backgroundColor } = config;

  try {
    self.postMessage({ type: 'progress', value: 2 });

    // Decode audio
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new OfflineAudioContext(2, 1, 44100);
    const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const sampleRate = decoded.sampleRate;
    const duration = decoded.duration;
    const totalFrames = Math.floor(duration * fps);

    const [w, h] = resolution === '1080p' ? [1920, 1080] : [1280, 720];
    const canvas = new OffscreenCanvas(w, h);

    self.postMessage({ type: 'log', message: `Rendering ${totalFrames} frames at ${fps} FPS (${resolution})` });

    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({ coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'), wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm') });
    }

    // Write audio file
    await ffmpeg.writeFile('vis_audio.wav', new Uint8Array(arrayBuffer));

    // Process each frame
    const channelData = decoded.getChannelData(0);
    const fftSize = 1024;
    const halfFft = fftSize / 2;

    for (let f = 0; f < totalFrames; f++) {
      const samplePos = Math.floor((f / fps) * sampleRate);
      const timeSlice = channelData.slice(samplePos, samplePos + fftSize);

      // Simple FFT magnitude approximation using windowed energy
      const fftData = new Float32Array(halfFft);
      for (let i = 0; i < halfFft; i++) {
        let re = 0, im = 0;
        for (let n = 0; n < Math.min(fftSize, timeSlice.length); n++) {
          const angle = (2 * Math.PI * i * n) / fftSize;
          re += (timeSlice[n] || 0) * Math.cos(angle);
          im -= (timeSlice[n] || 0) * Math.sin(angle);
        }
        fftData[i] = 20 * Math.log10(Math.sqrt(re * re + im * im) / fftSize + 1e-6);
      }

      const framePng = await renderFrame(canvas, fftData, timeSlice, config, f);
      await ffmpeg.writeFile(`frame_${String(f).padStart(5, '0')}.png`, new Uint8Array(framePng));

      if (f % 30 === 0) {
        self.postMessage({ type: 'progress', value: 10 + Math.round((f / totalFrames) * 75) });
        self.postMessage({ type: 'log', message: `Frame ${f}/${totalFrames}` });
      }
    }

    self.postMessage({ type: 'progress', value: 85 });
    self.postMessage({ type: 'log', message: 'Encoding video with FFmpeg...' });

    await ffmpeg.exec([
      '-framerate', String(fps),
      '-i', 'frame_%05d.png',
      '-i', 'vis_audio.wav',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-pix_fmt', 'yuv420p',
      '-shortest',
      '-y', 'vis_out.mp4'
    ]);

    self.postMessage({ type: 'progress', value: 97 });
    const mp4 = await ffmpeg.readFile('vis_out.mp4');
    const blob = new Blob([mp4], { type: 'video/mp4' });

    // Cleanup
    await ffmpeg.deleteFile('vis_audio.wav');
    await ffmpeg.deleteFile('vis_out.mp4');
    for (let f = 0; f < totalFrames; f++) {
      await ffmpeg.deleteFile(`frame_${String(f).padStart(5, '0')}.png`).catch(() => {});
    }

    self.postMessage({ type: 'complete', data: { blob, sizeMB: blob.size / 1024 / 1024 } });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Visualizer failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
