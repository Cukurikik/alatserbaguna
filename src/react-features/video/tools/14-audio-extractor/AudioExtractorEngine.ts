import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { AudioExtractorOptions } from './audio-extractor.types';

export class AudioExtractorEngine {
  private ffmpeg = getFFmpegEngine();

  async process(file: File, options: AudioExtractorOptions): Promise<File> {
    await this.ffmpeg.load();
    
    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = `output.${options.format}`;
    
    await this.ffmpeg.writeFile(inputName, file);
    
    const args = ['-i', inputName, '-vn'];
    
    if (options.format === 'mp3') {
      args.push('-ab', options.bitrate);
    } else if (options.format === 'wav') {
      // No extra args needed for standard wav
    }
    
    args.push(outputName);
    
    await this.ffmpeg.run(args);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);
    
    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      aac: 'audio/aac',
      ogg: 'audio/ogg'
    };
    
    return new File([data], `audio.${options.format}`, { type: mimeMap[options.format] });
  }
}
