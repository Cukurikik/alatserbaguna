/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { files, format, crossfadeMs, gapMs } = event.data;
  const filesList: File[] = files;
  
  try {
    self.postMessage({ type: 'progress', value: 2 });
    
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => {
        self.postMessage({ type: 'progress', value: 20 + Math.round(progress * 70) });
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    }

    self.postMessage({ type: 'progress', value: 10 });

    const virtualFiles = [];
    const filterParts = [];
    let filterComplex = '';
    const outputName = 'output.' + format;

    // Write all files to MEMFS
    for (let i = 0; i < filesList.length; i++) {
        const f = filesList[i];
        const vName = `input${i}_${f.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        virtualFiles.push(vName);
        
        self.postMessage({ type: 'log', message: `Writing ${f.name} to memory...` });
        const data = await f.arrayBuffer();
        await ffmpeg.writeFile(vName, new Uint8Array(data));
        self.postMessage({ type: 'progress', value: 10 + Math.round((i/filesList.length)*10) });
    }

    self.postMessage({ type: 'log', message: `Building FFmpeg arguments for ${filesList.length} files...` });

    if (crossfadeMs > 0) {
      // Crossfade logic using acrossfade filter
      const crossfadeSec = (crossfadeMs / 1000).toFixed(2);
      let currentPad = '[0:a]';
      
      for (let i = 1; i < virtualFiles.length; i++) {
          const nextPad = `[${i}:a]`;
          const outPad = i === virtualFiles.length - 1 ? '[outa]' : `[xfade${i}]`;
          filterComplex += `${currentPad}${nextPad}acrossfade=d=${crossfadeSec}:c1=tri:c2=tri${outPad};`;
          currentPad = `[xfade${i}]`;
      }
      
      const args = [];
      virtualFiles.forEach(vf => { args.push('-i', vf); });
      args.push('-filter_complex', filterComplex.slice(0, -1));
      args.push('-map', '[outa]');
      args.push('-c:a', format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac'));
      args.push('-y', outputName);
      
      await ffmpeg.exec(args);

    } else if (gapMs > 0) {
      // Gap insertion using adelay and amix, or concat with anullsrc
      const gapSec = (gapMs / 1000).toFixed(2);
      await ffmpeg.exec(['-f', 'lavfi', '-i', `anullsrc=r=44100:cl=stereo`, '-t', gapSec, 'gap.wav']);
      
      let listContent = '';
      for (let i = 0; i < virtualFiles.length; i++) {
          listContent += `file '${virtualFiles[i]}'\n`;
          if (i < virtualFiles.length - 1) {
              listContent += `file 'gap.wav'\n`;
          }
      }
      await ffmpeg.writeFile('list.txt', listContent);
      
      const args = ['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c:a', format === 'mp3' ? 'libmp3lame' : 'copy', '-y', outputName];
      await ffmpeg.exec(args);
      await ffmpeg.deleteFile('gap.wav');
      await ffmpeg.deleteFile('list.txt');
    } else {
      // Pure concat using demuxer (fastest, requires same codec usually, but ffmpeg can re-encode if needed)
      let concatParams = '';
      for (let i = 0; i < virtualFiles.length; i++) {
          concatParams += `[${i}:0]`;
      }
      concatParams += `concat=n=${virtualFiles.length}:v=0:a=1[out]`;
      
      const args = [];
      virtualFiles.forEach(vf => { args.push('-i', vf); });
      args.push('-filter_complex', concatParams);
      args.push('-map', '[out]');
      args.push('-c:a', format === 'mp3' ? 'libmp3lame' : (format === 'wav' ? 'pcm_s16le' : 'aac'));
      args.push('-y', outputName);
      
      await ffmpeg.exec(args);
    }

    self.postMessage({ type: 'progress', value: 95 });

    const outputData = await ffmpeg.readFile(outputName);
    const blob = new Blob([outputData as ArrayBuffer], { type: `audio/${format === 'm4a' ? 'mp4' : format}` });
    const sizeMB = blob.size / (1024 * 1024);

    // Cleanup memfs
    for (const vf of virtualFiles) { await ffmpeg.deleteFile(vf); }
    await ffmpeg.deleteFile(outputName);

    self.postMessage({ type: 'complete', data: { blob, sizeMB } });

  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Worker FFmpeg failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
