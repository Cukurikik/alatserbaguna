import { getFFmpegEngine } from '../../engine/FFmpegEngine';
import { fetchFile } from '@ffmpeg/util';

export class VoiceRemoverEngine {
  static async removeVoice(
    videoFile: File
  ): Promise<Uint8Array> {
    const ffmpeg = await getFFmpegEngine();
    const inputName = 'input_video' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const outputName = 'output_karaoke.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    // Center cut: pan=stereo|c0=c0-c1|c1=c1-c0
    // This works by subtracting one channel from the other, which cancels out sounds panned to the center (usually vocals)
    const audioFilter = 'pan=stereo|c0=c0-c1|c1=c1-c0';

    await ffmpeg.exec([
      '-i', inputName,
      '-af', audioFilter,
      '-c:v', 'copy',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return data as Uint8Array;
  }
}
