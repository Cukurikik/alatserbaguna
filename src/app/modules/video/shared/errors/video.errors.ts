// ─────────────────────────────────────────────────────────────────────────────
// video.errors.ts — Typed error handling system for all 30 video tools
// ─────────────────────────────────────────────────────────────────────────────

// B1. Typed Error Codes
export type VideoErrorCode =
  // File errors
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'FILE_CORRUPTED'
  | 'FILE_READ_ERROR'

  // FFmpeg engine errors
  | 'FFMPEG_LOAD_FAILED'
  | 'FFMPEG_TIMEOUT'
  | 'FFMPEG_COMMAND_FAILED'
  | 'FFMPEG_OOM'
  | 'FFMPEG_NO_STREAMS'

  // Worker errors
  | 'WORKER_INIT_FAILED'
  | 'WORKER_CRASHED'
  | 'WORKER_TRANSFER_FAILED'

  // Validation errors
  | 'INVALID_TIME_RANGE'
  | 'INVALID_DIMENSIONS'
  | 'INVALID_SPEED'
  | 'INVALID_CRF'
  | 'NO_AUDIO_STREAM'

  // Browser capability errors
  | 'SAB_NOT_SUPPORTED'
  | 'WEBGPU_NOT_AVAILABLE'
  | 'OPFS_NOT_AVAILABLE'
  | 'MEDIA_RECORDER_FAILED'

  // Generic
  | 'UNKNOWN_ERROR';

// B2. Human-readable messages
export const VideoErrorMessages: Record<VideoErrorCode, string> = {
  FILE_TOO_LARGE:          'File is too large. Maximum supported size is 2GB.',
  INVALID_FILE_TYPE:       'Please upload a valid video file (MP4, WebM, MOV, AVI, MKV).',
  FILE_CORRUPTED:          'This file appears to be corrupted or unreadable.',
  FILE_READ_ERROR:         'Failed to read file. Please try again.',
  FFMPEG_LOAD_FAILED:      'Video engine failed to load. Please refresh the page.',
  FFMPEG_TIMEOUT:          'Operation timed out after 15 seconds. Try with a shorter clip.',
  FFMPEG_COMMAND_FAILED:   'Processing failed. The video format may not be supported.',
  FFMPEG_OOM:              'Not enough memory. Try with a smaller file.',
  FFMPEG_NO_STREAMS:       'No video or audio streams found in this file.',
  WORKER_INIT_FAILED:      'Processing engine could not start. Please refresh.',
  WORKER_CRASHED:          'Processing engine crashed unexpectedly. Please try again.',
  WORKER_TRANSFER_FAILED:  'Data transfer failed. Please try again.',
  INVALID_TIME_RANGE:      'End time must be after start time.',
  INVALID_DIMENSIONS:      'Width and height must be greater than 0.',
  INVALID_SPEED:           'Speed must be between 0.25x and 4.0x.',
  INVALID_CRF:             'Quality value (CRF) must be between 0 and 51.',
  NO_AUDIO_STREAM:         'This video has no audio track.',
  SAB_NOT_SUPPORTED:       'Your browser does not support SharedArrayBuffer. Enable COOP/COEP headers.',
  WEBGPU_NOT_AVAILABLE:    'WebGPU is not available. AI Upscaler requires a modern browser.',
  OPFS_NOT_AVAILABLE:      'File system API not available. Try Chrome or Edge.',
  MEDIA_RECORDER_FAILED:   'Screen capture permission was denied.',
  UNKNOWN_ERROR:           'An unexpected error occurred. Please try again.',
};

// Codes that can be retried by the user
const RETRYABLE_CODES = new Set<VideoErrorCode>([
  'FFMPEG_TIMEOUT',
  'FFMPEG_OOM',
  'WORKER_CRASHED',
  'FILE_READ_ERROR',
  'WORKER_TRANSFER_FAILED',
]);

// B3. Error resolver function
export function getVideoError(code: VideoErrorCode): {
  code: VideoErrorCode;
  message: string;
  retryable: boolean;
} {
  return {
    code,
    message: VideoErrorMessages[code] ?? VideoErrorMessages['UNKNOWN_ERROR'],
    retryable: RETRYABLE_CODES.has(code),
  };
}
