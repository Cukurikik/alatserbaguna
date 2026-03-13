import { z } from 'zod';
import { VideoFileSchema, TimestampSchema } from '../shared/schemas/video.schemas';

export const VideoToGifInputSchema = z
  .object({
    inputFile: VideoFileSchema,
    startTime: TimestampSchema,
    endTime: TimestampSchema,
    fps: z.number().int().min(5).max(30),
    width: z.union([
      z.literal(240),
      z.literal(360),
      z.literal(480),
      z.literal(640),
      z.literal('auto' as const),
    ]),
    dither: z.enum(['none', 'bayer', 'floyd_steinberg']),
  })
  .refine(d => d.endTime > d.startTime, {
    message: 'End time must be after start time.',
    path: ['endTime'],
  })
  .refine(d => d.endTime - d.startTime <= 30, {
    message: 'GIF duration cannot exceed 30 seconds (file size protection).',
    path: ['endTime'],
  });

export type VideoToGifInput = z.infer<typeof VideoToGifInputSchema>;
