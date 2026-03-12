import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Images, 
  Upload, 
  Download, 
  Settings, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Clock,
  Maximize
} from 'lucide-react';
import { useVideoTaskStore } from '../../store/useVideoTaskStore';
import { SlideshowEngine } from './SlideshowEngine';
import { SlideshowOptions } from './slideshow-maker.types';

export const SlideshowMakerPage: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [options, setOptions] = useState<SlideshowOptions>({
    durationPerImage: 3,
    transitionDuration: 0.5,
    outputResolution: '720p'
  });
  
  const { tasks, addTask, updateTask } = useVideoTaskStore();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (images.length < 2) return;

    const taskId = crypto.randomUUID();
    setCurrentTaskId(taskId);
    addTask({
      id: taskId,
      name: `Slideshow: ${images.length} images`,
      status: 'processing',
      progress: 0,
      type: 'slideshow-maker'
    });

    try {
      const result = await SlideshowEngine.createSlideshow(
        images,
        options
      );

      const url = URL.createObjectURL(new Blob([result], { type: 'video/mp4' }));
      updateTask(taskId, { status: 'success', progress: 100, resultUrl: url });
    } catch (error) {
      console.error(error);
      updateTask(taskId, { status: 'error', error: 'Failed to create slideshow' });
    }
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center border border-accent-cyan/30">
              <Images className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Slideshow Maker</h1>
              <p className="text-text-muted">Turn your photos into a beautiful video slideshow.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {images.map((img, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="aspect-square bg-white/5 rounded-2xl border border-white/10 overflow-hidden relative group"
                >
                  <img 
                    src={URL.createObjectURL(img)} 
                    alt={`Slide ${i}`} 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-md text-[10px] font-mono">
                    #{i + 1}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <label className="aspect-square bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.07] hover:border-accent-cyan/50 transition-all group">
              <Plus className="w-8 h-8 text-text-muted group-hover:text-accent-cyan transition-colors" />
              <span className="text-xs text-text-muted mt-2">Add Photos</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10 space-y-8">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <Settings className="w-6 h-6 text-accent-cyan" />
              Slideshow Settings
            </h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm text-text-muted flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Duration per Slide
                  </label>
                  <span className="text-accent-cyan font-mono text-sm">{options.durationPerImage}s</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={options.durationPerImage}
                  onChange={(e) => setOptions(prev => ({ ...prev, durationPerImage: parseFloat(e.target.value) }))}
                  className="w-full accent-accent-cyan"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm text-text-muted flex items-center gap-2">
                  <Maximize className="w-4 h-4" /> Output Resolution
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['720p', '1080p'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setOptions(prev => ({ ...prev, outputResolution: q as any }))}
                      className={`
                        py-2.5 rounded-xl border transition-all text-xs font-bold
                        ${options.outputResolution === q 
                          ? 'bg-accent-cyan/10 border-accent-cyan text-accent-cyan' 
                          : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'}
                      `}
                    >
                      {q} HD
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={images.length < 2 || currentTask?.status === 'processing'}
              className={`
                w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                ${images.length < 2 || currentTask?.status === 'processing'
                  ? 'bg-white/5 text-text-muted cursor-not-allowed'
                  : 'bg-accent-cyan text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent-cyan/20'}
              `}
            >
              {currentTask?.status === 'processing' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Images className="w-6 h-6" />
                  Create Slideshow
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
                    <span className="text-sm font-medium">Slideshow Ready!</span>
                  </div>
                  <a 
                    href={currentTask.resultUrl} 
                    download="slideshow.mp4"
                    className="p-2 bg-accent-cyan text-black rounded-xl"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
