/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';
import { AddAudioConfig } from './add-audio.schema';

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

addEventListener('message', async (event: MessageEvent<{ type: string; config: Omit<AddAudioConfig, 'inputFile' | 'audioFile'> & { fileBuffer: ArrayBuffer, fileName: string, audioBuffer: ArrayBuffer, audioFileName: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { fileBuffer, fileName, audioBuffer, audioFileName, mode, videoVolume, audioVolume, loopAudio } = config;

  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(fileName, new Uint8Array(fileBuffer));
    await ff.writeFile(audioFileName, new Uint8Array(audioBuffer));

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputName = `omni_audio_added_${fileName}`;
    const args: string[] = [];

    args.push('-i', fileName);
    
    if (loopAudio) {
      args.push('-stream_loop', '-1');
    }
    args.push('-i', audioFileName);

    if (mode === 'replace') {
      // Replace original audio with new audio
      args.push('-c:v', 'copy'); // Copy video
      args.push('-map', '0:v:0'); // Map video from first input
      args.push('-map', '1:a:0'); // Map audio from second input
      
      if (audioVolume !== 1) {
        args.push('-filter:a', `volume=${audioVolume}`);
      }
      
      args.push('-shortest'); // End when the shortest input ends
    } else if (mode === 'mix') {
      // Mix original audio and new audio
      args.push('-filter_complex', `[0:a]volume=${videoVolume}[a1];[1:a]volume=${audioVolume}[a2];[a1][a2]amix=inputs=2:duration=first:dropout_transition=2[a]`);
      args.push('-map', '0:v:0'); // Map video from first input
      args.push('-map', '[a]'); // Map mixed audio
      args.push('-c:v', 'copy'); // Copy video
      args.push('-c:a', 'aac'); // Encode audio to aac
    }

    args.push(outputName);

    await ff.exec(args);

    const data = await ff.readFile(outputName);
    await ff.deleteFile(fileName);
    await ff.deleteFile(audioFileName);
    await ff.deleteFile(outputName);

    postMessage({ type: 'complete', data: new Uint8Array(data as Uint8Array) } as WorkerMessage<Uint8Array>);
  } catch (error) {
    postMessage({ type: 'error', message: String(error), errorCode: 'FFMPEG_COMMAND_FAILED' } as WorkerMessage);
  }
});
