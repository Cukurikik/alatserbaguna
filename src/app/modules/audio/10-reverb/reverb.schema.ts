import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const ReverbSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  mode: z.enum(['convolution', 'algorithmic']).default('algorithmic'),
  roomSize: z.number().min(0).max(100).default(50),
  decay: z.number().min(0.1).max(10).default(2),
  wetMix: z.number().min(0).max(1).default(0.3),
});

export type ReverbConfig = z.infer<typeof ReverbSchema>;
