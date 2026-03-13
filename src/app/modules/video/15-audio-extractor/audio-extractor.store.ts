export interface AudioExtractorState {
  status: 'idle' | 'processing' | 'done' | 'error';
}