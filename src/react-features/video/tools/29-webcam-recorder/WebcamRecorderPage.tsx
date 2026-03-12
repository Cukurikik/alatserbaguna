import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Download, 
  Settings, 
  CheckCircle2,
  AlertCircle,
  Circle,
  Square,
  Mic,
  MicOff,
  Video,
  RefreshCw
} from 'lucide-react';

export const WebcamRecorderPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [options, setOptions] = useState({ audio: true, quality: '720p' });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const constraints = {
        video: { 
          width: options.quality === '1080p' ? 1920 : 1280,
          height: options.quality === '1080p' ? 1080 : 720
        },
        audio: options.audio
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (previewRef.current) previewRef.current.srcObject = stream;

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
        if (previewRef.current) previewRef.current.srcObject = null;
      };

      recorder.start();
      setIsRecording(true);
      setRecordedUrl(null);
    } catch (err) {
      console.error(err);
      alert('Failed to access webcam. Please ensure you granted permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center border border-accent-cyan/30">
              <Camera className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Webcam Recorder</h1>
              <p className="text-text-muted">Record high-quality video directly from your camera.</p>
            </div>
          </div>

          <div className="aspect-video bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative group">
            {isRecording ? (
              <video 
                ref={previewRef}
                autoPlay 
                muted 
                className="w-full h-full object-contain scale-x-[-1]"
              />
            ) : recordedUrl ? (
              <video 
                src={recordedUrl} 
                controls 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Video className="w-16 h-16 text-white/10 mb-4" />
                <span className="text-text-muted">Camera ready</span>
              </div>
            )}
            
            {isRecording && (
              <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Live</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10 space-y-8">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <Settings className="w-6 h-6 text-accent-cyan" />
              Camera Settings
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  {options.audio ? <Mic className="w-5 h-5 text-accent-cyan" /> : <MicOff className="w-5 h-5 text-text-muted" />}
                  <div>
                    <div className="text-sm font-medium">Record Audio</div>
                    <div className="text-[10px] text-text-muted">Use microphone</div>
                  </div>
                </div>
                <button
                  onClick={() => setOptions(prev => ({ ...prev, audio: !prev.audio }))}
                  className={`
                    w-12 h-6 rounded-full transition-all relative
                    ${options.audio ? 'bg-accent-cyan' : 'bg-white/10'}
                  `}
                >
                  <div className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                    ${options.audio ? 'left-7' : 'left-1'}
                  `} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-sm text-text-muted">Resolution</label>
                <div className="grid grid-cols-2 gap-3">
                  {['720p', '1080p'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setOptions(prev => ({ ...prev, quality: q }))}
                      className={`
                        py-2.5 rounded-xl border transition-all text-xs font-bold
                        ${options.quality === q 
                          ? 'bg-accent-cyan/10 border-accent-cyan text-accent-cyan' 
                          : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'}
                      `}
                    >
                      {q} HD
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isRecording ? (
              <button
                onClick={stopRecording}
                className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                <Square className="w-6 h-6 fill-current" />
                Stop Recording
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-full py-4 rounded-2xl bg-accent-cyan text-black font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-accent-cyan/20"
              >
                <Circle className="w-6 h-6 fill-current" />
                Start Camera
              </button>
            )}

            <AnimatePresence>
              {recordedUrl && !isRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-accent-cyan/10 border border-accent-cyan/20 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent-cyan" />
                    <span className="text-sm font-medium">Video Saved!</span>
                  </div>
                  <a 
                    href={recordedUrl} 
                    download="webcam_recording.webm"
                    className="p-2 bg-accent-cyan text-black rounded-xl hover:scale-105 transition-all"
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
