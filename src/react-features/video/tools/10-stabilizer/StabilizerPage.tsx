import React, { useState, useRef, useEffect } from 'react';
import { StabilizerEngine } from './StabilizerEngine';
import { StabilizerOptions } from './stabilizer.types';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Download, 
  Play, 
  Pause,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Activity
} from 'lucide-react';

const engine = new StabilizerEngine();

export default function StabilizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<StabilizerOptions>({
    smoothing: 10,
    outputFormat: 'mp4'
  });
  
  const { startTask, updateProgress, completeTask, failTask, currentTask } = useVideoTaskStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const handleProcess = async () => {
    if (!file) return;
    
    const taskId = Math.random().toString(36).substring(7);
    startTask({
      id: taskId,
      name: `Stabilize: ${file.name}`,
      status: 'processing',
      progress: 0,
      toolId: 'stabilize',
      inputFiles: [{ name: file.name, size: file.size, type: file.type }],
      createdAt: Date.now()
    });

    try {
      const result = await engine.process(file, options, (p) => {
        updateProgress(taskId, p);
      });
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
          <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            VIDEO STABILIZER
          </h1>
          <p className="text-slate-400 font-medium">Remove camera shake. Professional 2-pass stabilization for smooth cinematic shots.</p>
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
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <label className="flex flex-col items-center gap-4 cursor-pointer group-hover:scale-105 transition-transform duration-500">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all">
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-400" />
                  </div>
                  <span className="text-slate-400 font-bold group-hover:text-white transition-colors">Drop video or click to upload</span>
                  <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
                </label>
              )}

              {previewUrl && (
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => videoRef.current?.[isPlaying ? 'pause' : 'play']()}
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </button>
                </div>
              )}
            </div>

            {currentTask && currentTask.status === 'processing' && (
              <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-blue-400 uppercase tracking-widest">
                    {currentTask.progress < 50 ? 'Analyzing Motion (Pass 1)...' : 'Applying Stabilization (Pass 2)...'}
                  </span>
                  <span className="text-sm font-mono font-bold">{currentTask.progress}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentTask.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Controls Area */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Smoothing Strength</h3>
                  <span className="text-2xl font-black text-blue-400">{options.smoothing}</span>
                </div>
                
                <input 
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={options.smoothing}
                  onChange={(e) => setOptions(prev => ({ ...prev, smoothing: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
                <p className="text-[10px] text-slate-500 font-medium">Higher values result in smoother motion but more cropping.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Output Format</h3>
                <div className="flex gap-2">
                  {['mp4', 'mkv', 'webm'].map(format => (
                    <button
                      key={format}
                      onClick={() => setOptions(prev => ({ ...prev, outputFormat: format }))}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${options.outputFormat === format ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleProcess}
                disabled={!file || currentTask?.status === 'processing'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
              >
                {currentTask?.status === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5" />
                    Stabilize Video
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {currentTask?.status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold">Process Complete!</span>
                  </div>
                  <a 
                    href={currentTask.outputUrl} 
                    download={`stabilized_${file?.name}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download Result
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
