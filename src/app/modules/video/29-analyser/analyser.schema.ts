import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const AnalyserInputSchema = z.object({
  inputFile: VideoFileSchema,
});

export type AnalyserInput = z.infer<typeof AnalyserInputSchema>;
