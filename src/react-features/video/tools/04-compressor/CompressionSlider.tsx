import React from 'react';
import { CompressOptions } from './compressor.types';

interface CompressionSliderProps {
  options: CompressOptions;
  setOptions: (options: CompressOptions) => void;
  fileSizeMB: number | null;
}

export const CompressionSlider: React.FC<CompressionSliderProps> = ({ options, setOptions, fileSizeMB }) => {
  return (
    <div className="space-y-6">
      <div className="flex bg-bg-surface border border-white/5 rounded-xl p-1">
        <button
          onClick={() => setOptions({ ...options, mode: 'quality' })}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            options.mode === 'quality' ? 'bg-accent-cyan text-bg shadow-glow' : 'text-text-muted hover:text-white'
          }`}
        >
          Target Quality
        </button>
        <button
          onClick={() => setOptions({ ...options, mode: 'size' })}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            options.mode === 'size' ? 'bg-accent-cyan text-bg shadow-glow' : 'text-text-muted hover:text-white'
          }`}
        >
          Target Size
        </button>
      </div>

      {options.mode === 'quality' ? (
        <div className="space-y-4">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-text-secondary">Quality Level (CRF)</label>
            <span className="text-sm text-accent-cyan font-mono">{options.crfValue}</span>
          </div>
          <input
            type="range"
            min="18"
            max="51"
            step="1"
            value={options.crfValue}
            onChange={(e) => setOptions({ ...options, crfValue: parseInt(e.target.value) })}
            className="w-full accent-accent-cyan"
          />
          <div className="flex justify-between text-xs text-text-muted">
            <span>High Quality (Larger File)</span>
            <span>Low Quality (Smaller File)</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-text-secondary">Target Size (MB)</label>
            <span className="text-sm text-accent-cyan font-mono">{options.targetSizeMB} MB</span>
          </div>
          <input
            type="range"
            min="1"
            max={fileSizeMB ? Math.ceil(fileSizeMB) : 100}
            step="1"
            value={options.targetSizeMB}
            onChange={(e) => setOptions({ ...options, targetSizeMB: parseInt(e.target.value) })}
            className="w-full accent-accent-cyan"
          />
          <div className="flex justify-between text-xs text-text-muted">
            <span>Smallest</span>
            <span>Original Size</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="text-sm font-medium text-text-secondary">Encoding Speed</label>
        <select
          value={options.preset}
          onChange={(e) => setOptions({ ...options, preset: e.target.value as any })}
          className="w-full bg-bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-cyan/50 focus:outline-none"
        >
          <option value="ultrafast">Ultrafast (Lowest Quality/Size Ratio)</option>
          <option value="superfast">Superfast</option>
          <option value="veryfast">Veryfast</option>
          <option value="faster">Faster</option>
          <option value="fast">Fast</option>
          <option value="medium">Medium (Balanced)</option>
          <option value="slow">Slow</option>
          <option value="slower">Slower</option>
          <option value="veryslow">Veryslow (Best Quality/Size Ratio)</option>
        </select>
      </div>
    </div>
  );
};
