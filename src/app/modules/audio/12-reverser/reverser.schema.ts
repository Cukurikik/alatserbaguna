import { z } from 'zod';
import { AudioFileSchema, ExportFormatSchema } from '../shared/schemas/audio.schemas';

export const ReverserConfigSchema = z.object({
  file: AudioFileSchema,
  format: ExportFormatSchema,
  crossfadeEdges: z.boolean().default(true) // Apply brief fade in/out to avoid clicks
});

export type ReverserConfig = z.infer<typeof ReverserConfigSchema>;
