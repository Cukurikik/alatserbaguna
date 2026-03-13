import { z } from 'zod';
import { AudioFileSchema } from '../shared/schemas/audio.schemas';

export const AudioTagsSchema = z.object({
  title: z.string().default(''),
  artist: z.string().default(''),
  albumArtist: z.string().default(''),
  album: z.string().default(''),
  year: z.string().default(''),
  genre: z.string().default(''),
  track: z.string().default(''),
  disc: z.string().default(''),
  comment: z.string().default(''),
  composer: z.string().default(''),
  copyright: z.string().default(''),
});

export const MetadataConfigSchema = z.object({
  file: AudioFileSchema,
  tags: AudioTagsSchema,
  stripAll: z.boolean().default(false)
});

export type AudioTags = z.infer<typeof AudioTagsSchema>;
export type MetadataConfig = z.infer<typeof MetadataConfigSchema>;
