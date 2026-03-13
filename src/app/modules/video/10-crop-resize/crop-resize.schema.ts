import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const CropResizeInputSchema = z.object({
  inputFile: VideoFileSchema,
  mode: z.enum(['crop', 'resize']),
  cropRegion: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    w: z.number().min(16),
    h: z.number().min(16)
  }).optional(),
  targetWidth: z.number().int().min(16).max(7680).optional(),
  targetHeight: z.number().int().min(16).max(4320).optional(),
  lockAspectRatio: z.boolean(),
  padMode: z.enum(['stretch', 'pad', 'crop-to-fit'])
}).refine(data => {
  if (data.mode === 'crop') return data.cropRegion !== undefined;
  if (data.mode === 'resize') return data.targetWidth !== undefined && data.targetHeight !== undefined;
  return false;
}, { message: 'Invalid configuration for selected mode' });

export type CropResizeConfig = z.infer<typeof CropResizeInputSchema>;
