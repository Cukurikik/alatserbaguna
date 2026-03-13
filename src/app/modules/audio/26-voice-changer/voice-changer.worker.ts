/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { VoiceEffectParams } from './voice-changer.service';

let ffmpeg: FFmpeg | null = null;

function buildAtempoChain(speed: number): string {
  if (speed >= 0.5 && speed <= 2.0) return `atempo=${speed.toFixed(4)}`;
  if (speed > 2.0) {
    const parts: string[] = [];
    let r = speed;
    while (r > 2.0) { parts.push('atempo=2.0'); r /= 2.0; }
    parts.push(`atempo=${r.toFixed(4)}`);
    return parts.join(',');
  }
  const parts: string[] = [];
  let r = speed;
  while (r < 0.5) { parts.push('atempo=0.5'); r /= 0.5; }
  parts.push(`atempo=${r.toFixed(4)}`);
  return parts.join(',');
}

self.onmessage = async (event: MessageEvent) => {
  const { file, format, params } = event.data as { file: File; format: string; params: VoiceEffectParams };
  const { pitchSemitones, speed, robotMode, robotFrequency, echoDelay, echoDecay } = params;

  try {
    self.postMessage({ type: 'progress', value: 2 });
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => { self.postMessage({ type: 'progress', value: 10 + Math.round(progress * 82) }); });
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({ coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'), wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm') });
    }
    self.postMessage({ type: 'progress', value: 10 });

    const inputName = 'vc_in.' + file.name.split('.').pop();
    const outputName = 'vc_out.' + format;
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
    const codec = format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac');

    const filters: string[] = [];

    if (robotMode) {
      // Robot: replace with buzz tone at fixed frequency via sample-rate trick
      filters.push(`asetrate=44100,aresample=${robotFrequency}*44,aresample=44100`);
      self.postMessage({ type: 'log', message: `Robot mode: ${robotFrequency} Hz buzz` });
    } else {
      // Pitch shift via asetrate (changes pitch + speed) then atempo to correct speed
      if (pitchSemitones !== 0) {
        const pitchFactor = Math.pow(2, pitchSemitones / 12);
        const newRate = Math.round(44100 * pitchFactor);
        filters.push(`asetrate=${newRate}`);
        // Bring back to original duration using atempo
        filters.push(`aresample=44100`);
        self.postMessage({ type: 'log', message: `Pitch: ${pitchSemitones > 0 ? '+' : ''}${pitchSemitones} semitones (factor ${pitchFactor.toFixed(4)})` });
      }

      // Additional speed change via atempo if needed
      if (Math.abs(speed - 1.0) > 0.01) {
        filters.push(buildAtempoChain(speed));
        self.postMessage({ type: 'log', message: `Speed: ${speed}x` });
      }
    }

    // Echo effect
    if (echoDelay > 0) {
      filters.push(`aecho=0.8:0.88:${Math.round(echoDelay)}:${echoDecay.toFixed(2)}`);
      self.postMessage({ type: 'log', message: `Echo: delay ${echoDelay}ms, decay ${echoDecay}` });
    }

    const filterChain = filters.length > 0 ? filters.join(',') : 'acopy';
    await ffmpeg.exec(['-i', inputName, '-af', filterChain, '-c:a', codec, '-y', outputName]);

    self.postMessage({ type: 'progress', value: 95 });
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: `audio/${format}` });
    await ffmpeg.deleteFile(inputName); await ffmpeg.deleteFile(outputName);
    self.postMessage({ type: 'complete', data: { blob, sizeMB: blob.size / 1024 / 1024 } });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Voice changer failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
