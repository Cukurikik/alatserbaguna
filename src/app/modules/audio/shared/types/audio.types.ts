
export interface AudioMeta {
  filename: string;
  fileSizeMB: number;
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  bitrate: number;
  codec: string;
  hasVideo: boolean;
}

export type AudioErrorCode =
  | 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'FILE_CORRUPTED'
  | 'AUDIO_CONTEXT_FAILED' | 'DECODE_FAILED' | 'ENCODE_FAILED'
  | 'FFMPEG_LOAD_FAILED' | 'FFMPEG_TIMEOUT' | 'WORKER_CRASHED'
  | 'ONNX_LOAD_FAILED' | 'MODEL_DOWNLOAD_FAILED' | 'INSUFFICIENT_MEMORY'
  | 'MIC_PERMISSION_DENIED' | 'NO_AUDIO_STREAM' | 'INVALID_PARAMS' | 'UNKNOWN_ERROR';

export type ProcessingStatus = 'idle' | 'loading' | 'processing' | 'rendering' | 'done' | 'error';

export interface WaveformData {
  peaks: Float32Array;
  duration: number;
  sampleRate: number;
}

export type ExportFormat = 'wav' | 'mp3' | 'aac' | 'ogg' | 'flac' | 'opus' | 'm4a';
