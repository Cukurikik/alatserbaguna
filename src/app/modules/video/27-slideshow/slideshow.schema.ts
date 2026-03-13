import { z } from 'zod';

export const SlideshowInputSchema = z.object({
  images: z
    .array(
      z.instanceof(File).refine(f => f.type.startsWith('image/'), {
        message: 'All files must be images.',
      })
    )
    .min(2, 'At least 2 images required.'),
  defaultDuration: z.number().min(1).max(30),
  kenBurns: z.boolean(),
});

export type SlideshowInput = z.infer<typeof SlideshowInputSchema>;
