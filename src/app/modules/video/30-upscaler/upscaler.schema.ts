import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const UpscalerInputSchema = z.object({
  inputFile: VideoFileSchema,
  scaleFactor: z.union([z.literal(2), z.literal(4)]),
  model: z.enum(['realesrgan', 'esrgan', 'swinir']),
  /** Set by NgRx Effect when video > 30s — not a blocking error, just an advisory flag */
  memoryWarning: z.boolean().optional(),
});

export type UpscalerInput = z.infer<typeof UpscalerInputSchema>;
