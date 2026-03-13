import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export const SubtitleInputSchema = z.object({
  videoFile: VideoFileSchema,
  subtitleFile: z
    .instanceof(File)
    .refine(f => ['.srt', '.vtt', '.ass'].some(ext => f.name.endsWith(ext)), {
      message: 'Only SRT, VTT, ASS formats supported.',
    })
    .optional(),
  subtitleContent: z.string().min(1, 'Subtitle content cannot be empty.'),
  fontFamily: z.string().min(1),
  fontSize: z.number().int().min(8).max(120),
  fontColor: z.string().regex(HEX_COLOR, 'Must be a hex color (e.g. #FFFFFF).'),
  outlineColor: z.string().regex(HEX_COLOR, 'Must be a hex color (e.g. #000000).'),
  position: z.enum(['top', 'bottom']),
  offsetSeconds: z.number().min(-3600).max(3600),
});

export type SubtitleInput = z.infer<typeof SubtitleInputSchema>;
