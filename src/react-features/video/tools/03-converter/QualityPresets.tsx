import React from 'react';
import { ConvertOptions } from './converter.types';

interface QualityPresetsProps {
  options: ConvertOptions;
  setOptions: (options: ConvertOptions) => void;
}

export const QualityPresets: React.FC<QualityPresetsProps> = ({ options, setOptions }) => {
  const presets: ConvertOptions['preset'][] = ['fast', 'balanced', 'quality', 'custom'];

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-text-secondary">Quality Preset</label>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => setOptions({ ...options, preset })}
            className={`py-2 px-4 rounded-xl border transition-all capitalize font-bold text-sm ${
              options.preset === preset
                ? 'bg-accent-purple/10 border-accent-purple text-accent-purple'
                : 'bg-bg border-white/5 text-text-muted hover:bg-white/5'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
};
