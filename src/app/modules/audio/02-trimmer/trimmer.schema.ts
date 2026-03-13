import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const TrimmerSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  snapToZero: z.boolean().default(false),
});

export type TrimmerConfig = z.infer<typeof TrimmerSchema>;
