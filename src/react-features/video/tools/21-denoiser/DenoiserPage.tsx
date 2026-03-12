import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Upload, 
  Download, 
  Settings, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders
} from 'lucide-react';
import { useVideoTaskStore } from '../../store/useVideoTaskStore';
import { DenoiserEngine } from './DenoiserEngine';
import { DenoiserOptions } from './denoiser.types';

export const DenoiserPage: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [options, setOptions] = useState<DenoiserOptions>({
    strength: 5,
    method: 'hqdn3d'
  });
  
  const { tasks, addTask, updateTask } = useVideoTaskStore();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!videoFile) return;

    const taskId = crypto.randomUUID();
    setCurrentTaskId(taskId);
    addTask({
      id: taskId,
      name: `Denoise: ${videoFile.name}`,
      status: 'processing',
      progress: 0,
      type: 'denoiser'
    });

    try {
      const result = await DenoiserEngine.denoise(
        videoFile,
        options
      );

      const url = URL.createObjectURL(new Blob([result], { type: 'video/mp4' }));
      updateTask(taskId, { status: 'success', progress: 100, resultUrl: url });
    } catch (error) {
      console.error(error);
      updateTask(taskId, { status: 'error', error: 'Failed to denoise video' });
    }
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center border border-accent-cyan/30">
              <Sparkles className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI Denoiser</h1>
              <p className="text-text-muted">Remove noise and grain from your videos.</p>
            </div>
          </div>

          <div className="aspect-video bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative group">
            {videoFile ? (
              <video 
                src={URL.createObjectURL(videoFile)} 
                controls 
                className="w-full h-full object-contain"
              />
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
              Denoise Settings
            </h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm text-text-muted">Denoise Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['hqdn3d', 'nlmeans'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setOptions(prev => ({ ...prev, method: m }))}
                      className={`
                        py-3 rounded-xl border transition-all text-sm font-medium
                        ${options.method === m 
                          ? 'bg-accent-cyan/10 border-accent-cyan text-accent-cyan' 
                          : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'}
                      `}
                    >
                      {m === 'hqdn3d' ? 'High Quality 3D' : 'Non-Local Means'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm text-text-muted">Denoise Strength</label>
                  <span className="text-accent-cyan font-mono text-sm">{options.strength}</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={options.strength}
                  onChange={(e) => setOptions(prev => ({ ...prev, strength: parseInt(e.target.value) }))}
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
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Apply Denoise
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
                    <span className="text-sm font-medium">Video Denoised!</span>
                  </div>
                  <a 
                    href={currentTask.resultUrl} 
                    download="denoised_video.mp4"
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
