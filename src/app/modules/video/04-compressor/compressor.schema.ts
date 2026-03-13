import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const CompressorInputSchema = z
  .object({
    inputFile: VideoFileSchema,
    mode: z.enum(['targetSize', 'crf']),
    targetSizeMB: z.number().min(0.1).max(10_000).optional(),
    crfValue: z.number().int().min(0).max(51).optional(),
  })
  .refine(
    d => d.mode === 'crf' || d.targetSizeMB !== undefined,
    { message: 'Target file size is required in targetSize mode.', path: ['targetSizeMB'] }
  )
  .refine(
    d => d.mode === 'targetSize' || d.crfValue !== undefined,
    { message: 'CRF value is required in CRF mode.', path: ['crfValue'] }
  );

export type CompressorInput = z.infer<typeof CompressorInputSchema>;
