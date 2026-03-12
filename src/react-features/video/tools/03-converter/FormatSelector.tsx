import React from 'react';
import { ConvertOptions } from './converter.types';

interface FormatSelectorProps {
  options: ConvertOptions;
  setOptions: (options: ConvertOptions) => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({ options, setOptions }) => {
  const formats: ConvertOptions['outputFormat'][] = ['mp4', 'mkv', 'mov', 'avi', 'webm', 'gif'];

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-text-secondary">Output Format</label>
      <div className="grid grid-cols-3 gap-3">
        {formats.map((format) => (
          <button
            key={format}
            onClick={() => setOptions({ ...options, outputFormat: format })}
            className={`py-2 px-4 rounded-xl border transition-all uppercase font-bold text-sm ${
              options.outputFormat === format
                ? 'bg-accent-cyan/10 border-accent-cyan text-accent-cyan'
                : 'bg-bg border-white/5 text-text-muted hover:bg-white/5'
            }`}
          >
            {format}
          </button>
        ))}
      </div>
    </div>
  );
};
