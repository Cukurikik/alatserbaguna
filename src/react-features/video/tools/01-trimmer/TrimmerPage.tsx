import React from 'react';
import { useTrimmer } from './useTrimmer';
import { TrimmerControls } from './TrimmerControls';
import { TrimmerTimeline } from './TrimmerTimeline';

export default function TrimmerPage() {
  const {
    file, setFile,
    startTime, setStartTime,
    endTime, setEndTime,
    loadingEngine, ffmpegReady,
    currentTask, handleTrim
  } = useTrimmer();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-3xl mx-auto text-white">
      <div>
        <h1 className="text-3xl font-sans font-bold tracking-tight mb-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
            <span className="text-xl">✂️</span>
          </div>
          Video Trimmer (React)
        </h1>
        <p className="text-text-secondary">Trim video files locally with frame-perfect precision using WASM FFmpeg.</p>
      </div>

      <div className="bg-bg-elevated border border-white/5 rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white">Input Video</label>
            <div className={`relative border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-accent-cyan/50 hover:bg-white/5 transition-all cursor-pointer ${file ? 'border-accent-cyan' : ''}`}>
              <input type="file" accept="video/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-white font-medium">{file.name}</span>
                  <span className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-text-secondary font-medium">Drag & drop or click to select</span>
                  <span className="text-xs text-text-muted">MP4, WEBM, MKV</span>
                </div>
              )}
            </div>
          </div>

          <TrimmerTimeline file={file} />

          <TrimmerControls 
            startTime={startTime} 
            endTime={endTime} 
            onStartTimeChange={setStartTime} 
            onEndTimeChange={setEndTime} 
          />

          <button 
            onClick={handleTrim}
            disabled={!file || !ffmpegReady || currentTask?.status === 'processing'}
            className={`mt-4 w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              file && ffmpegReady && currentTask?.status !== 'processing' 
                ? 'bg-accent-cyan text-bg-surface hover:bg-accent-cyan/90 shadow-glow' 
                : 'bg-white/5 text-text-muted cursor-not-allowed'
            }`}
          >
            {loadingEngine ? 'Loading FFmpeg...' : 
             currentTask?.status === 'processing' ? `Processing... ${currentTask.progress}%` : 
             currentTask?.status === 'success' ? 'Trim Complete' : 
             'Trim Video'}
          </button>

          {currentTask?.status === 'success' && currentTask.outputFile && (
            <div className="mt-4 p-4 rounded-xl bg-status-success/10 border border-status-success/20 text-status-success flex flex-col items-center gap-3">
              <p>Video trimmed successfully!</p>
              <a 
                href={URL.createObjectURL(currentTask.outputFile)} 
                download={currentTask.outputFile.name}
                className="px-4 py-2 bg-status-success text-bg-surface rounded-lg font-bold"
              >
                Download {currentTask.outputFile.name}
              </a>
            </div>
          )}
          
          {currentTask?.status === 'error' && (
            <div className="mt-4 p-4 rounded-xl bg-status-error/10 border border-status-error/20 text-status-error text-sm flex items-start gap-3">
              <p>Failed to process video. Please check the file format and try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
