import React, { useState, useEffect } from 'react';
import { GifConverterEngine } from './GifConverterEngine';
import { GifConverterOptions } from './gif-converter.types';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Film, 
  Download, 
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings,
  Image as ImageIcon
} from 'lucide-react';

const engine = new GifConverterEngine();

export default function GifConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<GifConverterOptions>({
    fps: 15,
    width: 480,
    quality: 80
  });
  
  const { startTask, updateProgress, completeTask, failTask, currentTask } = useVideoTaskStore();

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleProcess = async () => {
    if (!file) return;
    
    const taskId = Math.random().toString(36).substring(7);
    startTask({
      id: taskId,
      name: `Video to GIF: ${file.name}`,
      status: 'processing',
      progress: 0,
      toolId: 'gif-converter',
      inputFiles: [{ name: file.name, size: file.size, type: file.type }],
      createdAt: Date.now()
    });

    try {
      updateProgress(taskId, 40);
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
          <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">
            GIF CONVERTER
          </h1>
          <p className="text-slate-400 font-medium">Convert entire videos or clips into optimized animated GIFs.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-video bg-black/40 rounded-3xl border border-white/5 overflow-hidden group flex items-center justify-center">
              {previewUrl ? (
                <video src={previewUrl} className="w-full h-full object-contain" controls />
              ) : (
                <label className="flex flex-col items-center gap-4 cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all">
                    <Film className="w-8 h-8 text-slate-400" />
                  </div>
                  <span className="text-slate-400 font-bold">Upload Video</span>
                  <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-8">
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Settings className="w-3 h-3" />
                  GIF Parameters
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Frame Rate</label>
                    <select 
                      value={options.fps}
                      onChange={(e) => setOptions(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-rose-500/50"
                    >
                      <option value="10">10 FPS (Small)</option>
                      <option value="15">15 FPS (Standard)</option>
                      <option value="24">24 FPS (Smooth)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Width</label>
                    <select 
                      value={options.width}
                      onChange={(e) => setOptions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-rose-500/50"
                    >
                      <option value="320">320px</option>
                      <option value="480">480px</option>
                      <option value="640">640px</option>
                    </select>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleProcess}
                disabled={!file || currentTask?.status === 'processing'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
              >
                {currentTask?.status === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Convert to GIF
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {currentTask?.status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 text-rose-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold">GIF Ready!</span>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/20">
                    <img src={currentTask.outputUrl} className="w-full h-full object-contain" alt="GIF preview" />
                  </div>
                  <a 
                    href={currentTask.outputUrl} 
                    download="converted.gif"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors"
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
