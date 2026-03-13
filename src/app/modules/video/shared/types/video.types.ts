export interface VideoMeta {
  filename: string;
  fileSizeMB: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  audioCodec: string | null;
  audioBitrate: number;
  videoBitrate: number;
  hasAudio: boolean;
  aspectRatio: string;
}

export interface VideoStream {
  index: number;
  codec: string;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  pixelFormat: string;
  colorSpace: string | null;
  profile: string | null;
  level: string | null;
}

export interface AudioStream {
  index: number;
  codec: string;
  sampleRate: number;
  channels: number;
  bitrate: number;
  language: string | null;
}

export interface SubtitleStream {
  index: number;
  codec: string;
  language: string | null;
  title: string | null;
  isDefault: boolean;
  isForced: boolean;
}

export interface Chapter {
  id: number;
  title: string;
  startTime: number;
  endTime: number;
}

export type ProcessingStatus = 'idle' | 'loading' | 'processing' | 'done' | 'error';

export type VideoOperation =
  | 'trim' | 'merge' | 'convert' | 'compress'
  | 'stabilize' | 'reverse' | 'speed' | 'loop'
  | 'flip' | 'crop' | 'colorGrade' | 'subtitle'
  | 'thumbnail' | 'watermark' | 'extractAudio'
  | 'replaceAudio' | 'denoise' | 'interpolate'
  | 'metadata' | 'split' | 'record' | 'toGif'
  | 'pip' | 'blur' | 'transition' | 'compare'
  | 'slideshow' | 'batch' | 'analyse' | 'upscale';

export type TaskStatus = 'queued' | 'processing' | 'done' | 'error' | 'cancelled';

export interface VideoTask {
  id: string;
  filename: string;
  operation: VideoOperation;
  status: TaskStatus;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
  outputSizeMB: number | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge: string | null;
  category: 'video' | 'audio' | 'image' | 'tools' | 'system';
}

export interface WorkerMessage<T = unknown> {
  type: 'progress' | 'complete' | 'error' | 'log';
  value?: number;
  data?: T;
  message?: string;
  errorCode?: string;
}

export interface ExportConfig {
  format: 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv' | 'gif' | 'wav' | 'mp3';
  codec: string;
  quality: 'fast' | 'balanced' | 'best';
  filename: string;
}
