import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const BatchInputSchema = z.object({
  files: z
    .array(VideoFileSchema)
    .min(2, 'At least 2 files required.')
    .max(100, 'Maximum 100 files per batch.'),
  operation: z.enum([
    'trim', 'merge', 'convert', 'compress', 'stabilize', 'reverse',
    'speed', 'loop', 'flip', 'crop', 'colorGrade', 'subtitle',
    'thumbnail', 'watermark', 'extractAudio', 'replaceAudio',
    'denoise', 'interpolate', 'metadata', 'split',
  ]),
  operationConfig: z.record(z.unknown()),
});

export type BatchInput = z.infer<typeof BatchInputSchema>;
