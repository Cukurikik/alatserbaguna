export interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  duration?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export interface TrimmerOptions {
  startTime: number;
  endTime: number;
  outputFormat: string;
}
