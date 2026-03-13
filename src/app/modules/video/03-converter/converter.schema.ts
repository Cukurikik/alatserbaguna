import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const ConverterInputSchema = z.object({
  inputFile: VideoFileSchema,
  targetFormat: z.enum(['mp4', 'webm', 'mov', 'avi', 'mkv', 'gif']),
  codec: z.string().min(1, 'Codec must not be empty.'),
  qualityPreset: z.enum(['fast', 'balanced', 'best']),
});

export type ConverterInput = z.infer<typeof ConverterInputSchema>;
