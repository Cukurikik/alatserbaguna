import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const SplitterConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  mode: z.enum(['equal', 'silence']).default('equal'),
  equalParts: z.number().min(2).max(50).default(2),
  silenceThresholdDb: z.number().min(-80).max(-20).default(-40),
  silenceMinDurationSec: z.number().min(0.1).max(5).default(0.5)
});

export type SplitterConfig = z.infer<typeof SplitterConfigSchema>;
