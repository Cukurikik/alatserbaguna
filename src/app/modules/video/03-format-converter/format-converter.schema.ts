import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const FormatConverterInputSchema = z.object({
  inputFile: VideoFileSchema,
  format: z.enum(['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv']).default('mp4'),
  preset: z.enum(['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow']).default('fast')
});

export type FormatConverterConfig = z.infer<typeof FormatConverterInputSchema>;
