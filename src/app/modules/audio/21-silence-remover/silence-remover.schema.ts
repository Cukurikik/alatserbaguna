import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const SilenceRemoverSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
});

export type SilenceRemoverConfig = z.infer<typeof SilenceRemoverSchema>;
