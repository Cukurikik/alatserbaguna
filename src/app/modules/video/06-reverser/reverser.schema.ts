import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const ReverserInputSchema = z.object({
  inputFile: VideoFileSchema,
  reverseAudio: z.boolean()
});

export type ReverserConfig = z.infer<typeof ReverserInputSchema>;
