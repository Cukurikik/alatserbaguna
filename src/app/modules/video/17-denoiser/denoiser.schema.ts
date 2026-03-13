import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const DenoiserInputSchema = z.object({
  inputFile: VideoFileSchema,
  algorithm: z.enum(['hqdn3d', 'nlmeans', 'atadenoise']),
  lumaStrength: z.number().min(0).max(20),
  chromaStrength: z.number().min(0).max(20),
  temporalStrength: z.number().min(0).max(20),
  denoiseAudio: z.boolean(),
  audioNoiseLevel: z.number().min(0).max(97),
});

export type DenoiserInput = z.infer<typeof DenoiserInputSchema>;
