import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Upload, Download, Settings, CheckCircle2, Loader2 } from 'lucide-react';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { PipOverlayEngine } from './PipOverlayEngine';
import { PipOverlayOptions } from './pip-overlay.types';

export const PipOverlayPage: React.FC = () => {
  const [mainVideo, setMainVideo] = useState<File | null>(null);
  const [overlayVideo, setOverlayVideo] = useState<File | null>(null);
  const [options, setOptions] = useState<PipOverlayOptions>({
    x: 10,
    y: 10,
    scale: 0.25,
    opacity: 1,
    startTime: 0,
    shadow: true,
    borderRadius: 0
  });
  
  const { tasks, addTask, updateProgress, completeTask, failTask } = useVideoTaskStore();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!mainVideo || !overlayVideo) return;

    const taskId = crypto.randomUUID();
    setCurrentTaskId(taskId);
    addTask({
      id: taskId,
      toolId: 'pip-overlay',
      name: `PiP: ${mainVideo.name}`,
      status: 'processing',
      progress: 0,
      inputFiles: [{ name: mainVideo.name, size: mainVideo.size, type: mainVideo.type }],
      createdAt: Date.now()
    });

    try {
      const result = await PipOverlayEngine.applyOverlay(
        mainVideo,
        overlayVideo,
        options,
        (progress) => updateProgress(taskId, progress)
      );

      const url = URL.createObjectURL(new Blob([result], { type: 'video/mp4' }));
      completeTask(taskId, url);
    } catch (error) {
      console.error(error);
      failTask(taskId, error instanceof Error ? error.message : 'Failed to apply overlay');
    }
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center border border-accent-cyan/30">
              <Layers className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">PiP Overlay</h1>
              <p className="text-text-muted">Add a picture-in-picture overlay to your video.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-video bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative group">
              {mainVideo ? (
                <video src={URL.createObjectURL(mainVideo)} controls className="w-full h-full object-contain" />
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.07] transition-all">
                  <Upload className="w-8 h-8 text-text-muted mb-2 group-hover:text-accent-cyan transition-colors" />
                  <span className="text-sm font-medium">Main Video</span>
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files && setMainVideo(e.target.files[0])} />
                </label>
              )}
            </div>
            <div className="aspect-video bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative group">
              {overlayVideo ? (
                <video src={URL.createObjectURL(overlayVideo)} controls className="w-full h-full object-contain" />
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.07] transition-all">
                  <Upload className="w-8 h-8 text-text-muted mb-2 group-hover:text-accent-cyan transition-colors" />
                  <span className="text-sm font-medium">Overlay Video</span>
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files && setOverlayVideo(e.target.files[0])} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10 space-y-8">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <Settings className="w-6 h-6 text-accent-cyan" />
              Overlay Settings
            </h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm text-text-muted">Scale</label>
                  <span className="text-accent-cyan font-mono text-sm">{Math.round(options.scale * 100)}%</span>
                </div>
                <input 
                  type="range" min="0.05" max="1" step="0.05" value={options.scale}
                  onChange={(e) => setOptions(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                  className="w-full accent-accent-cyan"
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm text-text-muted">X Position</label>
                  <span className="text-accent-cyan font-mono text-sm">{options.x}px</span>
                </div>
                <input 
                  type="range" min="0" max="1000" step="10" value={options.x}
                  onChange={(e) => setOptions(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                  className="w-full accent-accent-cyan"
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm text-text-muted">Y Position</label>
                  <span className="text-accent-cyan font-mono text-sm">{options.y}px</span>
                </div>
                <input 
                  type="range" min="0" max="1000" step="10" value={options.y}
                  onChange={(e) => setOptions(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                  className="w-full accent-accent-cyan"
                />
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={!mainVideo || !overlayVideo || currentTask?.status === 'processing'}
              className={`
                w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                ${!mainVideo || !overlayVideo || currentTask?.status === 'processing'
                  ? 'bg-white/5 text-text-muted cursor-not-allowed'
                  : 'bg-accent-cyan text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent-cyan/20'}
              `}
            >
              {currentTask?.status === 'processing' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Layers className="w-6 h-6" />
                  Apply Overlay
                </>
              )}
            </button>

            <AnimatePresence>
              {currentTask?.status === 'success' && currentTask.resultUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-accent-cyan/10 border border-accent-cyan/20 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent-cyan" />
                    <span className="text-sm font-medium">Overlay Applied!</span>
                  </div>
                  <a href={currentTask.resultUrl} download="pip_video.mp4" className="p-2 bg-accent-cyan text-black rounded-xl">
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
