import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const CompressorInputSchema = z.object({
  inputFile: VideoFileSchema,
  crf: z.number().min(0).max(51).default(28), // Constant Rate Factor (0-51, lower is better quality, higher is more compression)
  preset: z.enum(['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow']).default('medium'),
  audioBitrate: z.enum(['64k', '96k', '128k', '192k', '256k', '320k']).default('128k')
});

export type CompressorConfig = z.infer<typeof CompressorInputSchema>;
