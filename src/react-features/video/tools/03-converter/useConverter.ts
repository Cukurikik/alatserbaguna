import { useState } from 'react';
import { ConverterEngine } from './ConverterEngine';
import { ConvertOptions } from './converter.types';

export const useConverter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ConvertOptions>({
    outputFormat: 'mp4',
    preset: 'balanced',
    codec: 'auto',
    bitrate: '',
    fps: '',
    resolution: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a video file.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setOutputUrl(null);

    const engine = new ConverterEngine();

    try {
      const outputFile = await engine.convert(file, options, (p) => setProgress(p));
      const url = URL.createObjectURL(outputFile);
      setOutputUrl(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during conversion.');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    file,
    setFile,
    options,
    setOptions,
    isProcessing,
    progress,
    error,
    outputUrl,
    handleConvert,
  };
};
