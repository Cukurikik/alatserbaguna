import { z } from 'zod';
import { VideoFileSchema, TimestampSchema } from '../shared/schemas/video.schemas';

export const SplitterInputSchema = z
  .object({
    inputFile: VideoFileSchema,
    mode: z.enum(['markers', 'equal']),
    markers: z.array(TimestampSchema).min(1, 'At least one split point required.').optional(),
    equalParts: z.number().int().min(2).max(100).optional(),
  })
  .refine(
    d => d.mode === 'equal' || (d.markers && d.markers.length > 0),
    { message: 'Markers are required in marker mode.', path: ['markers'] }
  )
  .refine(
    d => d.mode === 'markers' || d.equalParts !== undefined,
    { message: 'Number of parts is required in equal mode.', path: ['equalParts'] }
  );

export type SplitterInput = z.infer<typeof SplitterInputSchema>;
