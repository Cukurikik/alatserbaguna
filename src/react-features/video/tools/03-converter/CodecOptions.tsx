import React from 'react';
import { ConvertOptions } from './converter.types';

interface CodecOptionsProps {
  options: ConvertOptions;
  setOptions: (options: ConvertOptions) => void;
}

export const CodecOptions: React.FC<CodecOptionsProps> = ({ options, setOptions }) => {
  if (options.preset !== 'custom') return null;

  return (
    <div className="space-y-4 p-4 bg-bg border border-white/5 rounded-xl">
      <h4 className="text-sm font-semibold text-text-primary">Advanced Options</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-text-muted">Video Codec</label>
          <select
            value={options.codec}
            onChange={(e) => setOptions({ ...options, codec: e.target.value })}
            className="w-full bg-bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-cyan/50 focus:outline-none"
          >
            <option value="auto">Auto</option>
            <option value="libx264">H.264 (libx264)</option>
            <option value="libx265">HEVC (libx265)</option>
            <option value="libvpx-vp9">VP9 (libvpx-vp9)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-text-muted">Resolution</label>
          <select
            value={options.resolution}
            onChange={(e) => setOptions({ ...options, resolution: e.target.value })}
            className="w-full bg-bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-cyan/50 focus:outline-none"
          >
            <option value="">Original</option>
            <option value="1920x1080">1080p</option>
            <option value="1280x720">720p</option>
            <option value="854x480">480p</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-text-muted">Framerate (FPS)</label>
          <input
            type="number"
            placeholder="e.g. 30, 60"
            value={options.fps}
            onChange={(e) => setOptions({ ...options, fps: e.target.value })}
            className="w-full bg-bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-cyan/50 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-text-muted">Bitrate (e.g. 2M, 500k)</label>
          <input
            type="text"
            placeholder="e.g. 2M"
            value={options.bitrate}
            onChange={(e) => setOptions({ ...options, bitrate: e.target.value })}
            className="w-full bg-bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-cyan/50 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
