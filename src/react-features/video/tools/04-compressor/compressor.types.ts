export interface CompressOptions {
  targetSizeMB: number;
  crfValue: number;
  preset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  mode: 'size' | 'quality';
}
