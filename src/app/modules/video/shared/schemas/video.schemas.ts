import { z } from 'zod';

export const VideoFileSchema = z.instanceof(File).refine(
  (file) => {
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    return validTypes.includes(file.type) || file.type.startsWith('video/');
  },
  { message: 'Invalid file type. Must be a video file.' }
).refine(
  (file) => file.size < 2147483648,
  { message: 'File is too large. Maximum supported size is 2GB.' }
).refine(
  (file) => file.name.trim().length > 0,
  { message: 'File name cannot be empty.' }
);

export const TimestampSchema = z.number().min(0).finite();

export const ProgressSchema = z.number().min(0).max(100);

export const ExportFormatSchema = z.enum(['mp4', 'webm', 'mov', 'avi', 'mkv', 'gif']);
