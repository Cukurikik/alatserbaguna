import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const EqualizerSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  mode: z.enum(['graphic', 'parametric']).default('graphic'),
});

export type EqualizerConfig = z.infer<typeof EqualizerSchema>;
