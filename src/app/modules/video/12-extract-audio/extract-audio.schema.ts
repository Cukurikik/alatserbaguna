import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const ExtractAudioInputSchema = z.object({
  inputFile: VideoFileSchema,
  format: z.enum(['mp3', 'wav', 'aac', 'ogg']).default('mp3'),
  quality: z.enum(['low', 'medium', 'high']).default('high'),
  bitrate: z.number().int().min(64).max(320).default(192)
});

export type ExtractAudioConfig = z.infer<typeof ExtractAudioInputSchema>;
