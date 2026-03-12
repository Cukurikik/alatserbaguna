import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Upload, Download, Settings, CheckCircle2, Loader2 } from 'lucide-react';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { SilenceRemoverEngine } from './SilenceRemoverEngine';
import { SilenceRemoverOptions } from './silence-remover.types';

export const SilenceRemoverPage: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [options, setOptions] = useState<SilenceRemoverOptions>({
    thresholdDb: -30,
    minSilenceDuration: 0.5,
    padding: 0.1,
    mode: 'remove',
    speedupFactor: 2.0
  });
  
  const { tasks, addTask, updateProgress, completeTask, failTask } = useVideoTaskStore();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!videoFile) return;

    const taskId = crypto.randomUUID();
    setCurrentTaskId(taskId);
    addTask({
      id: taskId,
      toolId: 'silence-remover',
      name: `Remove Silence: ${videoFile.name}`,
      status: 'processing',
      progress: 0,
      inputFiles: [{ name: videoFile.name, size: videoFile.size, type: videoFile.type }],
      createdAt: Date.now()
    });

    try {
      const result = await SilenceRemoverEngine.removeSilence(
        videoFile,
        options,
        (progress) => updateProgress(taskId, progress)
      );

      const url = URL.createObjectURL(new Blob([result], { type: 'video/mp4' }));
      completeTask(taskId, url);
    } catch (error) {
      console.error(error);
      failTask(taskId, error instanceof Error ? error.message : 'Failed to remove silence');
    }
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center border border-accent-cyan/30">
              <Scissors className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Silence Remover</h1>
              <p className="text-text-muted">Automatically remove silent parts from your video.</p>
            </div>
          </div>

          <div className="aspect-video bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative group">
            {videoFile ? (
              <video src={URL.createObjectURL(videoFile)} controls className="w-full h-full object-contain" />
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
              Detection Settings
            </h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm text-text-muted">Silence Threshold (dB)</label>
                  <span className="text-sm font-mono text-accent-cyan">{options.thresholdDb}dB</span>
                </div>
                <input 
                  type="range" 
                  min="-60" max="-10" step="1"
                  value={options.thresholdDb}
                  onChange={(e) => setOptions(prev => ({ ...prev, thresholdDb: parseFloat(e.target.value) }))}
                  className="w-full accent-accent-cyan"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm text-text-muted">Min Silence Duration (s)</label>
                  <span className="text-sm font-mono text-accent-cyan">{options.minSilenceDuration}s</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" max="2.0" step="0.1"
                  value={options.minSilenceDuration}
                  onChange={(e) => setOptions(prev => ({ ...prev, minSilenceDuration: parseFloat(e.target.value) }))}
                  className="w-full accent-accent-cyan"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm text-text-muted">Action</label>
                <select 
                  value={options.mode}
                  onChange={(e) => setOptions(prev => ({ ...prev, mode: e.target.value as any }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-accent-cyan/50 outline-none transition-all"
                >
                  <option value="remove">Remove Silence Completely</option>
                  <option value="speedup">Speed Up Silence (2x)</option>
                </select>
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
                  Processing...
                </>
              ) : (
                <>
                  <Scissors className="w-6 h-6" />
                  Remove Silence
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
                    <span className="text-sm font-medium">Processing Complete!</span>
                  </div>
                  <a href={currentTask.resultUrl} download="no_silence.mp4" className="p-2 bg-accent-cyan text-black rounded-xl">
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
