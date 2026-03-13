import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const StabilizerInputSchema = z.object({
  inputFile: VideoFileSchema,
  shakiness: z.number().min(1).max(10).default(5),
  accuracy: z.number().min(1).max(15).default(15),
  stepsize: z.number().min(1).max(30).default(6)
});

export type StabilizerConfig = z.infer<typeof StabilizerInputSchema>;
