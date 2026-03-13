export interface DenoiserState {
  status: 'idle' | 'processing' | 'done' | 'error';
}