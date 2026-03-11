import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { createCommandBuilder } from './video-command-library/factory';

export interface VideoMetadata {
  duration: number;
  width?: number;
  height?: number;
  format?: string;
}

interface JobData {
  id: string;
  file: File;
  toolName: string;
  options: Record<string, any>;
  additionalFiles?: any[];
}

class VideoJobSystem {
  private static instance: VideoJobSystem;
  private ffmpeg: FFmpeg;
  private isLoaded = false;
  private jobs: Map<string, JobData> = new Map();

  private constructor() {
    this.ffmpeg = new FFmpeg();
  }

  static async getInstance(): Promise<VideoJobSystem> {
    if (!VideoJobSystem.instance) {
      VideoJobSystem.instance = new VideoJobSystem();
      await VideoJobSystem.instance.init();
    }
    return VideoJobSystem.instance;
  }

  private async init() {
    if (this.isLoaded) return;
    
    this.ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    try {
      // Load FFmpeg core
      await this.ffmpeg.load();
      this.isLoaded = true;
      console.log('[VideoJobSystem] FFmpeg loaded successfully');
    } catch (error) {
      console.error('[VideoJobSystem] Failed to load FFmpeg', error);
      throw error;
    }
  }

  async scanFile(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  }

  async createJob(
    file: File, 
    toolName: string, 
    options: Record<string, any>, 
    additionalFiles?: any[]
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.jobs.set(jobId, { id: jobId, file, toolName, options, additionalFiles });
    console.log(`[VideoJobSystem] Created job ${jobId} for tool ${toolName}`);
    return jobId;
  }

  async processJob(
    jobId: string, 
    onProgress: (progress: number) => void
  ): Promise<string> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    if (!this.isLoaded) {
      await this.init();
    }

    const { file, toolName, options, additionalFiles } = job;
    const inputName = `input_${jobId}.${file.name.split('.').pop() || 'mp4'}`;
    
    let outputExt = 'mp4';
    let outputMime = 'video/mp4';
    
    if (toolName === 'audio' && options.action === 'extract') {
      outputExt = options.format || 'mp3';
      outputMime = `audio/${outputExt === 'mp3' ? 'mpeg' : outputExt}`;
    } else if (toolName === 'gif' && options.action === 'video-to-gif') {
      outputExt = 'gif';
      outputMime = 'image/gif';
    } else if (toolName === 'video-to-gif') {
      outputExt = 'gif';
      outputMime = 'image/gif';
    } else if (toolName === 'screenshot') {
      outputExt = options.format || 'jpg';
      outputMime = `image/${outputExt === 'jpg' ? 'jpeg' : outputExt}`;
    } else if (toolName === 'convert' || toolName === 'convert-video' || (toolName === 'gif' && options.action === 'gif-to-video')) {
      outputExt = options.format || 'mp4';
      outputMime = `video/${outputExt}`;
    }
    
    const outputName = `output_${jobId}.${outputExt}`;

