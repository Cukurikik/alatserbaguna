import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { AudioReplacerOptions } from './audio-replacer.types';

export class AudioReplacerEngine {
  private ffmpeg = getFFmpegEngine();

  async process(videoFile: File, options: AudioReplacerOptions): Promise<File> {
    if (!options.audioFile) throw new Error('Audio file is required');
    
    await this.ffmpeg.load();
    
    const videoInput = 'video' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const audioInput = 'audio' + options.audioFile.name.substring(options.audioFile.name.lastIndexOf('.'));
    const outputName = 'output' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    
    await this.ffmpeg.writeFile(videoInput, videoFile);
    await this.ffmpeg.writeFile(audioInput, options.audioFile);
    
    const args: string[] = ['-i', videoInput, '-i', audioInput];
    
    if (options.keepOriginalAudio) {
      // Mix original and new audio
      args.push('-filter_complex', `[0:a]volume=${options.originalVolume}[a1];[1:a]volume=${options.audioVolume}[a2];[a1][a2]amix=inputs=2:duration=first[a]`, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac');
    } else {
      // Replace original audio
      args.push('-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-shortest');
    }
    
    args.push(outputName);
    
    await this.ffmpeg.run(args);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(videoInput);
    await this.ffmpeg.deleteFile(audioInput);
    await this.ffmpeg.deleteFile(outputName);
    
    return new File([data], `replaced_${videoFile.name}`, { type: videoFile.type });
  }
}
