import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const ToAudioInputSchema = z.object({
  inputFile: VideoFileSchema,
  format: z.enum(['mp3', 'wav', 'aac', 'ogg', 'flac']).default('mp3'),
  quality: z.enum(['low', 'medium', 'high']).default('high')
});

export type ToAudioConfig = z.infer<typeof ToAudioInputSchema>;
