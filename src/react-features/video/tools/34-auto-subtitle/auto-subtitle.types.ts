export interface AutoSubtitleOptions {
  model: 'tiny' | 'base' | 'small' | 'medium';
  language: string;
  translateTo: string | null;
  outputFormat: 'srt' | 'vtt' | 'ass' | 'txt';
  burnIntoVideo: boolean;
  wordTimestamps: boolean;
}
