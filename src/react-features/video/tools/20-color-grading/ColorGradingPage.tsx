import React, { useState, useEffect } from 'react';
import { ColorGradingEngine } from './ColorGradingEngine';
import { ColorGradingOptions } from './color-grading.types';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  Download, 
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sun,
  Contrast,
  Droplets,
  Zap,
  RotateCw,
  Settings
} from 'lucide-react';

const engine = new ColorGradingEngine();

export default function ColorGradingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<ColorGradingOptions>({
    brightness: 0,
    contrast: 1,
    saturation: 1,
    gamma: 1,
    hue: 0
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
      name: `Color Grading: ${file.name}`,
      status: 'processing',
      progress: 0,
      toolId: 'color-grading',
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

  const resetOptions = () => {
    setOptions({
      brightness: 0,
      contrast: 1,
      saturation: 1,
      gamma: 1,
      hue: 0
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            COLOR GRADING
          </h1>
          <p className="text-slate-400 font-medium">Professional color correction and cinematic grading tools.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-video bg-black/40 rounded-3xl border border-white/5 overflow-hidden group flex items-center justify-center">
              {previewUrl ? (
                <video src={previewUrl} className="w-full h-full object-contain" controls />
              ) : (
                <label className="flex flex-col items-center gap-4 cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all">
                    <Palette className="w-8 h-8 text-slate-400" />
                  </div>
                  <span className="text-slate-400 font-bold">Upload Video</span>
                  <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Settings className="w-3 h-3" />
                  Grading Controls
                </h3>
                <button onClick={resetOptions} className="text-[10px] font-black text-indigo-400 uppercase hover:text-indigo-300 transition-colors">Reset</button>
              </div>
              
              <div className="space-y-6">
                {/* Brightness */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> Brightness</span>
                    <span className="text-indigo-400">{options.brightness.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min="-1" max="1" step="0.01"
                    value={options.brightness}
                    onChange={(e) => setOptions(prev => ({ ...prev, brightness: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Contrast className="w-3 h-3" /> Contrast</span>
                    <span className="text-indigo-400">{options.contrast.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="2" step="0.01"
                    value={options.contrast}
                    onChange={(e) => setOptions(prev => ({ ...prev, contrast: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> Saturation</span>
                    <span className="text-indigo-400">{options.saturation.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="3" step="0.01"
                    value={options.saturation}
                    onChange={(e) => setOptions(prev => ({ ...prev, saturation: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Hue */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><RotateCw className="w-3 h-3" /> Hue</span>
                    <span className="text-indigo-400">{options.hue}°</span>
                  </div>
                  <input 
                    type="range" min="-180" max="180" step="1"
                    value={options.hue}
                    onChange={(e) => setOptions(prev => ({ ...prev, hue: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              <button 
                onClick={handleProcess}
                disabled={!file || currentTask?.status === 'processing'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
              >
                {currentTask?.status === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Grading...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Apply Grading
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {currentTask?.status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 text-indigo-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold">Grading Applied!</span>
                  </div>
                  <a 
                    href={currentTask.outputUrl} 
                    download={`graded_${file?.name}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download Video
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
