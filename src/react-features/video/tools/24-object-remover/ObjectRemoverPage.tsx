import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Upload, 
  Download, 
  Settings, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Square
} from 'lucide-react';
import { useVideoTaskStore } from '../../store/useVideoTaskStore';
import { ObjectRemoverEngine } from './ObjectRemoverEngine';
import { ObjectRemoverOptions } from './object-remover.types';

export const ObjectRemoverPage: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ObjectRemoverOptions>({
    x: 10,
    y: 10,
    width: 100,
    height: 100,
    band: 1
  });
  
  const { tasks, addTask, updateTask } = useVideoTaskStore();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        setVideoDims({
          w: videoRef.current!.videoWidth,
          h: videoRef.current!.videoHeight
        });
      };
    }
  }, [videoFile]);

  const handleProcess = async () => {
    if (!videoFile) return;

    const taskId = crypto.randomUUID();
    setCurrentTaskId(taskId);
    addTask({
      id: taskId,
      name: `Object Removal: ${videoFile.name}`,
      status: 'processing',
      progress: 0,
      type: 'object-remover'
    });

    try {
      const result = await ObjectRemoverEngine.removeObject(
        videoFile,
        options
      );

      const url = URL.createObjectURL(new Blob([result], { type: 'video/mp4' }));
      updateTask(taskId, { status: 'success', progress: 100, resultUrl: url });
    } catch (error) {
      console.error(error);
      updateTask(taskId, { status: 'error', error: 'Failed to remove object' });
    }
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center border border-accent-cyan/30">
              <Trash2 className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Object Remover</h1>
              <p className="text-text-muted">Remove static objects or watermarks from your video.</p>
            </div>
          </div>

          <div className="aspect-video bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative group" ref={containerRef}>
            {videoFile ? (
              <>
                <video 
                  ref={videoRef}
                  src={URL.createObjectURL(videoFile)} 
                  controls 
                  className="w-full h-full object-contain"
                />
                {/* Visual Selector Overlay (Simplified) */}
                <div 
                  className="absolute border-2 border-accent-cyan bg-accent-cyan/20 pointer-events-none"
                  style={{
                    left: `${(options.x / videoDims.w) * 100}%`,
                    top: `${(options.y / videoDims.h) * 100}%`,
                    width: `${(options.width / videoDims.w) * 100}%`,
                    height: `${(options.height / videoDims.h) * 100}%`,
                  }}
                />
              </>
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.07] transition-all">
                <Upload className="w-12 h-12 text-text-muted mb-4 group-hover:text-accent-cyan transition-colors" />
                <span className="text-lg font-medium">Upload Video</span>
                <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files && setVideoFile(e.target.files[0])} />
              </label>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10 space-y-8">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <Settings className="w-6 h-6 text-accent-cyan" />
              Removal Area
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-text-muted uppercase tracking-wider">X Position</label>
                  <input 
                    type="number"
                    value={options.x}
                    onChange={(e) => setOptions(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-accent-cyan/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-text-muted uppercase tracking-wider">Y Position</label>
                  <input 
                    type="number"
                    value={options.y}
                    onChange={(e) => setOptions(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-accent-cyan/50 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-text-muted uppercase tracking-wider">Width</label>
                  <input 
                    type="number"
                    value={options.width}
                    onChange={(e) => setOptions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-accent-cyan/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-text-muted uppercase tracking-wider">Height</label>
                  <input 
                    type="number"
                    value={options.height}
                    onChange={(e) => setOptions(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-accent-cyan/50 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Square className="w-4 h-4 text-accent-cyan" />
                  <span className="text-sm font-medium">Interpolation Band</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="10"
                  value={options.band}
                  onChange={(e) => setOptions(prev => ({ ...prev, band: parseInt(e.target.value) }))}
                  className="w-full accent-accent-cyan"
                />
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={!videoFile || currentTask?.status === 'processing'}
              className={`
                w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                ${!videoFile || currentTask?.status === 'processing'
                  ? 'bg-white/5 text-text-muted cursor-not-allowed'
                  : 'bg-accent-cyan text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent-cyan/20'}
              `}
            >
              {currentTask?.status === 'processing' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-6 h-6" />
                  Remove Object
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
                    <span className="text-sm font-medium">Object Removed!</span>
                  </div>
                  <a 
                    href={currentTask.resultUrl} 
                    download="removed_object.mp4"
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
