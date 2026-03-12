import { ffmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { TrimOptions } from './trimmer.types';

export class TrimmerEngine {
  static async trim(file: File, options: TrimOptions, onProgress: (progress: number) => void): Promise<File> {
    const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
    const outputName = 'output' + file.name.substring(file.name.lastIndexOf('.'));
    
    await ffmpegEngine.writeFile(inputName, file);
    
    const progressHandler = (data: unknown) => {
      const { progress } = data as { progress: number };
      onProgress(Math.round(progress * 100));
    };
    
    ffmpegEngine.on('progress', progressHandler);
    
    await ffmpegEngine.run([
      '-ss', options.startTime.toString(),
      '-to', options.endTime.toString(),
      '-i', inputName,
      '-c', 'copy',
      outputName
    ]);
    
    ffmpegEngine.off('progress', progressHandler);
    
    const data = await ffmpegEngine.readFile(outputName);
    const blob = new Blob([new Uint8Array(data)], { type: file.type });
    const outputFile = new File([blob], `trimmed_${file.name}`, { type: file.type });
    
    await ffmpegEngine.deleteFile(inputName);
    await ffmpegEngine.deleteFile(outputName);
    
    return outputFile;
  }
}
