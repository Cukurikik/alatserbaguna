import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const KaraokeSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  method: z.enum(['midSide', 'ai']).default('midSide'),
  strength: z.number().min(0).max(1).default(0.9),
});

export type KaraokeConfig = z.infer<typeof KaraokeSchema>;
