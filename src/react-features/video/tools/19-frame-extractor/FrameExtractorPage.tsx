import React, { useState, useEffect } from 'react';
import { FrameExtractorEngine } from './FrameExtractorEngine';
import { FrameExtractorOptions } from './frame-extractor.types';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Images, 
  Download, 
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings,
  Archive
} from 'lucide-react';

const engine = new FrameExtractorEngine();

export default function FrameExtractorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<FrameExtractorOptions>({
    fps: 1,
    format: 'jpg',
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
      name: `Extract Frames: ${file.name}`,
      status: 'processing',
      progress: 0,
      toolId: 'frame-extractor',
      inputFiles: [{ name: file.name, size: file.size, type: file.type }],
      createdAt: Date.now()
    });

    try {
      const result = await engine.process(file, options, (p) => updateProgress(taskId, p));
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
          <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            FRAME EXTRACTOR
          </h1>
          <p className="text-slate-400 font-medium">Extract every frame or specific intervals as high-quality images.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-video bg-black/40 rounded-3xl border border-white/5 overflow-hidden group flex items-center justify-center">
              {previewUrl ? (
                <video src={previewUrl} className="w-full h-full object-contain" controls />
              ) : (
                <label className="flex flex-col items-center gap-4 cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all">
                    <Images className="w-8 h-8 text-slate-400" />
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
                  Extraction Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Interval (Frames per Second)</label>
                    <select 
                      value={options.fps}
                      onChange={(e) => setOptions(prev => ({ ...prev, fps: parseFloat(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="0.1">Every 10 seconds</option>
                      <option value="0.5">Every 2 seconds</option>
                      <option value="1">Every 1 second</option>
                      <option value="5">5 frames per second</option>
                      <option value="10">10 frames per second</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Image Format</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['jpg', 'png'].map(format => (
                        <button
                          key={format}
                          onClick={() => setOptions(prev => ({ ...prev, format: format as any }))}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${options.format === format ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleProcess}
                disabled={!file || currentTask?.status === 'processing'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
              >
                {currentTask?.status === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extracting... {currentTask.progress}%
                  </>
                ) : (
                  <>
                    <Archive className="w-5 h-5" />
                    Extract All Frames
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {currentTask?.status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 text-amber-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold">Extraction Complete!</span>
                  </div>
                  <p className="text-xs text-slate-400">All frames have been bundled into a ZIP archive for easy download.</p>
                  <a 
                    href={currentTask.outputUrl} 
                    download="frames.zip"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download ZIP
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
