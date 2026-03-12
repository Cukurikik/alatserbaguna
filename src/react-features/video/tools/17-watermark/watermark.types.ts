export interface WatermarkOptions {
  watermarkFile: File | null;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  scale: number;
  padding: number;
}
