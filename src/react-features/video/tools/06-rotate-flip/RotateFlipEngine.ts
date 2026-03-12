import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { RotateFlipOptions } from './rotate-flip.types';

export class RotateFlipEngine {
  private ffmpeg = getFFmpegEngine();

  async process(file: File, options: RotateFlipOptions, onProgress: (p: number) => void): Promise<File> {
    await this.ffmpeg.load();
    
    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = `output.${options.outputFormat}`;
    
    await this.ffmpeg.writeFile(inputName, file);
    
    const filters: string[] = [];
    
    if (options.degrees === 90) filters.push('transpose=1');
    else if (options.degrees === 180) filters.push('transpose=2,transpose=2');
    else if (options.degrees === 270) filters.push('transpose=2');
    
    if (options.flipH) filters.push('hflip');
    if (options.flipV) filters.push('vflip');
    
    const filterStr = filters.length > 0 ? `-vf "${filters.join(',')}"` : '';
    
    this.ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress(Math.round(progress * 100));
    });
    
    const args = ['-i', inputName];
    if (filterStr) {
      args.push(...filterStr.split(' '));
    }
    args.push(outputName);
    
    await this.ffmpeg.run(args);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);
    
    return new File([data], `rotated_${file.name}`, { type: `video/${options.outputFormat}` });
  }
}
