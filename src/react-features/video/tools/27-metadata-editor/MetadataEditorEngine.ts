import { getFFmpegEngine } from '../../engine/FFmpegEngine';
import { MetadataOptions } from './metadata-editor.types';
import { fetchFile } from '@ffmpeg/util';

export class MetadataEditorEngine {
  static async editMetadata(
    videoFile: File,
    options: MetadataOptions
  ): Promise<Uint8Array> {
    const ffmpeg = await getFFmpegEngine();
    const inputName = 'input_video' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const outputName = 'output_metadata.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    const args = ['-i', inputName];
    if (options.title) args.push('-metadata', `title=${options.title}`);
    if (options.artist) args.push('-metadata', `artist=${options.artist}`);
    if (options.comment) args.push('-metadata', `comment=${options.comment}`);
    
    args.push('-c', 'copy', outputName);

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return data as Uint8Array;
  }
}
