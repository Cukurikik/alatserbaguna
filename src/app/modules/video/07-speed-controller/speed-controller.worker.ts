/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { SpeedConfig } from './speed-controller.schema';

let ffmpeg: FFmpeg | null = null;

async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  return ffmpeg;
}

function buildAtempoChain(speed: number): string[] {
  if (speed <= 2.0 && speed >= 0.5) {
    return [`atempo=${speed}`];
  }
  
  if (speed > 2.0) {
    const chain: string[] = [];
    let currentSpeed = speed;
    while (currentSpeed > 2.0) {
      chain.push('atempo=2.0');
      currentSpeed /= 2.0;
    }
    if (currentSpeed > 1.0) {
      chain.push(`atempo=${currentSpeed}`);
    }
    return chain;
  }
  
  if (speed < 0.5) {
    const chain: string[] = [];
    let currentSpeed = speed;
    while (currentSpeed < 0.5) {
      chain.push('atempo=0.5');
      currentSpeed /= 0.5;
    }
    if (currentSpeed < 1.0) {
      chain.push(`atempo=${currentSpeed}`);
    }
    return chain;
  }
  
  return [];
}

addEventListener('message', async (event: MessageEvent<{ type: string; config: SpeedConfig & { fileBuffer: ArrayBuffer, fileName: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, speed, audioMode } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputName = `omni_speed_${fileName}`;
    const args = ['-i', fileName];

    const videoFilter = `setpts=${1 / speed}*PTS`;
    
    if (audioMode === 'mute') {
      args.push('-filter:v', videoFilter);
      args.push('-an');
    } else if (audioMode === 'pitchCorrect') {
      const atempoChain = buildAtempoChain(speed).join(',');
      args.push('-filter_complex', `[0:v]${videoFilter}[v];[0:a]${atempoChain}[a]`);
      args.push('-map', '[v]', '-map', '[a]');
    } else {
      // keep audio without pitch correction
      const sampleRate = 44100 * speed;
      args.push('-filter_complex', `[0:v]${videoFilter}[v];[0:a]asetrate=${sampleRate},aresample=44100[a]`);
      args.push('-map', '[v]', '-map', '[a]');
    }

    if (speed < 1.0) {
      args.push('-preset', 'ultrafast');
    }

    args.push(outputName);
    await ff.exec(args);

    const data = await ff.readFile(outputName);
    await ff.deleteFile(fileName);
    await ff.deleteFile(outputName);

    postMessage({ type: 'complete', data: new Uint8Array(data as Uint8Array) } as WorkerMessage<Uint8Array>);
  } catch (error) {
    postMessage({ type: 'error', message: String(error), errorCode: 'FFMPEG_COMMAND_FAILED' } as WorkerMessage);
  }
});
