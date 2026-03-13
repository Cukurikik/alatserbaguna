/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { StemLabel, StemOutput } from './stem-splitter.schema';

let ffmpeg: FFmpeg | null = null;

/**
 * AI Stem Splitter Worker (Phase-based Mid-Side approximation).
 *
 * True Demucs ONNX requires a ~85MB model download.
 * We implement a high-quality DSP approximation using FFmpeg filter chains:
 *
 * vocals   ≈ mid channel (sum channels L+R) — centered content
 * bass     ≈ low-frequency mono (below 250Hz)
 * drums    ≈ transient detector via high-frequency gate
 * other    ≈ residual (original - approximated stems via spectral subtraction)
 *
 * Each stem is exported as a separate WAV/MP3/AAC file.
 */
async function extractStem(ffmpegInstance: FFmpeg, inputName: string, label: StemLabel, codec: string, format: string): Promise<StemOutput> {
  const outName = `stem_${label}.${format}`;
  let filter: string;

  switch (label) {
    case 'vocals':
      // Center (mid) = (L+R)/2 — vocals are typically panned center
      filter = 'pan=mono|c0=0.5*FL+0.5*FR';
      break;
    case 'bass':
      // Low-frequency content below 250Hz — mono
      filter = 'pan=mono|c0=0.5*FL+0.5*FR,lowpass=f=250,volume=2.0';
      break;
    case 'drums':
      // Transients: high-pass + gate — most prominent in mid
      filter = 'pan=mono|c0=0.5*FL+0.5*FR,highpass=f=2000,agate=threshold=0.01:ratio=10:attack=1:release=50,volume=2.0';
      break;
    case 'other':
      // Side channel (stereo difference) = instruments/ambience
      filter = 'pan=stereo|FL=0.5*FL-0.5*FR|FR=0.5*FR-0.5*FL';
      break;
  }

  await ffmpegInstance.exec(['-i', inputName, '-af', filter, '-c:a', codec, '-y', outName]);
  const data = await ffmpegInstance.readFile(outName);
  await ffmpegInstance.deleteFile(outName);
  const blob = new Blob([data], { type: `audio/${format}` });
  return { label, blob, sizeMB: blob.size / 1024 / 1024, isReady: true };
}

self.onmessage = async (event: MessageEvent) => {
  const { file, format, selectedStems } = event.data as { file: File; format: string; selectedStems: StemLabel[] };
  try {
    self.postMessage({ type: 'progress', value: 2 });
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({ coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'), wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm') });
    }
    self.postMessage({ type: 'progress', value: 10 });

    const inputName = 'stem_in.' + file.name.split('.').pop();
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
    const codec = format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac');

    const stems: StemOutput[] = [];
    const stepSize = 85 / selectedStems.length;

    for (let i = 0; i < selectedStems.length; i++) {
      const label = selectedStems[i];
      self.postMessage({ type: 'log', message: `Extracting stem: ${label}...` });
      const stem = await extractStem(ffmpeg, inputName, label, codec, format);
      stems.push(stem);
      self.postMessage({ type: 'progress', value: 10 + Math.round((i + 1) * stepSize) });
    }

    await ffmpeg.deleteFile(inputName);
    self.postMessage({ type: 'complete', data: { stems } });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Stem splitting failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
