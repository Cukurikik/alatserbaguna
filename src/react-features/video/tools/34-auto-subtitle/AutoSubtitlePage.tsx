import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Captions, Upload, Download, Settings, CheckCircle2, Loader2 } from 'lucide-react';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { AutoSubtitleEngine } from './AutoSubtitleEngine';
import { AutoSubtitleOptions } from './auto-subtitle.types';

export const AutoSubtitlePage: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [options, setOptions] = useState<AutoSubtitleOptions>({
    model: 'base',
    language: 'auto',
    translateTo: null,
    outputFormat: 'srt',
    burnIntoVideo: false,
    wordTimestamps: false
  });
  
  const { tasks, addTask, updateProgress, completeTask, failTask } = useVideoTaskStore();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!videoFile) return;

    const taskId = crypto.randomUUID();
    setCurrentTaskId(taskId);
    addTask({
      id: taskId,
      toolId: 'auto-subtitle',
      name: `Auto Subtitle: ${videoFile.name}`,
      status: 'processing',
      progress: 0,
      inputFiles: [{ name: videoFile.name, size: videoFile.size, type: videoFile.type }],
      createdAt: Date.now()
    });

    try {
      const result = await AutoSubtitleEngine.generateSubtitles(
        videoFile,
        options,
        (progress) => updateProgress(taskId, progress)
      );

      const url = URL.createObjectURL(new Blob([result], { type: 'text/plain' }));
      completeTask(taskId, url);
    } catch (error) {
      console.error(error);
      failTask(taskId, error instanceof Error ? error.message : 'Failed to generate subtitles');
    }
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center border border-accent-cyan/30">
              <Captions className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Auto Subtitle</h1>
              <p className="text-text-muted">Generate subtitles automatically using AI.</p>
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
              Subtitle Settings
            </h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm text-text-muted">AI Model</label>
                <select 
                  value={options.model}
                  onChange={(e) => setOptions(prev => ({ ...prev, model: e.target.value as any }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-accent-cyan/50 outline-none transition-all"
                >
                  <option value="tiny">Tiny (Fastest, less accurate)</option>
                  <option value="base">Base (Balanced)</option>
                  <option value="small">Small (Accurate, slower)</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-sm text-text-muted">Output Format</label>
                <select 
                  value={options.outputFormat}
                  onChange={(e) => setOptions(prev => ({ ...prev, outputFormat: e.target.value as any }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-accent-cyan/50 outline-none transition-all"
                >
                  <option value="srt">SRT</option>
                  <option value="vtt">VTT</option>
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
                  Generating...
                </>
              ) : (
                <>
                  <Captions className="w-6 h-6" />
                  Generate Subtitles
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
                    <span className="text-sm font-medium">Subtitles Ready!</span>
                  </div>
                  <a href={currentTask.resultUrl} download={`subtitles.${options.outputFormat}`} className="p-2 bg-accent-cyan text-black rounded-xl">
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
