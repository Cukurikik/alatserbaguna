import React, { useState, useRef, useEffect } from 'react';
import { GifEngine } from './GifEngine';
import { GifOptions } from './gif-maker.types';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Film, 
  Download, 
  Play, 
  Pause,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Settings2
} from 'lucide-react';

const engine = new GifEngine();

export default function GifMakerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [options, setOptions] = useState<GifOptions>({
    startTime: 0,
    duration: 5,
    fps: 15,
    width: 480,
    loop: true
  });
  
  const { startTask, updateProgress, completeTask, failTask, currentTask } = useVideoTaskStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    
    const taskId = Math.random().toString(36).substring(7);
    startTask({
      id: taskId,
      name: `GIF: ${file.name}`,
      status: 'processing',
      progress: 0,
      toolId: 'gif-maker',
      inputFiles: [{ name: file.name, size: file.size, type: file.type }],
      createdAt: Date.now()
    });

    try {
      updateProgress(taskId, 30);
      const result = await engine.process(file, options);
      const url = URL.createObjectURL(result);
      completeTask(taskId, url, result);
    } catch (err) {
      failTask(taskId, err instanceof Error ? err.message : 'Processing failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent">
            GIF MAKER
          </h1>
          <p className="text-slate-400 font-medium">Turn video clips into high-quality animated GIFs instantly.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-video bg-black/40 rounded-3xl border border-white/5 overflow-hidden group flex items-center justify-center">
              {previewUrl ? (
                <video 
                  ref={videoRef}
                  src={previewUrl} 
                  className="w-full h-full object-contain"
                  onLoadedMetadata={handleLoadedMetadata}
                  controls
                />
              ) : (
                <label className="flex flex-col items-center gap-4 cursor-pointer group-hover:scale-105 transition-transform duration-500">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-orange-500/50 group-hover:bg-orange-500/10 transition-all">
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-orange-400" />
                  </div>
                  <span className="text-slate-400 font-bold group-hover:text-white transition-colors">Drop video or click to upload</span>
                  <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
                </label>
              )}
            </div>

            {previewUrl && (
              <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <span>Start Time</span>
                      <span className="text-orange-400">{options.startTime.toFixed(1)}s</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max={duration}
                      step="0.1"
                      value={options.startTime}
                      onChange={(e) => setOptions(prev => ({ ...prev, startTime: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <span>Duration</span>
                      <span className="text-orange-400">{options.duration.toFixed(1)}s</span>
                    </div>
                    <input 
                      type="range"
                      min="0.5"
                      max={Math.min(15, duration - options.startTime)}
                      step="0.1"
                      value={options.duration}
                      onChange={(e) => setOptions(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls Area */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-8">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Settings2 className="w-3 h-3" />
                  GIF Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Frame Rate (FPS)</label>
                    <select 
                      value={options.fps}
                      onChange={(e) => setOptions(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-orange-500/50"
                    >
                      <option value="10">10 FPS (Small size)</option>
                      <option value="15">15 FPS (Standard)</option>
                      <option value="24">24 FPS (Smooth)</option>
                      <option value="30">30 FPS (High Quality)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Width</label>
                    <select 
                      value={options.width}
                      onChange={(e) => setOptions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-orange-500/50"
                    >
                      <option value="320">320px (Mobile)</option>
                      <option value="480">480px (Standard)</option>
                      <option value="640">640px (HD)</option>
                      <option value="800">800px (Large)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleProcess}
                disabled={!file || currentTask?.status === 'processing'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
              >
                {currentTask?.status === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating GIF...
                  </>
                ) : (
                  <>
                    <Film className="w-5 h-5" />
                    Create GIF
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {currentTask?.status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 text-orange-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold">GIF Generated!</span>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/20">
                    <img src={currentTask.outputUrl} className="w-full h-full object-contain" alt="GIF preview" />
                  </div>
                  <a 
                    href={currentTask.outputUrl} 
                    download="animation.gif"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download GIF
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
