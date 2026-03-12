import { useState } from 'react';
import { CompressorEngine } from './CompressorEngine';
import { CompressOptions } from './compressor.types';

export const useCompressor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<CompressOptions>({
    targetSizeMB: 10,
    crfValue: 28,
    preset: 'fast',
    mode: 'quality',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputFile, setOutputFile] = useState<File | null>(null);

  const handleCompress = async () => {
    if (!file) {
      setError('Please select a video file.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setOutputUrl(null);
    setOutputFile(null);

    const engine = new CompressorEngine();

    try {
      const resultFile = await engine.compress(file, options, (p) => setProgress(p));
      const url = URL.createObjectURL(resultFile);
      setOutputUrl(url);
      setOutputFile(resultFile);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during compression.');
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
    outputFile,
    handleCompress,
  };
};
