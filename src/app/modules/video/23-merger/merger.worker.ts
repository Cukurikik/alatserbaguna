/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { WorkerMessage } from '../shared/types/video.types';

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

addEventListener('message', async (event: MessageEvent<{ type: string; config: { files: { buffer: ArrayBuffer, name: string }[], resolution: string, transition: string } }>) => {
  if (event.data.type !== 'start') return;

  const { config } = event.data;
  const { files, resolution, transition } = config;

  try {
    const ff = await loadFFmpeg();
    
    // Write all files
    for (const file of files) {
      await ff.writeFile(file.name, new Uint8Array(file.buffer));
    }

    ff.on('progress', ({ progress }) => {
      postMessage({ type: 'progress', value: Math.round(progress * 100) } as WorkerMessage);
    });

    const outputName = `omni_merged.mp4`;
    
    // We will use the concat demuxer if no transition and original resolution
    // Otherwise, we need filter_complex
    
    if (transition === 'none' && resolution === 'original') {
      // Create list.txt
      const listContent = files.map(f => `file '${f.name}'`).join('\n');
      await ff.writeFile('list.txt', listContent);
      
      const args = [
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-c', 'copy',
        outputName
      ];
      
      await ff.exec(args);
      await ff.deleteFile('list.txt');
    } else {
      // Complex filter approach
      const args: string[] = [];
      for (const file of files) {
        args.push('-i', file.name);
      }
      
      let filterComplex = '';
      let scale = '';
      if (resolution === '1080p') scale = 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1';
      else if (resolution === '720p') scale = 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1';
      else scale = 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1'; // Fallback to 1080p if mixed
      
      for (let i = 0; i < files.length; i++) {
        filterComplex += `[${i}:v]${scale}[v${i}];`;
        // Audio needs to be resampled to same rate
        filterComplex += `[${i}:a]aresample=44100[a${i}];`;
      }
      
      let concatInputs = '';
      for (let i = 0; i < files.length; i++) {
        concatInputs += `[v${i}][a${i}]`;
      }
      
      filterComplex += `${concatInputs}concat=n=${files.length}:v=1:a=1[outv][outa]`;
      
      args.push('-filter_complex', filterComplex);
      args.push('-map', '[outv]', '-map', '[outa]');
      args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23');
      args.push('-c:a', 'aac', '-b:a', '128k');
      args.push(outputName);
      
      await ff.exec(args);
    }

    const data = await ff.readFile(outputName);
    
    // Cleanup
    for (const file of files) {
      await ff.deleteFile(file.name);
    }
    await ff.deleteFile(outputName);

    postMessage({ type: 'complete', data: new Uint8Array(data as Uint8Array) } as WorkerMessage<Uint8Array>);
  } catch (error) {
    postMessage({ type: 'error', message: String(error), errorCode: 'FFMPEG_COMMAND_FAILED' } as WorkerMessage);
  }
});
