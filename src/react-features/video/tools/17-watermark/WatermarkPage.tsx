import React, { useState, useEffect } from 'react';
import { WatermarkEngine } from './WatermarkEngine';
import { WatermarkOptions } from './watermark.types';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  Download, 
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Video,
  Settings,
  Layout
} from 'lucide-react';

const engine = new WatermarkEngine();

export default function WatermarkPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<WatermarkOptions>({
    watermarkFile: null,
    position: 'bottom-right',
    opacity: 0.7,
    scale: 0.2,
    padding: 20
  });
  
  const { startTask, updateProgress, completeTask, failTask, currentTask } = useVideoTaskStore();

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  useEffect(() => {
    setOptions(prev => ({ ...prev, watermarkFile }));
  }, [watermarkFile]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setVideoFile(e.target.files[0]);
  };

  const handleWatermarkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setWatermarkFile(e.target.files[0]);
  };

  const handleProcess = async () => {
    if (!videoFile || !watermarkFile) return;
    
    const taskId = Math.random().toString(36).substring(7);
    startTask({
      id: taskId,
      name: `Watermark: ${videoFile.name}`,
      status: 'processing',
      progress: 0,
      toolId: 'watermark',
      inputFiles: [
        { name: videoFile.name, size: videoFile.size, type: videoFile.type },
        { name: watermarkFile.name, size: watermarkFile.size, type: watermarkFile.type }
      ],
      createdAt: Date.now()
    });

    try {
      updateProgress(taskId, 40);
      const result = await engine.process(videoFile, options);
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
          <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
            WATERMARK ADDER
          </h1>
          <p className="text-slate-400 font-medium">Protect your content. Add logos or text watermarks to your videos.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Video Input */}
            <div className="relative aspect-video bg-black/40 rounded-3xl border border-white/5 overflow-hidden group flex items-center justify-center">
              {previewUrl ? (
                <video src={previewUrl} className="w-full h-full object-contain" controls />
              ) : (
                <label className="flex flex-col items-center gap-4 cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all">
                    <Video className="w-8 h-8 text-slate-400" />
                  </div>
                  <span className="text-slate-400 font-bold">Upload Video</span>
                  <input type="file" className="hidden" accept="video/*" onChange={handleVideoChange} />
                </label>
              )}
            </div>

            {/* Watermark Input */}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Watermark Image</h3>
                {watermarkFile && <span className="text-[10px] font-mono text-blue-400">{watermarkFile.name}</span>}
              </div>
              
              <label className={`flex items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${watermarkFile ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}>
                <ImageIcon className={`w-6 h-6 ${watermarkFile ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className={`font-bold ${watermarkFile ? 'text-white' : 'text-slate-400'}`}>
                  {watermarkFile ? 'Change Watermark' : 'Upload PNG/JPG (Transparent PNG recommended)'}
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={handleWatermarkChange} />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-8">
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layout className="w-3 h-3" />
                  Position & Style
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Position</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'top-left', label: 'TL' },
                        { id: 'top-right', label: 'TR' },
                        { id: 'center', label: 'C' },
                        { id: 'bottom-left', label: 'BL' },
                        { id: 'bottom-right', label: 'BR' }
                      ].map(pos => (
                        <button
                          key={pos.id}
                          onClick={() => setOptions(prev => ({ ...prev, position: pos.id as any }))}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${options.position === pos.id ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <span>Opacity</span>
                        <span className="text-blue-400">{Math.round(options.opacity * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="1" step="0.05"
                        value={options.opacity}
                        onChange={(e) => setOptions(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <span>Scale</span>
                        <span className="text-blue-400">{Math.round(options.scale * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0.05" max="0.5" step="0.01"
                        value={options.scale}
                        onChange={(e) => setOptions(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleProcess}
                disabled={!videoFile || !watermarkFile || currentTask?.status === 'processing'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
              >
                {currentTask?.status === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Droplets className="w-5 h-5" />
                    Add Watermark
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {currentTask?.status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 text-blue-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold">Watermark Added!</span>
                  </div>
                  <a 
                    href={currentTask.outputUrl} 
                    download={`watermarked_${videoFile?.name}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors"
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
