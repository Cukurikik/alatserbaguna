import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Film, 
  Upload, 
  Download, 
  Settings, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  List,
  Clock
} from 'lucide-react';
import { useVideoTaskStore } from '../../store/useVideoTaskStore';
import { SceneDetectorEngine } from './SceneDetectorEngine';
import { SceneDetectorOptions, SceneChange } from './scene-detector.types';

export const SceneDetectorPage: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [options, setOptions] = useState<SceneDetectorOptions>({
    threshold: 10
  });
  const [results, setResults] = useState<SceneChange[]>([]);
  
  const { tasks, addTask, updateTask } = useVideoTaskStore();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!videoFile) return;

    const taskId = crypto.randomUUID();
    setCurrentTaskId(taskId);
    addTask({
      id: taskId,
      name: `Scene Detection: ${videoFile.name}`,
      status: 'processing',
      progress: 0,
      type: 'scene-detector'
    });

    try {
      const sceneChanges = await SceneDetectorEngine.detectScenes(
        videoFile,
        options
      );

      setResults(sceneChanges);
      updateTask(taskId, { status: 'success', progress: 100 });
    } catch (error) {
      console.error(error);
      updateTask(taskId, { status: 'error', error: 'Failed to detect scenes' });
    }
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  const downloadResults = () => {
    const content = results.map(r => `Scene change at: ${r.timestamp.toFixed(3)}s`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene_changes.txt';
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center border border-accent-cyan/30">
              <Film className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Scene Detector</h1>
              <p className="text-text-muted">Automatically detect scene changes and cuts in your video.</p>
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

          {results.length > 0 && (
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <List className="w-5 h-5 text-accent-cyan" />
                  Detected Scenes ({results.length})
                </h3>
                <button 
                  onClick={downloadResults}
                  className="p-2 bg-accent-cyan/10 text-accent-cyan rounded-xl hover:bg-accent-cyan/20 transition-all flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export List
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {results.map((r, i) => (
                  <div key={i} className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-text-muted" />
                    <span className="text-xs font-mono">{r.timestamp.toFixed(2)}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                  <label className="text-sm text-text-muted">Sensitivity Threshold</label>
                  <span className="text-accent-cyan font-mono text-sm">{options.threshold}</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={options.threshold}
                  onChange={(e) => setOptions(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
                  className="w-full accent-accent-cyan"
                />
                <p className="text-[10px] text-text-muted">Lower values detect more subtle changes.</p>
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
                  Analyzing...
                </>
              ) : (
                <>
                  <Film className="w-6 h-6" />
                  Detect Scenes
                </>
              )}
            </button>

            <AnimatePresence>
              {currentTask?.status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-accent-cyan/10 border border-accent-cyan/20 rounded-2xl flex items-center gap-3 text-accent-cyan"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Analysis Complete!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
