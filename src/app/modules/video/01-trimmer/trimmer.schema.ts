import { z } from 'zod';
import { VideoFileSchema, TimestampSchema } from '../shared/schemas/video.schemas';

export const TrimmerInputSchema = z
  .object({
    inputFile: VideoFileSchema,
    startTime: TimestampSchema,
    endTime: TimestampSchema,
    outputFormat: z.enum(['mp4', 'webm', 'mov']),
  })
  .refine(d => d.endTime > d.startTime, {
    message: 'End time must be after start time.',
    path: ['endTime'],
  })
  .refine(d => d.endTime - d.startTime >= 0.1, {
    message: 'Clip must be at least 0.1 seconds long.',
    path: ['endTime'],
  });

export type TrimmerInput = z.infer<typeof TrimmerInputSchema>;
