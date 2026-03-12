import { useState, useRef } from 'react';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { FFmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { CropEngine } from './CropEngine';
import { CropOptions, AspectRatio, ASPECT_RATIOS } from './crop.types';

export const useCrop = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [cropOptions, setCropOptions] = useState<CropOptions>({ x: 0, y: 0, width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  const { addTask, updateProgress, completeTask, failTask } = useVideoTaskStore();
  const engineRef = useRef<FFmpegEngine | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setVideoUrl(url);
    
    // Get video dimensions
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
      // Default crop to full size
      setCropOptions({ x: 0, y: 0, width: video.videoWidth, height: video.videoHeight });
    };
    video.src = url;
  };

  const processCrop = async () => {
    if (!file) return;

    const taskId = crypto.randomUUID();
    addTask({
      id: taskId,
      toolId: 'crop',
      name: file.name,
      status: 'processing',
      progress: 0,
      inputFiles: [{ name: file.name, size: file.size, type: file.type }],
      createdAt: Date.now(),
    });

    try {
      if (!engineRef.current) {
        engineRef.current = new FFmpegEngine();
        await engineRef.current.load();
      }

      const resultBlob = await CropEngine.cropVideo(
        engineRef.current,
        file,
        cropOptions,
        (progress) => updateProgress(taskId, progress)
      );

      const resultUrl = URL.createObjectURL(resultBlob);
      completeTask(taskId, resultUrl);
    } catch (error) {
      console.error('Crop failed:', error);
      failTask(taskId, error instanceof Error ? error.message : 'Crop failed');
    }
  };

  return {
    file,
    videoUrl,
    cropOptions,
    setCropOptions,
    aspectRatio,
    setAspectRatio,
    videoDimensions,
    handleFileSelect,
    processCrop,
  };
};
