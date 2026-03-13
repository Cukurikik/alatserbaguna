import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export const WatermarkInputSchema = z.object({
  videoFile: VideoFileSchema,
  mode: z.enum(['image', 'text']),
  watermarkFile: z.instanceof(File).optional(),
  text: z.string().max(200).optional(),
  fontFamily: z.string(),
  fontSize: z.number().int().min(8).max(300),
  fontColor: z.string().regex(HEX_COLOR, 'Must be a hex color.'),
  position: z.enum(['TL', 'TC', 'TR', 'ML', 'MC', 'MR', 'BL', 'BC', 'BR']),
  opacity: z.number().min(0).max(1),
  scale: z.number().min(0.01).max(0.9),
});

export type WatermarkInput = z.infer<typeof WatermarkInputSchema>;
