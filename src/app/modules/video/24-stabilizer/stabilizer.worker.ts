/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { StabilizerConfig } from './stabilizer.schema';

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

addEventListener('message', async (event: MessageEvent<{ type: string; config: StabilizerConfig & { fileBuffer: ArrayBuffer, fileName: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, shakiness, accuracy, stepsize } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));

    // Two-pass stabilization
    // Pass 1: generate transform data
    postMessage({ type: 'progress', value: 0 } as WorkerMessage);
    
    const trfName = 'transforms.trf';
    const pass1Args = [
      '-i', fileName,
      '-vf', `vidstabdetect=shakiness=${shakiness}:accuracy=${accuracy}:stepsize=${stepsize}:result=${trfName}`,
      '-f', 'null',
      '-'
    ];

    await ff.exec(pass1Args);
    
    postMessage({ type: 'progress', value: 50 } as WorkerMessage);

    // Pass 2: apply transform data
    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: 50 + Math.round(progress * 50) } as WorkerMessage);
    });

    const outputName = `omni_stabilized_${fileName}`;
    const pass2Args = [
      '-i', fileName,
      '-vf', `vidstabtransform=input=${trfName}:zoom=0:smoothing=10`,
      '-c:a', 'copy',
      outputName
    ];

    await ff.exec(pass2Args);

    const data = await ff.readFile(outputName);
    
    // Cleanup
    await ff.deleteFile(fileName);
    await ff.deleteFile(outputName);
    try { await ff.deleteFile(trfName); } catch (e) {}

    postMessage({ type: 'complete', data: new Uint8Array(data as Uint8Array) } as WorkerMessage<Uint8Array>);
  } catch (error) {
    postMessage({ type: 'error', message: String(error), errorCode: 'FFMPEG_COMMAND_FAILED' } as WorkerMessage);
  }
});
