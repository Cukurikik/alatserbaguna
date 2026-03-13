export interface CompressorState {
  status: 'idle' | 'processing' | 'done' | 'error';
}