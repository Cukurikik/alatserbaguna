import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const CompareInputSchema = z.object({
  fileA: VideoFileSchema,
  fileB: VideoFileSchema,
  mode: z.enum(['sidebyside', 'divider', 'difference']),
});

export type CompareInput = z.infer<typeof CompareInputSchema>;
