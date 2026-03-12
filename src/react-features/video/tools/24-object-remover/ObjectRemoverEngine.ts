import { getFFmpegEngine } from '../../engine/FFmpegEngine';
import { ObjectRemoverOptions } from './object-remover.types';
import { fetchFile } from '@ffmpeg/util';

export class ObjectRemoverEngine {
  static async removeObject(
    videoFile: File,
    options: ObjectRemoverOptions
  ): Promise<Uint8Array> {
    const ffmpeg = await getFFmpegEngine();
    const inputName = 'input_video' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const outputName = 'output_removed.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    // delogo=x=10:y=10:w=100:h=77:band=1
    const filter = `delogo=x=${options.x}:y=${options.y}:w=${options.width}:h=${options.height}:band=${options.band || 1}`;

    await ffmpeg.exec([
      '-i', inputName,
      '-vf', filter,
      '-c:a', 'copy',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return data as Uint8Array;
  }
}
