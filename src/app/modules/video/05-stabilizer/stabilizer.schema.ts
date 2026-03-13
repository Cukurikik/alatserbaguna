import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const StabilizerInputSchema = z.object({
  inputFile: VideoFileSchema,
  shakiness: z.number().int().min(1).max(10),
  smoothing: z.number().int().min(1).max(100),
  cropMode: z.enum(['black', 'fill']),
});

export type StabilizerInput = z.infer<typeof StabilizerInputSchema>;
