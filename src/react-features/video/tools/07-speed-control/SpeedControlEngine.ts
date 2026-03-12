import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { SpeedControlOptions } from './speed-control.types';

export class SpeedControlEngine {
  private ffmpeg = getFFmpegEngine();

  async process(file: File, options: SpeedControlOptions, onProgress: (p: number) => void): Promise<File> {
    await this.ffmpeg.load();
    
    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = `output.${options.outputFormat}`;
    
    await this.ffmpeg.writeFile(inputName, file);
    
    // Video speed: setpts=PTS/multiplier
    // Audio speed: atempo=multiplier (range 0.5 to 2.0)
    
    const videoFilter = `setpts=PTS/${options.multiplier}`;
    let audioFilter = '';
    
    if (options.multiplier >= 0.5 && options.multiplier <= 2.0) {
      audioFilter = `atempo=${options.multiplier}`;
    } else if (options.multiplier > 2.0) {
      // Chain multiple atempo filters for > 2x
      const count = Math.ceil(Math.log(options.multiplier) / Math.log(2));
      const factor = Math.pow(options.multiplier, 1/count);
      audioFilter = Array(count).fill(`atempo=${factor}`).join(',');
    } else {
      // Chain multiple atempo filters for < 0.5x
      const count = Math.ceil(Math.log(1/options.multiplier) / Math.log(2));
      const factor = Math.pow(options.multiplier, 1/count);
      audioFilter = Array(count).fill(`atempo=${factor}`).join(',');
    }
    
    this.ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress(Math.round(progress * 100));
    });
    
    const args = [
      '-i', inputName,
      '-vf', videoFilter,
      '-af', audioFilter,
      outputName
    ];
    
    await this.ffmpeg.run(args);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);
    
    return new File([data], `speed_${options.multiplier}x_${file.name}`, { type: `video/${options.outputFormat}` });
  }
}
