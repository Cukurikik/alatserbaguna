import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, 
  Upload, 
  Download, 
  Settings, 
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Palette,
  Type as FontIcon
} from 'lucide-react';
import { useVideoTaskStore } from '../../store/useVideoTaskStore';
import { SubtitleBurnerEngine } from './SubtitleBurnerEngine';
import { SubtitleBurnerOptions } from './subtitle-burner.types';

export const SubtitleBurnerPage: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subFile, setSubFile] = useState<File | null>(null);
  const [options, setOptions] = useState<SubtitleBurnerOptions>({
    subtitleFile: null,
    fontName: 'Arial',
    fontSize: 24,
    fontColor: '#ffffff',
    outlineColor: '#000000',
    outlineWidth: 1
  });
  
  const { tasks, addTask, updateTask } = useVideoTaskStore();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSubFile(e.target.files[0]);
      setOptions(prev => ({ ...prev, subtitleFile: e.target.files![0] }));
    }
  };

  const handleProcess = async () => {
    if (!videoFile || !subFile) return;

    const taskId = crypto.randomUUID();
    setCurrentTaskId(taskId);
    addTask({
      id: taskId,
      name: `Burn Subtitles: ${videoFile.name}`,
      status: 'processing',
      progress: 0,
      type: 'subtitle-burner'
    });

    try {
      const result = await SubtitleBurnerEngine.burnSubtitles(
        videoFile,
        options,
        (progress) => updateTask(taskId, { progress })
      );

      const url = URL.createObjectURL(new Blob([result], { type: 'video/mp4' }));
      updateTask(taskId, { status: 'success', progress: 100, resultUrl: url });
    } catch (error) {
      console.error(error);
      updateTask(taskId, { status: 'error', error: 'Failed to burn subtitles' });
    }
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left: Preview & Upload */}
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center border border-accent-cyan/30">
              <Type className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Subtitle Burner</h1>
              <p className="text-text-muted">Permanently embed subtitles into your video.</p>
            </div>
          </div>

          <div className="aspect-video bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative group">
            {videoFile ? (
              <video 
                ref={videoRef}
                src={URL.createObjectURL(videoFile)} 
                controls 
                className="w-full h-full object-contain"
              />
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.07] transition-all">
                <Upload className="w-12 h-12 text-text-muted mb-4 group-hover:text-accent-cyan transition-colors" />
                <span className="text-lg font-medium">Upload Video</span>
                <span className="text-sm text-text-muted mt-2">MP4, MKV, MOV supported</span>
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
              </label>
            )}
          </div>

          {/* Subtitle Upload */}
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent-cyan" />
              Subtitle File
            </h3>
            <label className={`
              flex items-center justify-center w-full h-24 rounded-2xl border-2 border-dashed transition-all cursor-pointer
              ${subFile ? 'border-accent-cyan/50 bg-accent-cyan/5' : 'border-white/10 hover:border-white/20'}
            `}>
              {subFile ? (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-accent-cyan" />
                  <span className="font-medium">{subFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium">Select .srt or .ass file</span>
                </div>
              )}
              <input type="file" accept=".srt,.ass" className="hidden" onChange={handleSubUpload} />
            </label>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10 space-y-8">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <Settings className="w-6 h-6 text-accent-cyan" />
              Styling Options
            </h2>

            <div className="space-y-6">
              {/* Font Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-text-muted flex items-center gap-2">
                    <FontIcon className="w-4 h-4" /> Font Name
                  </label>
                  <input 
                    type="text"
                    value={options.fontName}
                    onChange={(e) => setOptions(prev => ({ ...prev, fontName: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-accent-cyan/50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-text-muted">Font Size</label>
                  <input 
                    type="number"
                    value={options.fontSize}
                    onChange={(e) => setOptions(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-accent-cyan/50 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Color Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-text-muted flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Text Color
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color"
                      value={options.fontColor}
                      onChange={(e) => setOptions(prev => ({ ...prev, fontColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={options.fontColor}
                      onChange={(e) => setOptions(prev => ({ ...prev, fontColor: e.target.value }))}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-text-muted flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Outline Color
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="color"
                      value={options.outlineColor}
                      onChange={(e) => setOptions(prev => ({ ...prev, outlineColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                    />
                    <input 
                      type="text"
                      value={options.outlineColor}
                      onChange={(e) => setOptions(prev => ({ ...prev, outlineColor: e.target.value }))}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-text-muted">Outline Width</label>
                <input 
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={options.outlineWidth}
                  onChange={(e) => setOptions(prev => ({ ...prev, outlineWidth: parseFloat(e.target.value) }))}
                  className="w-full accent-accent-cyan"
                />
                <div className="flex justify-between text-[10px] text-text-muted font-mono">
                  <span>0px</span>
                  <span>{options.outlineWidth}px</span>
                  <span>5px</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={!videoFile || !subFile || currentTask?.status === 'processing'}
              className={`
                w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                ${!videoFile || !subFile || currentTask?.status === 'processing'
                  ? 'bg-white/5 text-text-muted cursor-not-allowed'
                  : 'bg-accent-cyan text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent-cyan/20'}
              `}
            >
              {currentTask?.status === 'processing' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing... {Math.round(currentTask.progress)}%
                </>
              ) : (
                <>
                  <Type className="w-6 h-6" />
                  Burn Subtitles
                </>
              )}
            </button>

            <AnimatePresence>
              {currentTask?.status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-accent-cyan/10 border border-accent-cyan/20 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent-cyan" />
                    <span className="text-sm font-medium">Processing Complete!</span>
                  </div>
                  <a 
                    href={currentTask.resultUrl} 
                    download="burned_video.mp4"
                    className="p-2 bg-accent-cyan text-black rounded-xl hover:scale-105 transition-all"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </motion.div>
              )}

              {currentTask?.status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{currentTask.error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
