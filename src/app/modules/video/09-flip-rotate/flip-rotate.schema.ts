import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const FlipRotateInputSchema = z
  .object({
    inputFile: VideoFileSchema,
    flipH: z.boolean(),
    flipV: z.boolean(),
    rotation: z.number().min(0).max(360),
  })
  .refine(
    d => d.flipH || d.flipV || d.rotation !== 0,
    { message: 'At least one transformation (flip or rotation) must be applied.' }
  );

export type FlipRotateInput = z.infer<typeof FlipRotateInputSchema>;
