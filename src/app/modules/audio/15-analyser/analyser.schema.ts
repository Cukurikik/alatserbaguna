import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const AnalyserSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
});

export type AnalyserConfig = z.infer<typeof AnalyserSchema>;
