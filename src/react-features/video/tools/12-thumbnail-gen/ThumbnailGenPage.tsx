import React, { useState, useRef, useEffect } from 'react';
import { ThumbnailEngine } from './ThumbnailEngine';
import { ThumbnailOptions } from './thumbnail-gen.types';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, 
  Download, 
  Play, 
  Pause,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera
} from 'lucide-react';

const engine = new ThumbnailEngine();

export default function ThumbnailGenPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [options, setOptions] = useState<ThumbnailOptions>({
    timestamp: 0,
    format: 'jpg',
    width: 1280
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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setOptions(prev => ({ ...prev, timestamp: videoRef.current!.currentTime }));
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
      name: `Thumbnail: ${file.name} @ ${options.timestamp.toFixed(2)}s`,
      status: 'processing',
      progress: 0,
      toolId: 'thumbnail-gen',
      inputFiles: [{ name: file.name, size: file.size, type: file.type }],
      createdAt: Date.now()
    });

    try {
      updateProgress(taskId, 50);
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
          <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            THUMBNAIL GEN
          </h1>
          <p className="text-slate-400 font-medium">Capture the perfect moment. High-quality frame extraction at any timestamp.</p>
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
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  controls
                />
              ) : (
                <label className="flex flex-col items-center gap-4 cursor-pointer group-hover:scale-105 transition-transform duration-500">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all">
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-emerald-400" />
                  </div>
                  <span className="text-slate-400 font-bold group-hover:text-white transition-colors">Drop video or click to upload</span>
                  <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
                </label>
              )}
            </div>

            {previewUrl && (
              <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Selected Timestamp</span>
                  <span className="text-xl font-mono font-bold text-emerald-400">{currentTime.toFixed(3)}s</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max={duration}
                  step="0.001"
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    if (videoRef.current) videoRef.current.currentTime = time;
                  }}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Controls Area */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-8">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Image Format</h3>
                <div className="flex gap-2">
                  {['jpg', 'png'].map(format => (
                    <button
                      key={format}
                      onClick={() => setOptions(prev => ({ ...prev, format: format as 'jpg' | 'png' }))}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${options.format === format ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Output Width</h3>
                <select 
                  value={options.width}
                  onChange={(e) => setOptions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="640">640px (SD)</option>
                  <option value="1280">1280px (HD)</option>
                  <option value="1920">1920px (Full HD)</option>
                  <option value="3840">3840px (4K)</option>
                </select>
              </div>

              <button 
                onClick={handleProcess}
                disabled={!file || currentTask?.status === 'processing'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
              >
                {currentTask?.status === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Capture Frame
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
                    <span className="font-bold">Thumbnail Ready!</span>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                    <img src={currentTask.outputUrl} className="w-full h-full object-cover" alt="Thumbnail preview" />
                  </div>
                  <a 
                    href={currentTask.outputUrl} 
                    download={`thumbnail_${options.timestamp.toFixed(2)}s.${options.format}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download Image
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
