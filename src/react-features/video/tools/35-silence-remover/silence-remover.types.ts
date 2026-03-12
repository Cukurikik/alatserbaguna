export interface SilenceRemoverOptions {
  thresholdDb: number;
  minSilenceDuration: number;
  padding: number;
  mode: 'remove' | 'speedup';
  speedupFactor: number;
}
