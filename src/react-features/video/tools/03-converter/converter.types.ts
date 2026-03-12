export interface ConvertOptions {
  outputFormat: 'mp4' | 'mkv' | 'mov' | 'avi' | 'webm' | 'gif';
  preset: 'fast' | 'balanced' | 'quality' | 'custom';
  codec: string;
  bitrate: string;
  fps: string;
  resolution: string;
}
