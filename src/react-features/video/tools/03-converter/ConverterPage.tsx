import React, { useRef } from 'react';
import { useConverter } from './useConverter';
import { FormatSelector } from './FormatSelector';
import { QualityPresets } from './QualityPresets';
import { CodecOptions } from './CodecOptions';
import { Upload, Play, Download, AlertCircle, FileVideo } from 'lucide-react';

export const ConverterPage: React.FC = () => {
  const {
    file,
    setFile,
    options,
    setOptions,
    isProcessing,
    progress,
    error,
    outputUrl,
    handleConvert,
  } = useConverter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary">Format Converter</h1>
        <p className="text-text-secondary text-lg">Convert video files to any format instantly in your browser.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-surface border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-text-primary">Source Video</h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-accent-cyan/10 text-accent-cyan rounded-xl hover:bg-accent-cyan/20 transition-colors"
              >
                <Upload size={18} />
                <span>{file ? 'Change File' : 'Select File'}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
              />
            </div>

            {!file ? (
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileVideo className="text-text-muted" size={24} />
                </div>
                <p className="text-text-secondary mb-2">Drag and drop a video here</p>
                <p className="text-sm text-text-muted">or click "Select File" to browse</p>
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-bg-elevated p-4 rounded-2xl border border-white/5">
                <div className="w-12 h-12 bg-accent-cyan/10 rounded-xl flex items-center justify-center text-accent-cyan shrink-0">
                  <FileVideo size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{file.name}</p>
                  <p className="text-xs text-text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
            )}
          </div>

          {outputUrl && (
            <div className="bg-bg-surface border border-white/5 rounded-3xl p-8 backdrop-blur-xl space-y-4">
              <h2 className="text-xl font-semibold text-text-primary">Result</h2>
              {options.outputFormat === 'gif' ? (
                <img src={outputUrl} alt="Converted GIF" className="w-full rounded-2xl bg-black aspect-video object-contain" />
              ) : (
                <video src={outputUrl} controls className="w-full rounded-2xl bg-black aspect-video" />
              )}
              <div className="flex justify-end">
                <a
                  href={outputUrl}
                  download={`converted.${options.outputFormat}`}
                  className="flex items-center gap-2 px-6 py-3 bg-accent-cyan text-bg font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-glow"
                >
                  <Download size={20} />
                  <span>Download {options.outputFormat.toUpperCase()}</span>
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-bg-surface border border-white/5 rounded-3xl p-6 backdrop-blur-xl space-y-8">
            <FormatSelector options={options} setOptions={setOptions} />
            <QualityPresets options={options} setOptions={setOptions} />
            <CodecOptions options={options} setOptions={setOptions} />
          </div>

          {error && (
            <div className="bg-status-error/10 border border-status-error/20 text-status-error p-4 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={!file || isProcessing}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all ${
              !file || isProcessing
                ? 'bg-white/5 text-text-muted cursor-not-allowed'
                : 'bg-accent-cyan text-bg hover:opacity-90 shadow-glow'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                <span>Converting... {progress}%</span>
              </div>
            ) : (
              <>
                <Play size={24} className="fill-current" />
                <span>Convert Video</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConverterPage;
