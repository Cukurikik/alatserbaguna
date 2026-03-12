import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SplitSquareHorizontal, Upload, Download, Settings, CheckCircle2, Loader2 } from 'lucide-react';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { ComparisonEngine } from './ComparisonEngine';
import { ComparisonOptions } from './comparison.types';

export const ComparisonPage: React.FC = () => {
  const [videoA, setVideoA] = useState<File | null>(null);
  const [videoB, setVideoB] = useState<File | null>(null);
  const [options, setOptions] = useState<ComparisonOptions>({
    splitMode: 'vertical',
    splitPosition: 0.5,
    syncPlayback: true,
    labelA: 'Original',
    labelB: 'Processed',
    exportAsSideBySide: true
  });
  
  const { tasks, addTask, updateProgress, completeTask, failTask } = useVideoTaskStore();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!videoA || !videoB) return;

    const taskId = crypto.randomUUID();
    setCurrentTaskId(taskId);
    addTask({
      id: taskId,
      toolId: 'comparison',
      name: `Compare: ${videoA.name}`,
      status: 'processing',
      progress: 0,
      inputFiles: [
        { name: videoA.name, size: videoA.size, type: videoA.type },
        { name: videoB.name, size: videoB.size, type: videoB.type }
      ],
      createdAt: Date.now()
    });

    try {
      const result = await ComparisonEngine.exportComparison(
        videoA,
        videoB,
        options,
        (progress) => updateProgress(taskId, progress)
      );

      const url = URL.createObjectURL(new Blob([result], { type: 'video/mp4' }));
      completeTask(taskId, url);
    } catch (error) {
      console.error(error);
      failTask(taskId, error instanceof Error ? error.message : 'Failed to export comparison');
    }
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center border border-accent-cyan/30">
              <SplitSquareHorizontal className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">A/B Comparison</h1>
              <p className="text-text-muted">Compare two videos side-by-side.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-video bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative group">
              {videoA ? (
                <video src={URL.createObjectURL(videoA)} controls className="w-full h-full object-contain" />
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.07] transition-all">
                  <Upload className="w-8 h-8 text-text-muted mb-2 group-hover:text-accent-cyan transition-colors" />
                  <span className="text-sm font-medium">Video A</span>
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files && setVideoA(e.target.files[0])} />
                </label>
              )}
            </div>
            <div className="aspect-video bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative group">
              {videoB ? (
                <video src={URL.createObjectURL(videoB)} controls className="w-full h-full object-contain" />
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.07] transition-all">
                  <Upload className="w-8 h-8 text-text-muted mb-2 group-hover:text-accent-cyan transition-colors" />
                  <span className="text-sm font-medium">Video B</span>
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files && setVideoB(e.target.files[0])} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10 space-y-8">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <Settings className="w-6 h-6 text-accent-cyan" />
              Export Settings
            </h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm text-text-muted">Split Mode</label>
                <select 
                  value={options.splitMode}
                  onChange={(e) => setOptions(prev => ({ ...prev, splitMode: e.target.value as any }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-accent-cyan/50 outline-none transition-all"
                >
                  <option value="vertical">Side by Side (Vertical Split)</option>
                  <option value="horizontal">Top and Bottom (Horizontal Split)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={!videoA || !videoB || currentTask?.status === 'processing'}
              className={`
                w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                ${!videoA || !videoB || currentTask?.status === 'processing'
                  ? 'bg-white/5 text-text-muted cursor-not-allowed'
                  : 'bg-accent-cyan text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent-cyan/20'}
              `}
            >
              {currentTask?.status === 'processing' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <SplitSquareHorizontal className="w-6 h-6" />
                  Export Comparison
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
                    <span className="text-sm font-medium">Export Complete!</span>
                  </div>
                  <a href={currentTask.resultUrl} download="comparison.mp4" className="p-2 bg-accent-cyan text-black rounded-xl">
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
