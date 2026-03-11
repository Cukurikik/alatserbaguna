const fs = require('fs');
const path = require('path');

const tools = [
  { id: 1, slug: 'compress', title: 'Compress Video', desc: 'Reduce video file size', category: 'Edit', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 2, slug: 'trim', title: 'Trim Video', desc: 'Cut video start and end', category: 'Edit', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 3, slug: 'merge', title: 'Merge Videos', desc: 'Combine multiple videos', category: 'Edit', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 4, slug: 'convert', title: 'Convert Format', desc: 'Change video format', category: 'Convert', accepts: 'MP4 MOV AVI MKV WEBM', output: 'Any' },
  { id: 5, slug: 'resize', title: 'Resize Video', desc: 'Change video dimensions', category: 'Edit', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 6, slug: 'crop', title: 'Crop Video', desc: 'Crop video frame', category: 'Edit', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 7, slug: 'rotate', title: 'Rotate Video', desc: 'Rotate video 90/180/270 degrees', category: 'Edit', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 8, slug: 'speed', title: 'Change Speed', desc: 'Speed up or slow down video', category: 'Effects', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 9, slug: 'mute', title: 'Mute Video', desc: 'Remove audio from video', category: 'Audio', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 10, slug: 'extract-audio', title: 'Extract Audio', desc: 'Extract audio track from video', category: 'Audio', accepts: 'MP4 MOV AVI', output: 'MP3 AAC WAV' },
  { id: 11, slug: 'add-audio', title: 'Add Audio', desc: 'Add or replace audio track', category: 'Audio', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 12, slug: 'add-subtitles', title: 'Add Subtitles', desc: 'Add subtitles to video', category: 'Edit', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 13, slug: 'add-watermark', title: 'Add Watermark', desc: 'Add image or text watermark', category: 'Edit', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 14, slug: 'thumbnail', title: 'Extract Thumbnail', desc: 'Extract frame as image', category: 'Convert', accepts: 'MP4 MOV AVI', output: 'JPG PNG' },
  { id: 15, slug: 'gif', title: 'Video to GIF', desc: 'Convert video to animated GIF', category: 'Convert', accepts: 'MP4 MOV AVI', output: 'GIF' },
  { id: 16, slug: 'reverse', title: 'Reverse Video', desc: 'Play video backwards', category: 'Effects', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 17, slug: 'stabilize', title: 'Stabilize Video', desc: 'Fix shaky video', category: 'Advanced', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 18, slug: 'denoise', title: 'Denoise Video', desc: 'Remove video noise', category: 'Advanced', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 19, slug: 'brightness', title: 'Brightness & Contrast', desc: 'Adjust video colors', category: 'Effects', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 20, slug: 'filters', title: 'Apply Filters', desc: 'Apply visual filters', category: 'Effects', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 21, slug: 'loop', title: 'Loop Video', desc: 'Loop video multiple times', category: 'Effects', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 22, slug: 'split', title: 'Split Video', desc: 'Split video into parts', category: 'Edit', accepts: 'MP4 MOV AVI', output: 'ZIP' },
  { id: 23, slug: 'metadata', title: 'Edit Metadata', desc: 'Edit video metadata', category: 'Advanced', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 24, slug: 'fps', title: 'Change FPS', desc: 'Change video framerate', category: 'Advanced', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 25, slug: 'flip', title: 'Flip Video', desc: 'Flip video horizontally or vertically', category: 'Edit', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 26, slug: 'boomerang', title: 'Boomerang Effect', desc: 'Create boomerang loop', category: 'Effects', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 27, slug: 'timelapse', title: 'Create Timelapse', desc: 'Speed up video to timelapse', category: 'Effects', accepts: 'MP4 MOV AVI', output: 'MP4' },
  { id: 28, slug: 'screen-record', title: 'Screen Recorder', desc: 'Record your screen', category: 'Tools', accepts: 'None', output: 'WEBM' },
  { id: 29, slug: 'remove-background', title: 'Remove Background', desc: 'Remove video background', category: 'Advanced', accepts: 'MP4 MOV AVI', output: 'WEBM MP4' },
  { id: 30, slug: 'subtitle-extractor', title: 'Extract Subtitles', desc: 'Extract subtitles from video', category: 'Advanced', accepts: 'MP4 MKV', output: 'SRT VTT' }
];

const toolsDir = path.join(__dirname, 'app', '(tools)');
fs.mkdirSync(toolsDir, { recursive: true });

tools.forEach(tool => {
  const toolDir = path.join(toolsDir, tool.slug);
  fs.mkdirSync(toolDir, { recursive: true });
  
  const pageContent = `'use client';

import React, { useState } from 'react';
import ToolLayout from '@/components/layout/ToolLayout';
import VideoDropzone from '@/components/ui/VideoDropzone';
import OptionPanel from '@/components/ui/OptionPanel';
import ProgressBar from '@/components/ui/ProgressBar';
import DownloadButton from '@/components/ui/DownloadButton';
import { useVideoProcessor } from '@/hooks/useVideoProcessor';

export default function ${tool.slug.replace(/-/g, '').replace(/^\w/, c => c.toUpperCase())}Page() {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState({});
  const { process, progress, result, error, isProcessing } = useVideoProcessor('${tool.slug}');

  const handleProcess = () => {
    if (file) {
      process(file, options);
    }
  };

  return (
    <ToolLayout toolId={${tool.id}}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VideoDropzone 
            onFileSelect={setFile} 
            file={file}
            label="Drop your video here"
            sublabel="${tool.accept} up to 500MB"
          />
          
          {isProcessing && (
            <ProgressBar progress={progress?.percent || 0} label="Processing..." showDetails details={progress} />
          )}
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              {error}
            </div>
          )}
          
          {result && (
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-white">Result</h3>
              <DownloadButton result={result} />
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <OptionPanel title="Options">
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Configure ${tool.title} settings here.</p>
              {/* Add specific options for ${tool.slug} here */}
            </div>
          </OptionPanel>
          
          <button
            onClick={handleProcess}
            disabled={!file || isProcessing}
            className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl font-medium transition-colors"
          >
            {isProcessing ? 'Processing...' : '${tool.title}'}
          </button>
        </div>
      </div>
    </ToolLayout>
  );
}
`;

  fs.writeFileSync(path.join(toolDir, 'page.tsx'), pageContent);
});

console.log('Generated 30 tool pages.');