    try {
      // Write input file to FFmpeg VFS
      await this.ffmpeg.writeFile(inputName, await fetchFile(file));

      // Handle additional files if any
      if (additionalFiles && additionalFiles.length > 0) {
        for (const addFile of additionalFiles) {
          if (addFile.file && addFile.name) {
            await this.ffmpeg.writeFile(addFile.name, await fetchFile(addFile.file));
          }
        }
      }

      // Setup progress tracking
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
      });

      // Build FFmpeg command based on toolName
      let command: string[] = [];
      const builder = createCommandBuilder();
      const inputFiles = [inputName];
      if (additionalFiles) {
        for (const addFile of additionalFiles) {
          if (addFile.name) inputFiles.push(addFile.name);
        }
      }

      try {
        command = builder.build(toolName, {
          inputFiles,
          outputFile: outputName,
          options
        });
      } catch (e) {
        console.warn(`[VideoJobSystem] Tool ${toolName} not found in builder, falling back to legacy switch`);
        switch (toolName) {
          case 'trim':
            command = [
              '-ss', String(options.startTime || 0),
              '-i', inputName,
              '-t', String((options.endTime || 0) - (options.startTime || 0)),
              '-c', 'copy',
              outputName
            ];
            break;
          case 'cut':
            const startCut = options.start || 0;
            const endCut = options.end || 0;
            command = [
              '-i', inputName,
              '-vf', `select='not(between(t\\,${startCut}\\,${endCut}))',setpts=N/FRAME_RATE/TB`,
              '-af', `aselect='not(between(t\\,${startCut}\\,${endCut}))',asetpts=N/SR/TB`,
              outputName
            ];
            break;
          case 'crop':
            command = [
              '-i', inputName,
              '-filter:v', `crop=${options.width}:${options.height}:${options.x}:${options.y}`,
              '-c:a', 'copy',
              outputName
            ];
            break;
          case 'rotate':
            const rotateMap: Record<string, string> = {
              '90': 'transpose=1',
              '180': 'transpose=2,transpose=2',
              '270': 'transpose=2'
            };
            command = [
              '-i', inputName,
              '-filter:v', rotateMap[String(options.angle)] || 'transpose=1',
              '-c:a', 'copy',
              outputName
            ];
            break;
          case 'mute':
            command = [
              '-i', inputName,
              '-an',
              '-vcodec', 'copy',
              outputName
            ];
            break;
          case 'speed':
            const speed = options.speed || 2.0;
            command = [
              '-i', inputName,
              '-filter_complex', `[0:v]setpts=${1/speed}*PTS[v];[0:a]atempo=${speed}[a]`,
              '-map', '[v]',
              '-map', '[a]',
              outputName
            ];
            break;
          case 'reverse':
            command = [
              '-i', inputName,
              '-vf', 'reverse',
              '-af', 'areverse',
              outputName
            ];
            break;
          case 'compress':
            command = [
              '-i', inputName,
              '-vcodec', 'libx264',
              '-crf', '28',
              outputName
            ];
            break;
          case 'image-to-video':
            command = [
              '-loop', '1',
              '-i', inputName,
              '-c:v', 'libx264',
              '-t', '5',
              '-pix_fmt', 'yuv420p',
              outputName
            ];
            break;
          case 'text-to-video':
            command = [
              '-f', 'lavfi',
              '-i', 'color=c=black:s=1280x720:d=5',
              '-vf', `drawtext=text='${options.text || 'Generated Video'}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2`,
              '-c:v', 'libx264',
              outputName
            ];
            break;
          case 'split-screen':
            if (additionalFiles && additionalFiles.length > 0) {
              const layout = options.layout === 'vertical' ? 'vstack' : 'hstack';
              command = [
                '-i', inputName,
                '-i', additionalFiles[0].name,
                '-filter_complex', `[0:v][1:v]${layout}=inputs=2[v]`,
                '-map', '[v]',
                '-c:v', 'libx264',
                outputName
              ];
            }
            break;
          case 'add-transitions':
            if (additionalFiles && additionalFiles.length > 0) {
              const transition = options.transition || 'fade';
              const offset = options.offset || 2;
              command = [
                '-i', inputName,
                '-i', additionalFiles[0].name,
                '-filter_complex', `[0:v][1:v]xfade=transition=${transition}:duration=1:offset=${offset}[v]`,
                '-map', '[v]',
                '-c:v', 'libx264',
                outputName
              ];
            }
            break;
          case 'audio-to-video':
            if (additionalFiles && additionalFiles.length > 0) {
              command = [
                '-loop', '1',
                '-i', additionalFiles[0].name,
                '-i', inputName,
                '-c:v', 'libx264',
                '-tune', 'stillimage',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-pix_fmt', 'yuv420p',
                '-shortest',
                outputName
              ];
            }
            break;
          default:
            // Fallback: just copy the file
            command = [
              '-i', inputName,
              '-c', 'copy',
              outputName
            ];
            break;
        }
      }

      console.log(`[VideoJobSystem] Executing FFmpeg command: ffmpeg ${command.join(' ')}`);
      
      // Execute FFmpeg
      await this.ffmpeg.exec(command);

      // Read output file
      const data = await this.ffmpeg.readFile(outputName);
      const blob = new Blob([data as any], { type: outputMime });
      const url = URL.createObjectURL(blob);

      // Cleanup VFS to prevent memory leaks
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);
      if (additionalFiles) {
        for (const addFile of additionalFiles) {
          if (addFile.name) await this.ffmpeg.deleteFile(addFile.name);
        }
      }

      this.jobs.delete(jobId);
      return url;

    } catch (error) {
      console.error(`[VideoJobSystem] Job ${jobId} failed:`, error);
      
      // Attempt cleanup on failure
      try {
        await this.ffmpeg.deleteFile(inputName);
        await this.ffmpeg.deleteFile(outputName);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      this.jobs.delete(jobId);
      throw error;
    }
  }
}

export async function getVideoJobSystem(): Promise<VideoJobSystem> {
  return VideoJobSystem.getInstance();
}
