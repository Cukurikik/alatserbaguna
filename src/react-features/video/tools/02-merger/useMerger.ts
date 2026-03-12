import { useState } from 'react';
import { MergerEngine } from './MergerEngine';
import { MergeOptions } from './merger.types';

export const useMerger = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [transition, setTransition] = useState<'none' | 'fade' | 'wipe'>('none');
  const [crossfadeDuration, setCrossfadeDuration] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please select at least two videos to merge.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setOutputUrl(null);

    const engine = new MergerEngine();
    const options: MergeOptions = {
      files,
      transition,
      crossfadeDuration,
    };

    try {
      const outputFile = await engine.merge(options, (p) => setProgress(p));
      const url = URL.createObjectURL(outputFile);
      setOutputUrl(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during merging.');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    files,
    setFiles,
    transition,
    setTransition,
    crossfadeDuration,
    setCrossfadeDuration,
    isProcessing,
    progress,
    error,
    outputUrl,
    handleMerge,
  };
};
