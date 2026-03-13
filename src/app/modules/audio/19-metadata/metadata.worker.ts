/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { AudioTags } from './metadata.schema';

let ffmpeg: FFmpeg | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { file, tags, stripAll } = event.data as { file: File; tags: AudioTags; stripAll: boolean; };
  try {
    self.postMessage({ type: 'progress', value: 2 });
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress }) => {
        self.postMessage({ type: 'progress', value: 10 + Math.round(progress * 80) });
      });
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    }
    self.postMessage({ type: 'progress', value: 10 });

    const ext = file.name.split('.').pop() ?? 'mp3';
    const inputName = 'input_metadata.' + ext;
    const outputName = 'output_metadata.' + ext;
    const fileData = await file.arrayBuffer();
    await ffmpeg.writeFile(inputName, new Uint8Array(fileData));

    const metaArgs: string[] = [];
    if (stripAll) {
      metaArgs.push('-map_metadata', '-1');
    } else {
      const tagMap: Record<keyof AudioTags, string> = {
        title: 'title', artist: 'artist', albumArtist: 'album_artist',
        album: 'album', year: 'date', genre: 'genre', track: 'track',
        disc: 'disc', comment: 'comment', composer: 'composer', copyright: 'copyright'
      };
      for (const [field, ffmpegKey] of Object.entries(tagMap) as [keyof AudioTags, string][]) {
        const val = tags[field];
        if (val && val.trim()) metaArgs.push('-metadata', `${ffmpegKey}=${val.trim()}`);
      }
    }

    await ffmpeg.exec(['-i', inputName, ...metaArgs, '-c', 'copy', '-y', outputName]);

    self.postMessage({ type: 'progress', value: 95 });
    const outputData = await ffmpeg.readFile(outputName);
    const mimeType = ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : `audio/${ext}`;
    const blob = new Blob([outputData as any], { type: mimeType });
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    self.postMessage({ type: 'complete', data: { blob } });

  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Metadata write failed', errorCode: 'FFMPEG_LOAD_FAILED' });
  }
};
