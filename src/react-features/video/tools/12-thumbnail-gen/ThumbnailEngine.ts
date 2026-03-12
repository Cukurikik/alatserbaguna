import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { ThumbnailOptions } from './thumbnail-gen.types';

export class ThumbnailEngine {
  private ffmpeg = getFFmpegEngine();

  async process(file: File, options: ThumbnailOptions): Promise<File> {
    await this.ffmpeg.load();
    
    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = `thumbnail.${options.format}`;
    
    await this.ffmpeg.writeFile(inputName, file);
    
    // Extract single frame at timestamp
    await this.ffmpeg.run([
      '-ss', options.timestamp.toString(),
      '-i', inputName,
      '-vframes', '1',
      '-vf', `scale=${options.width}:-1`,
      outputName
    ]);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);
    
    return new File([data], `thumbnail_${options.timestamp}s.${options.format}`, { type: `image/${options.format}` });
  }
}
