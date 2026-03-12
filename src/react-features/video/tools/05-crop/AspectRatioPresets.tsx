import React from 'react';
import { AspectRatio, ASPECT_RATIOS } from './crop.types';

interface AspectRatioPresetsProps {
  selected: AspectRatio;
  onSelect: (ratio: AspectRatio) => void;
}

export const AspectRatioPresets: React.FC<AspectRatioPresetsProps> = ({ selected, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {ASPECT_RATIOS.map((ratio) => (
        <button
          key={ratio.label}
          onClick={() => onSelect(ratio)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            selected.label === ratio.label
              ? 'bg-accent-cyan text-bg-surface'
              : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          {ratio.label}
        </button>
      ))}
    </div>
  );
};
