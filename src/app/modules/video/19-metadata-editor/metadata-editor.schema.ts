import { z } from 'zod';
import { VideoFileSchema } from '../shared/schemas/video.schemas';

export const MetadataEditorInputSchema = z
  .object({
    inputFile: VideoFileSchema,
    editedFields: z.object({
      title: z.string().optional(),
      artist: z.string().optional(),
      album: z.string().optional(),
      comment: z.string().optional(),
      description: z.string().optional(),
      year: z.string().optional(),
      genre: z.string().optional(),
    }),
    stripAll: z.boolean(),
  })
  .refine(
    d =>
      d.stripAll ||
      Object.values(d.editedFields).some(v => typeof v === 'string' && v.length > 0),
    { message: 'At least one metadata field must be set, or enable "Strip All".', path: ['editedFields'] }
  );

export type MetadataEditorInput = z.infer<typeof MetadataEditorInputSchema>;
