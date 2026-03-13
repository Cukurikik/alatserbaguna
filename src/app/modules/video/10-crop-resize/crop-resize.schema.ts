import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const CropResizeInputSchema = z.object({
  inputFile: VideoFileSchema,
  mode: z.enum(['crop', 'resize']),
  cropRegion: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    w: z.number().min(16),
    h: z.number().min(16),
  }).optional(),
  targetWidth: z.number().int().min(16).max(7680).optional(),  // max 8K
  targetHeight: z.number().int().min(16).max(4320).optional(),
  lockAspectRatio: z.boolean(),
  padMode: z.enum(['stretch', 'pad', 'crop-to-fit']),
});

export type CropResizeInput = z.infer<typeof CropResizeInputSchema>;
