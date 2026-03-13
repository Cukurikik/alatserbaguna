import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const StereoWidenerSchema = z.object({
  inputFile: AudioFileSchema,
  outputFormat: ExportFormatSchema,
  width: z.number().min(0).max(200).default(100),
});

export type StereoWidenerConfig = z.infer<typeof StereoWidenerSchema>;
