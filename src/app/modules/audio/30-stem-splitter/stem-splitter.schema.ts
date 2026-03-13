import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const StemSplitterSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  model: z.enum(['demucs-v4', 'htdemucs', 'spleeter-2stem']).default('htdemucs'),
});

export type StemSplitterConfig = z.infer<typeof StemSplitterSchema>;
