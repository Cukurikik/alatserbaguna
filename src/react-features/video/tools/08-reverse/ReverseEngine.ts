import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { ReverseOptions } from './reverse.types';

export class ReverseEngine {
  private ffmpeg = getFFmpegEngine();

  async process(file: File, options: ReverseOptions, onProgress: (p: number) => void): Promise<File> {
    await this.ffmpeg.load();
    
    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = `output.${options.outputFormat}`;
    
    await this.ffmpeg.writeFile(inputName, file);
    
    this.ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress(Math.round(progress * 100));
    });
    
    const args = ['-i', inputName];
    
    const videoFilter = 'reverse';
    const audioFilter = options.reverseAudio ? 'areverse' : '';
    
    args.push('-vf', videoFilter);
    if (audioFilter) {
      args.push('-af', audioFilter);
    }
    
    args.push(outputName);
    
    await this.ffmpeg.run(args);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);
    
    return new File([data], `reversed_${file.name}`, { type: `video/${options.outputFormat}` });
  }
}
