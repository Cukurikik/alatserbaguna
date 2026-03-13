import { AudioErrorCode } from '../types/audio.types';

export const AUDIO_ERROR_MESSAGES: Record<AudioErrorCode, string> = {
  FILE_TOO_LARGE: 'File exceeds the 500 MB limit. Please use a smaller file.',
  INVALID_FILE_TYPE: 'Unsupported file type. Please use MP3, WAV, FLAC, OGG, M4A, or OPUS.',
  FILE_CORRUPTED: 'The file appears to be corrupted or unreadable.',
  AUDIO_CONTEXT_FAILED: 'Failed to initialize the Web Audio engine.',
  DECODE_FAILED: 'Failed to decode the audio file. The file may be corrupted.',
  ENCODE_FAILED: 'Failed to encode the output audio.',
  FFMPEG_LOAD_FAILED: 'Failed to load the FFmpeg audio engine.',
  FFMPEG_TIMEOUT: 'Processing timed out. Try a shorter audio file.',
  WORKER_CRASHED: 'The audio processing worker crashed unexpectedly.',
  ONNX_LOAD_FAILED: 'Failed to load the AI model.',
  MODEL_DOWNLOAD_FAILED: 'Failed to download the AI model. Check your connection.',
  INSUFFICIENT_MEMORY: 'Not enough memory to process this file.',
  MIC_PERMISSION_DENIED: 'Microphone access was denied. Please allow microphone access.',
  NO_AUDIO_STREAM: 'No audio stream found in the file.',
  INVALID_PARAMS: 'Invalid processing parameters.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
};
