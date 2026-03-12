import React, { useState, useEffect } from 'react';
import { AudioExtractorEngine } from './AudioExtractorEngine';
import { AudioExtractorOptions } from './audio-extractor.types';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Download, 
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Settings
} from 'lucide-react';

const engine = new AudioExtractorEngine();

export default function AudioExtractorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<AudioExtractorOptions>({
    format: 'mp3',
    bitrate: '192k'
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
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    
    const taskId = Math.random().toString(36).substring(7);
    startTask({
      id: taskId,
      name: `Extract Audio: ${file.name}`,
      status: 'processing',
      progress: 0,
      toolId: 'audio-extractor',
      inputFiles: [{ name: file.name, size: file.size, type: file.type }],
      createdAt: Date.now()
    });

    try {
      updateProgress(taskId, 40);
      const result = await engine.process(file, options);
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
          <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            AUDIO EXTRACTOR
          </h1>
          <p className="text-slate-400 font-medium">Extract high-quality audio tracks from any video file.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-video bg-black/40 rounded-3xl border border-white/5 overflow-hidden group flex items-center justify-center">
              {previewUrl ? (
                <video 
                  src={previewUrl} 
                  className="w-full h-full object-contain"
                  controls
                />
              ) : (
                <label className="flex flex-col items-center gap-4 cursor-pointer group-hover:scale-105 transition-transform duration-500">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all">
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-400" />
                  </div>
                  <span className="text-slate-400 font-bold group-hover:text-white transition-colors">Drop video or click to upload</span>
                  <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          {/* Controls Area */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-8">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Settings className="w-3 h-3" />
                  Extraction Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Output Format</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['mp3', 'wav', 'aac', 'ogg'].map(format => (
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

                  {options.format === 'mp3' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Bitrate</label>
                      <select 
                        value={options.bitrate}
                        onChange={(e) => setOptions(prev => ({ ...prev, bitrate: e.target.value }))}
                        className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-blue-500/50"
                      >
                        <option value="128k">128 kbps (Standard)</option>
                        <option value="192k">192 kbps (High Quality)</option>
                        <option value="256k">256 kbps (Pro)</option>
                        <option value="320k">320 kbps (Extreme)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleProcess}
                disabled={!file || currentTask?.status === 'processing'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
              >
                {currentTask?.status === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Music className="w-5 h-5" />
                    Extract Audio
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {currentTask?.status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 text-blue-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold">Audio Extracted!</span>
                  </div>
                  <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                    <audio src={currentTask.outputUrl} controls className="w-full" />
                  </div>
                  <a 
                    href={currentTask.outputUrl} 
                    download={`audio.${options.format}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download Audio
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
