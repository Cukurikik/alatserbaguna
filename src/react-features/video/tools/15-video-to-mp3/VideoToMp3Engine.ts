import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { VideoToMp3Options } from './video-to-mp3.types';

export class VideoToMp3Engine {
  private ffmpeg = getFFmpegEngine();

  async process(file: File, options: VideoToMp3Options): Promise<File> {
    await this.ffmpeg.load();
    
    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = 'output.mp3';
    
    await this.ffmpeg.writeFile(inputName, file);
    
    await this.ffmpeg.run([
      '-i', inputName,
      '-vn',
      '-acodec', 'libmp3lame',
      '-ab', options.bitrate,
      '-ac', options.channels,
      '-ar', options.sampleRate,
      outputName
    ]);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);
    
    return new File([data], 'audio.mp3', { type: 'audio/mpeg' });
  }
}
