import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const ColorGradingInputSchema = z.object({
  inputFile: VideoFileSchema,
  brightness: z.number().min(-1).max(1),
  contrast: z.number().min(0).max(2),
  saturation: z.number().min(0).max(2),
  hue: z.number().min(-180).max(180),
  gamma: z.number().min(0.1).max(3.0),
  lutFile: z.instanceof(File).optional(),
  activeLutPreset: z.enum(['cinematic', 'warm', 'cool', 'vintage', 'bw']).nullable(),
});

export type ColorGradingInput = z.infer<typeof ColorGradingInputSchema>;
