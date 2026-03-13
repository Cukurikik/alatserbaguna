export interface BatchState {
  status: 'idle' | 'processing' | 'done' | 'error';
}