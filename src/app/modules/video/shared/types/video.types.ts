export interface VideoMetadata {
  name: string;
  size: number;
  type: string;
  duration: number;
  fps?: number;
  width: number;
  height: number;
}

export type ProcessingStatus = 'idle' | 'processing' | 'done' | 'error';
