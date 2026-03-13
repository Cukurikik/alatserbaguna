import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const RemoveSubtitlesInputSchema = z.object({
  inputFile: VideoFileSchema
});

export type RemoveSubtitlesConfig = z.infer<typeof RemoveSubtitlesInputSchema>;
