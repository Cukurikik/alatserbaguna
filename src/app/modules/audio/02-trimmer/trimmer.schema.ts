import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const TrimmerConfigSchema = z.object({
  file: AudioFileSchema,
  startTimeMs: z.number().min(0, "Start time cannot be negative"),
  endTimeMs: z.number().min(0.01, "End time must be greater than 0"),
  format: ExportFormatSchema
}).refine(data => data.endTimeMs > data.startTimeMs, {
  message: "End time must be greater than start time",
  path: ["endTimeMs"]
});

export type TrimmerConfig = z.infer<typeof TrimmerConfigSchema>;
