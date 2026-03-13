import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const RemoveAudioInputSchema = z.object({
  inputFile: VideoFileSchema,
  keepSubtitles: z.boolean().default(true)
});

export type RemoveAudioConfig = z.infer<typeof RemoveAudioInputSchema>;
