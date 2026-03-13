export interface VideoMetadata {
  duration: number;
  fps: number;
  width: number;
  height: number;
}

export type ProcessingStatus = 'idle' | 'processing' | 'done' | 'error';
