import { getFFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { StabilizerOptions } from './stabilizer.types';

export class StabilizerEngine {
  private ffmpeg = getFFmpegEngine();

  async process(file: File, options: StabilizerOptions, onProgress: (p: number) => void): Promise<File> {
    await this.ffmpeg.load();
    
    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = `output.${options.outputFormat}`;
    const transformFile = 'transforms.trf';
    
    await this.ffmpeg.writeFile(inputName, file);
    
    this.ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      // Pass 1 is roughly 50% of the work, Pass 2 is the other 50%
      onProgress(Math.round(progress * 50));
    });
    
    // Pass 1: Detect motion
    await this.ffmpeg.run(['-i', inputName, '-vf', 'vidstabdetect', '-f', 'null', '-']);
    
    this.ffmpeg.off('progress'); // Reset progress for pass 2
    this.ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress(50 + Math.round(progress * 50));
    });
    
    // Pass 2: Apply stabilization
    await this.ffmpeg.run([
      '-i', inputName, 
      '-vf', `vidstabtransform=smoothing=${options.smoothing}:input='${transformFile}'`, 
      outputName
    ]);
    
    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);
    // await this.ffmpeg.deleteFile(transformFile); // trf file might be created by ffmpeg automatically
    
    return new File([data], `stabilized_${file.name}`, { type: `video/${options.outputFormat}` });
  }
}
