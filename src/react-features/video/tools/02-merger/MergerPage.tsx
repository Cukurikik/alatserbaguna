import React, { useRef } from 'react';
import { useMerger } from './useMerger';
import { MergerFileList } from './MergerFileList';
import { MergerOptions } from './MergerOptions';
import { Upload, Play, Download, AlertCircle } from 'lucide-react';

export const MergerPage: React.FC = () => {
  const {
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
  } = useMerger();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary">Video Merger</h1>
        <p className="text-text-secondary text-lg">Combine multiple video clips into a single masterpiece.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-surface border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-text-primary">Clips</h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-accent-cyan/10 text-accent-cyan rounded-xl hover:bg-accent-cyan/20 transition-colors"
              >
                <Upload size={18} />
                <span>Add Videos</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                multiple
                className="hidden"
              />
            </div>

            {files.length === 0 ? (
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="text-text-muted" size={24} />
                </div>
                <p className="text-text-secondary mb-2">Drag and drop videos here</p>
                <p className="text-sm text-text-muted">or click "Add Videos" to browse</p>
              </div>
            ) : (
              <MergerFileList files={files} onFilesChange={setFiles} />
            )}
          </div>

          {outputUrl && (
            <div className="bg-bg-surface border border-white/5 rounded-3xl p-8 backdrop-blur-xl space-y-4">
              <h2 className="text-xl font-semibold text-text-primary">Result</h2>
              <video src={outputUrl} controls className="w-full rounded-2xl bg-black aspect-video" />
              <div className="flex justify-end">
                <a
                  href={outputUrl}
                  download="merged_video.mp4"
                  className="flex items-center gap-2 px-6 py-3 bg-accent-cyan text-bg font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-glow"
                >
                  <Download size={20} />
                  <span>Download Video</span>
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <MergerOptions
            transition={transition}
            setTransition={setTransition}
            crossfadeDuration={crossfadeDuration}
            setCrossfadeDuration={setCrossfadeDuration}
          />

          {error && (
            <div className="bg-status-error/10 border border-status-error/20 text-status-error p-4 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleMerge}
            disabled={files.length < 2 || isProcessing}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all ${
              files.length < 2 || isProcessing
                ? 'bg-white/5 text-text-muted cursor-not-allowed'
                : 'bg-accent-cyan text-bg hover:opacity-90 shadow-glow'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                <span>Merging... {progress}%</span>
              </div>
            ) : (
              <>
                <Play size={24} className="fill-current" />
                <span>Merge Videos</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergerPage;
