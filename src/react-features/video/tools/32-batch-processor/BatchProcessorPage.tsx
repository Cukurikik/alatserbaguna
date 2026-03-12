import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListVideo, Upload, Download, Settings, CheckCircle2, Loader2, X } from 'lucide-react';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { BatchProcessorEngine } from './BatchProcessorEngine';
import { BatchProcessorOptions } from './batch-processor.types';

export const BatchProcessorPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<BatchProcessorOptions>({
    operation: 'extract-audio',
    operationOptions: {},
    maxConcurrent: 2,
    stopOnError: false,
    outputPackaging: 'individual'
  });
  
  const { tasks, addTask, updateProgress, completeTask, failTask } = useVideoTaskStore();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);

  const handleProcess = async () => {
    if (files.length === 0) return;

    const taskId = crypto.randomUUID();
    setCurrentTaskId(taskId);
    addTask({
      id: taskId,
      toolId: 'batch-processor',
      name: `Batch: ${files.length} files`,
      status: 'processing',
      progress: 0,
      inputFiles: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      createdAt: Date.now()
    });

    try {
      const resultDatas = await BatchProcessorEngine.processBatch(
        files,
        options,
        (progress) => updateProgress(taskId, progress)
      );

      const urls = resultDatas.map((data, i) => {
        const type = options.operation === 'extract-audio' ? 'audio/mp3' : 'video/mp4';
        return URL.createObjectURL(new Blob([data], { type }));
      });
      
      setResults(urls);
      completeTask(taskId, urls[0]); // Just store the first one as the main resultUrl for now
    } catch (error) {
      console.error(error);
      failTask(taskId, error instanceof Error ? error.message : 'Failed to process batch');
    }
  };

  const currentTask = tasks.find(t => t.id === currentTaskId);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center border border-accent-cyan/30">
              <ListVideo className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Batch Processor</h1>
              <p className="text-text-muted">Process multiple videos at once.</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
            <label className="flex flex-col items-center justify-center cursor-pointer p-8 border-2 border-dashed border-white/10 rounded-2xl hover:bg-white/[0.07] transition-all mb-6">
              <Upload className="w-8 h-8 text-text-muted mb-2" />
              <span className="text-sm font-medium">Add Videos</span>
              <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => e.target.files && setFiles(prev => [...prev, ...Array.from(e.target.files!)])} />
            </label>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-sm truncate max-w-[200px]">{f.name}</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:bg-red-500/10 p-1 rounded-md">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10 space-y-8">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <Settings className="w-6 h-6 text-accent-cyan" />
              Batch Settings
            </h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm text-text-muted">Operation</label>
                <select 
                  value={options.operation}
                  onChange={(e) => setOptions(prev => ({ ...prev, operation: e.target.value as any }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-accent-cyan/50 outline-none transition-all"
                >
                  <option value="extract-audio">Extract Audio (MP3)</option>
                  <option value="convert">Convert to MP4</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={files.length === 0 || currentTask?.status === 'processing'}
              className={`
                w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                ${files.length === 0 || currentTask?.status === 'processing'
                  ? 'bg-white/5 text-text-muted cursor-not-allowed'
                  : 'bg-accent-cyan text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent-cyan/20'}
              `}
            >
              {currentTask?.status === 'processing' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing {files.length} files...
                </>
              ) : (
                <>
                  <ListVideo className="w-6 h-6" />
                  Start Batch
                </>
              )}
            </button>

            <AnimatePresence>
              {currentTask?.status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-accent-cyan/10 border border-accent-cyan/20 rounded-2xl space-y-3"
                >
                  <div className="flex items-center gap-3 text-accent-cyan">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Batch Complete!</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.map((url, i) => (
                      <a key={i} href={url} download={`output_${i}.${options.operation === 'extract-audio' ? 'mp3' : 'mp4'}`} className="px-3 py-1.5 bg-accent-cyan text-black rounded-lg text-xs font-bold flex items-center gap-1">
                        <Download className="w-3 h-3" /> File {i + 1}
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
