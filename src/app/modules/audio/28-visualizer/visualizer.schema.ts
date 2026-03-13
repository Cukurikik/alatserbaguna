import { z } from 'zod';
import { AudioFileSchema } from '../shared/schemas/audio.schemas';

export const VisualizerStyleSchema = z.enum(['bars', 'waveform', 'circle']);
export const VisualizerColorSchema = z.enum(['cyan', 'purple', 'rainbow', 'green']);

export const VisualizerConfigSchema = z.object({
  file: AudioFileSchema,
  style: VisualizerStyleSchema,
  colorTheme: VisualizerColorSchema,
  backgroundColor: z.string().default('#000000'),
  resolution: z.enum(['720p', '1080p']).default('720p'),
  fps: z.union([z.literal(24), z.literal(30), z.literal(60)]).default(30),
});

export type VisualizerStyle = z.infer<typeof VisualizerStyleSchema>;
export type VisualizerColor = z.infer<typeof VisualizerColorSchema>;
export type VisualizerConfig = z.infer<typeof VisualizerConfigSchema>;
