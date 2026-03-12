import React, { useState, useEffect } from 'react';
import { AudioReplacerEngine } from './AudioReplacerEngine';
import { AudioReplacerOptions } from './audio-replacer.types';
import { useVideoTaskStore } from '../../shared/store/videoTaskStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  Download, 
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Music,
  Video,
  Plus,
  Settings
} from 'lucide-react';

const engine = new AudioReplacerEngine();

export default function AudioReplacerPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<AudioReplacerOptions>({
    audioFile: null,
    keepOriginalAudio: false,
    audioVolume: 1.0,
    originalVolume: 0.5
  });
  
  const { startTask, updateProgress, completeTask, failTask, currentTask } = useVideoTaskStore();

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  useEffect(() => {
    setOptions(prev => ({ ...prev, audioFile }));
  }, [audioFile]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setVideoFile(e.target.files[0]);
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setAudioFile(e.target.files[0]);
  };

  const handleProcess = async () => {
    if (!videoFile || !audioFile) return;
    
    const taskId = Math.random().toString(36).substring(7);
    startTask({
      id: taskId,
      name: `Replace Audio: ${videoFile.name}`,
      status: 'processing',
      progress: 0,
      toolId: 'audio-replacer',
      inputFiles: [
        { name: videoFile.name, size: videoFile.size, type: videoFile.type },
        { name: audioFile.name, size: audioFile.size, type: audioFile.type }
      ],
      createdAt: Date.now()
    });

    try {
      updateProgress(taskId, 40);
      const result = await engine.process(videoFile, options);
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
          <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            AUDIO REPLACER
          </h1>
          <p className="text-slate-400 font-medium">Replace or mix video audio with external tracks seamlessly.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Video Input */}
            <div className="relative aspect-video bg-black/40 rounded-3xl border border-white/5 overflow-hidden group flex items-center justify-center">
              {previewUrl ? (
                <video src={previewUrl} className="w-full h-full object-contain" controls />
              ) : (
                <label className="flex flex-col items-center gap-4 cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all">
                    <Video className="w-8 h-8 text-slate-400" />
                  </div>
                  <span className="text-slate-400 font-bold">Upload Video</span>
                  <input type="file" className="hidden" accept="video/*" onChange={handleVideoChange} />
                </label>
              )}
            </div>

            {/* Audio Input */}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Audio Track</h3>
                {audioFile && <span className="text-[10px] font-mono text-cyan-400">{audioFile.name}</span>}
              </div>
              
              <label className={`flex items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${audioFile ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}>
                <Music className={`w-6 h-6 ${audioFile ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className={`font-bold ${audioFile ? 'text-white' : 'text-slate-400'}`}>
                  {audioFile ? 'Change Audio Track' : 'Upload MP3/WAV/AAC'}
                </span>
                <input type="file" className="hidden" accept="audio/*" onChange={handleAudioChange} />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-8">
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Settings className="w-3 h-3" />
                  Mixing Options
                </h3>
                
                <div className="space-y-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${options.keepOriginalAudio ? 'bg-cyan-500 border-cyan-500' : 'border-white/10 group-hover:border-white/30'}`}>
                      {options.keepOriginalAudio && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={options.keepOriginalAudio}
                      onChange={(e) => setOptions(prev => ({ ...prev, keepOriginalAudio: e.target.checked }))}
                    />
                    <span className="text-sm font-bold text-slate-300">Mix with original audio</span>
                  </label>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <span>New Audio Volume</span>
                        <span className="text-cyan-400">{Math.round(options.audioVolume * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="2" step="0.1"
                        value={options.audioVolume}
                        onChange={(e) => setOptions(prev => ({ ...prev, audioVolume: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>

                    {options.keepOriginalAudio && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <span>Original Volume</span>
                          <span className="text-cyan-400">{Math.round(options.originalVolume * 100)}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="2" step="0.1"
                          value={options.originalVolume}
                          onChange={(e) => setOptions(prev => ({ ...prev, originalVolume: parseFloat(e.target.value) }))}
                          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleProcess}
                disabled={!videoFile || !audioFile || currentTask?.status === 'processing'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
              >
                {currentTask?.status === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    Replace Audio
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {currentTask?.status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-cyan-500/10 border border-cyan-500/20 rounded-3xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 text-cyan-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold">Audio Replaced!</span>
                  </div>
                  <a 
                    href={currentTask.outputUrl} 
                    download={`replaced_${videoFile?.name}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download Video
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
