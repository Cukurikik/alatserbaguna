import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { MergeOptions } from './merger.types';

export class MergerEngine {
  async merge(options: MergeOptions, onProgress: (progress: number) => void): Promise<File> {
    const engine = getFFmpegEngine();
    await engine.load();

    const { files, transition } = options;
    if (files.length < 2) {
      throw new Error('At least two files are required for merging');
    }

    const fileNames = files.map((f, i) => `input_${i}.mp4`);
    
    // Write all files to FFmpeg virtual file system
    for (let i = 0; i < files.length; i++) {
      await engine.writeFile(fileNames[i], files[i]);
    }

    const outputName = 'output.mp4';

    // Set up progress listener
    const progressHandler = ({ progress }: { progress: number }) => {
      onProgress(Math.round(progress * 100));
    };
    engine.on('progress', progressHandler);

    try {
      if (transition === 'none') {
        // Simple concat protocol
        const listContent = fileNames.map(name => `file '${name}'`).join('\n');
        await engine.writeFile('list.txt', new TextEncoder().encode(listContent));
        
        await engine.run([
          '-f', 'concat',
          '-safe', '0',
          '-i', 'list.txt',
          '-c', 'copy',
          outputName
        ]);
        
        await engine.deleteFile('list.txt');
      } else {
        // Complex filtergraph for transitions
        const inputs = fileNames.flatMap(name => ['-i', name]);
        
        // Build concat filter string
        let filterStr = '';
        for (let i = 0; i < fileNames.length; i++) {
          filterStr += `[${i}:v:0][${i}:a:0]`;
        }
        filterStr += `concat=n=${fileNames.length}:v=1:a=1[outv][outa]`;
        
        await engine.run([
          ...inputs,
          '-filter_complex', filterStr,
          '-map', '[outv]',
          '-map', '[outa]',
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          outputName
        ]);
      }

      // Read output
      const data = await engine.readFile(outputName);
      
      // Cleanup
      for (const name of fileNames) {
        await engine.deleteFile(name);
      }
      await engine.deleteFile(outputName);

      return new File([data as BlobPart], 'merged_video.mp4', { type: 'video/mp4' });
    } finally {
      engine.off('progress', progressHandler);
    }
  }
}
