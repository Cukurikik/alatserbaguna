import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { LoopOptions } from './loop.types';

export class LoopEngine {
  private ffmpeg = getFFmpegEngine();

  async process(file: File, options: LoopOptions, onProgress: (p: number) => void): Promise<File> {
    await this.ffmpeg.load();
    
    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = `output.${options.outputFormat}`;
    
    await this.ffmpeg.writeFile(inputName, file);
    
    this.ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress(Math.round(progress * 100));
    });
    
    // Using stream_loop for efficiency
    const args = [
      '-stream_loop', (options.loopCount - 1).toString(),
      '-i', inputName,
      '-c', 'copy',
      outputName
    ];
    
    await this.ffmpeg.run(args);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);
    
    return new File([data], `looped_${options.loopCount}x_${file.name}`, { type: `video/${options.outputFormat}` });
  }
}
