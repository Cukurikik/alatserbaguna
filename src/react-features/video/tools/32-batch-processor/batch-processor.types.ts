export interface BatchProcessorOptions {
  operation: 'convert' | 'compress' | 'resize' | 'thumbnail' | 'extract-audio';
  operationOptions: Record<string, unknown>;
  maxConcurrent: number;
  stopOnError: boolean;
  outputPackaging: 'zip' | 'individual';
}
