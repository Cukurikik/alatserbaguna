import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const StereoWidenerConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  width: z.number().min(0).max(2).default(1.5),  // 0=mono, 1=original, 2=max wide
  mode: z.enum(['stereotools', 'extrastereo']).default('extrastereo'),
});

export type StereoWidenerConfig = z.infer<typeof StereoWidenerConfigSchema>;
