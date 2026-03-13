import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const MetadataSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
});

export type MetadataConfig = z.infer<typeof MetadataSchema>;
