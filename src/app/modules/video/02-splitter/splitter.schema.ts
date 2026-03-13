import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const SplitterInputSchema = z.object({
  inputFile: VideoFileSchema,
  parts: z.number().min(2).max(10).default(2)
});

export type SplitterConfig = z.infer<typeof SplitterInputSchema>;
