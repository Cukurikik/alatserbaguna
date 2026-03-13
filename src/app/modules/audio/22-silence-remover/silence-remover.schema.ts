import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const SilenceRemoverSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  thresholdDb: z.number().min(-60).max(-10).default(-40),
  minSilenceDuration: z.number().min(0.1).max(5).default(0.5),
  paddingDuration: z.number().min(0).max(2).default(0.1),
});

export type SilenceRemoverConfig = z.infer<typeof SilenceRemoverSchema>;
