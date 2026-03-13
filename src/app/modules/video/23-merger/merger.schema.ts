import { z } from 'zod';

export const MergerInputSchema = z.object({
  inputFiles: z.array(z.instanceof(File)).min(2).max(10),
  resolution: z.enum(['1080p', '720p', 'original']).default('original'),
  transition: z.enum(['none', 'fade']).default('none')
});

export type MergerConfig = z.infer<typeof MergerInputSchema>;
