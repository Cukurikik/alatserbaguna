import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { ConvertOptions } from './converter.types';

export class ConverterEngine {
  async convert(file: File, options: ConvertOptions, onProgress: (progress: number) => void): Promise<File> {
    const engine = getFFmpegEngine();
    await engine.load();

    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`;
    const outputName = `output_${Date.now()}.${options.outputFormat}`;

    await engine.writeFile(inputName, file);

    const progressHandler = ({ progress }: { progress: number }) => {
      onProgress(Math.round(progress * 100));
    };
    engine.on('progress', progressHandler);

    try {
      const args = ['-i', inputName];

      if (options.outputFormat === 'gif') {
        // GIF requires a palette pass for good quality, but for simplicity we'll do a basic conversion here.
        // The actual GIF converter tool (Tool 14) will do the 2-pass.
        args.push('-vf', `fps=${options.fps || 15},scale=${options.resolution || '320:-1'}:flags=lanczos`);
      } else {
        if (options.codec && options.codec !== 'auto') {
          args.push('-c:v', options.codec);
        }
        
        if (options.preset !== 'custom') {
          if (options.preset === 'fast') args.push('-preset', 'ultrafast', '-crf', '28');
          if (options.preset === 'balanced') args.push('-preset', 'fast', '-crf', '23');
          if (options.preset === 'quality') args.push('-preset', 'medium', '-crf', '18');
        } else {
          if (options.bitrate) args.push('-b:v', options.bitrate);
          if (options.fps) args.push('-r', options.fps);
          if (options.resolution) args.push('-s', options.resolution);
        }
      }

      args.push(outputName);

      await engine.run(args);

      const data = await engine.readFile(outputName);
      
      await engine.deleteFile(inputName);
      await engine.deleteFile(outputName);

      const mimeType = options.outputFormat === 'gif' ? 'image/gif' : `video/${options.outputFormat}`;
      return new File([data as BlobPart], `converted.${options.outputFormat}`, { type: mimeType });
    } finally {
      engine.off('progress', progressHandler);
    }
  }
}
