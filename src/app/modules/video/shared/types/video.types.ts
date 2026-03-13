// ─────────────────────────────────────────────────────────────────────────────
// video.types.ts — Central type definitions for all 30 video tools
// ─────────────────────────────────────────────────────────────────────────────

import type { VideoErrorCode } from '../errors/video.errors';

// A1. Video File Metadata
export interface VideoMeta {
  filename: string;
  fileSizeMB: number;
  duration: number;         // total seconds (float)
  width: number;            // pixel width
  height: number;           // pixel height
  fps: number;              // frames per second
  codec: string;            // e.g. 'h264', 'vp9', 'hevc'
  audioCodec: string | null; // e.g. 'aac', 'opus', null if no audio
  audioBitrate: number;     // kbps
  videoBitrate: number;     // kbps
  hasAudio: boolean;
  aspectRatio: string;      // e.g. '16:9', '9:16', '1:1'
}

// A2. Single Video Track
export interface VideoStream {
  index: number;
  codec: string;
  width: number;
  height: number;
  fps: number;
  bitrate: number;          // kbps
  pixelFormat: string;      // e.g. 'yuv420p'
  colorSpace: string | null;
  profile: string | null;   // e.g. 'High', 'Main'
  level: string | null;
}

// A3. Single Audio Track
export interface AudioStream {
  index: number;
  codec: string;
  sampleRate: number;       // Hz e.g. 44100, 48000
  channels: number;         // 1=mono, 2=stereo, 6=5.1
  bitrate: number;          // kbps
  language: string | null;  // ISO 639-1 e.g. 'en', 'id'
}

// A4. Subtitle Track
export interface SubtitleStream {
  index: number;
  codec: string;            // e.g. 'subrip', 'ass', 'webvtt'
  language: string | null;
  title: string | null;
  isDefault: boolean;
  isForced: boolean;
}

// A5. Chapter Marker
export interface Chapter {
  id: number;
  title: string;
  startTime: number;        // seconds
  endTime: number;          // seconds
}

// A7. Processing Status — union used across ALL 30 stores
export type ProcessingStatus = 'idle' | 'loading' | 'processing' | 'done' | 'error';

// A8. All supported video operations
export type VideoOperation =
  | 'trim' | 'merge' | 'convert' | 'compress'
  | 'stabilize' | 'reverse' | 'speed' | 'loop'
  | 'flip' | 'crop' | 'colorGrade' | 'subtitle'
  | 'thumbnail' | 'watermark' | 'extractAudio'
  | 'replaceAudio' | 'denoise' | 'interpolate'
  | 'metadata' | 'split' | 'record' | 'toGif'
  | 'pip' | 'blur' | 'transition' | 'compare'
  | 'slideshow' | 'batch' | 'analyse' | 'upscale';

// A9. Task status
export type TaskStatus = 'queued' | 'processing' | 'done' | 'error' | 'cancelled';

// A6. Processing Task (used by Batch Processor & AppState)
export interface VideoTask {
  id: string;               // uuid
  filename: string;
  operation: VideoOperation;
  status: TaskStatus;
  progress: number;         // 0–100
  startedAt: Date | null;
  completedAt: Date | null;
  outputSizeMB: number | null;
  errorCode: VideoErrorCode | null;
  errorMessage: string | null;
}

// A10. Sidebar Navigation Item
export interface NavItem {
  label: string;
  icon: string;             // lucide icon name
  route: string;
  badge: string | null;     // e.g. '30+', 'NEW', 'AI'
  category: 'video' | 'audio' | 'image' | 'tools' | 'system';
}

// A11. Typed postMessage payload
export interface WorkerMessage<T = unknown> {
  type: 'progress' | 'complete' | 'error' | 'log';
  value?: number;           // for 'progress' (0–100)
  data?: T;                 // for 'complete' (output Uint8Array)
  message?: string;         // for 'error' and 'log'
  errorCode?: VideoErrorCode;
}

// A12. Export panel configuration
export interface ExportConfig {
  format: 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv' | 'gif' | 'wav' | 'mp3';
  codec: string;
  quality: 'fast' | 'balanced' | 'best';
  filename: string;
}
