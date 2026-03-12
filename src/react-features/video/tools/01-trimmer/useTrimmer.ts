import { useState, useEffect } from 'react';
import { ffmpegEngine } from '../../shared/engines/ffmpeg.engine';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { VideoFile } from '../../shared/types/video.types';
import { TrimmerEngine } from './TrimmerEngine';

export function useTrimmer() {
  const [file, setFile] = useState<File | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(10);
  const [loadingEngine, setLoadingEngine] = useState(false);
  
  const { currentTask, startTask, updateProgress, completeTask, failTask, ffmpegReady, setFFmpegReady } = useVideoTaskStore();

  useEffect(() => {
    const initFFmpeg = async () => {
      if (!ffmpegEngine.isLoaded) {
        setLoadingEngine(true);
        try {
          await ffmpegEngine.load();
          setFFmpegReady(true);
        } catch (e) {
          console.error("Failed to load FFmpeg", e);
        } finally {
          setLoadingEngine(false);
        }
      } else {
        setFFmpegReady(true);
      }
    };
    initFFmpeg();
  }, [setFFmpegReady]);

  const handleTrim = async () => {
    if (!file || !ffmpegReady) return;

    const taskId = crypto.randomUUID();
    const videoFile: VideoFile = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      file
    };

    startTask({
      id: taskId,
      name: file.name,
      toolId: 'trimmer',
      status: 'processing',
      progress: 0,
      inputFiles: [videoFile],
      createdAt: Date.now()
    });

    try {
      const outputFile = await TrimmerEngine.trim(
        file, 
        { startTime, endTime }, 
        (progress) => updateProgress(taskId, progress)
      );
      const outputUrl = URL.createObjectURL(outputFile);
      completeTask(taskId, outputUrl, outputFile);
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      failTask(taskId, errorMessage);
    }
  };

  return {
    file,
    setFile,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    loadingEngine,
    ffmpegReady,
    currentTask,
    handleTrim
  };
}
