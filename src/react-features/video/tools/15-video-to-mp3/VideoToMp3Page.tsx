import React, { useState, useEffect } from 'react';
import { VideoToMp3Engine } from './VideoToMp3Engine';
import { VideoToMp3Options } from './video-to-mp3.types';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music2, 
  Download, 
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Settings2,
  Waveform
} from 'lucide-react';

const engine = new VideoToMp3Engine();

export default function VideoToMp3Page() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<VideoToMp3Options>({
    bitrate: '192k',
    channels: '2',
    sampleRate: '44100'
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
      name: `Video to MP3: ${file.name}`,
      status: 'processing',
      progress: 0,
      toolId: 'video-to-mp3',
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
          <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
            VIDEO TO MP3
          </h1>
          <p className="text-slate-400 font-medium">Professional grade MP3 conversion with customizable audio parameters.</p>
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
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-purple-500/50 group-hover:bg-purple-500/10 transition-all">
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-purple-400" />
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
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Settings2 className="w-3 h-3" />
                  MP3 Configuration
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Bitrate (Quality)</label>
                    <select 
                      value={options.bitrate}
                      onChange={(e) => setOptions(prev => ({ ...prev, bitrate: e.target.value as any }))}
                      className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="128k">128 kbps (Standard)</option>
                      <option value="192k">192 kbps (High Quality)</option>
                      <option value="256k">256 kbps (Pro)</option>
                      <option value="320k">320 kbps (Extreme)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Channels</label>
                      <select 
                        value={options.channels}
                        onChange={(e) => setOptions(prev => ({ ...prev, channels: e.target.value as any }))}
                        className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="1">Mono</option>
                        <option value="2">Stereo</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Sample Rate</label>
                      <select 
                        value={options.sampleRate}
                        onChange={(e) => setOptions(prev => ({ ...prev, sampleRate: e.target.value as any }))}
                        className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="44100">44.1 kHz</option>
                        <option value="48000">48.0 kHz</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleProcess}
                disabled={!file || currentTask?.status === 'processing'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
              >
                {currentTask?.status === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Music2 className="w-5 h-5" />
                    Convert to MP3
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {currentTask?.status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 text-purple-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold">Conversion Complete!</span>
                  </div>
                  <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                    <audio src={currentTask.outputUrl} controls className="w-full" />
                  </div>
                  <a 
                    href={currentTask.outputUrl} 
                    download="audio.mp3"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download MP3
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
