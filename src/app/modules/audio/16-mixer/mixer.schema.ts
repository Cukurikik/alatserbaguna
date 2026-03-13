import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const MixerTrackSchema = z.object({
  id: z.string(),
  volume: z.number().min(0).max(2).default(1),  // 0–200%
  pan: z.number().min(-1).max(1).default(0),     // -1=left, 0=center, 1=right
  muted: z.boolean().default(false),
  soloed: z.boolean().default(false),
  label: z.string().default('Track')
});

export const MixerConfigSchema = z.object({
  tracks: z.array(z.object({ file: AudioFileSchema, ...MixerTrackSchema.shape })).min(2),
  masterVolume: z.number().min(0).max(2).default(1),
  outputMode: z.enum(['stereo', 'mono']).default('stereo'),
  format: ExportFormatSchema
});

export type MixerTrack = z.infer<typeof MixerTrackSchema>;
export type MixerConfig = z.infer<typeof MixerConfigSchema>;
