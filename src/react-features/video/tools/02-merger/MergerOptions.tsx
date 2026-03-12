import React from 'react';

interface MergerOptionsProps {
  transition: 'none' | 'fade' | 'wipe';
  setTransition: (val: 'none' | 'fade' | 'wipe') => void;
  crossfadeDuration: number;
  setCrossfadeDuration: (val: number) => void;
}

export const MergerOptions: React.FC<MergerOptionsProps> = ({
  transition,
  setTransition,
  crossfadeDuration,
  setCrossfadeDuration,
}) => {
  return (
    <div className="bg-bg-elevated p-6 rounded-2xl border border-white/5 space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">Merge Options</h3>
      
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-secondary">Transition Type</label>
        <div className="grid grid-cols-3 gap-3">
          {(['none', 'fade', 'wipe'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTransition(type)}
              className={`py-2 px-4 rounded-xl border transition-all ${
                transition === type
                  ? 'bg-accent-cyan/10 border-accent-cyan text-accent-cyan'
                  : 'bg-bg border-white/5 text-text-muted hover:bg-white/5'
              }`}
            >
              <span className="capitalize">{type}</span>
            </button>
          ))}
        </div>
      </div>

      {transition !== 'none' && (
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-text-secondary">Transition Duration</label>
            <span className="text-sm text-accent-cyan">{crossfadeDuration}s</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.5"
            value={crossfadeDuration}
            onChange={(e) => setCrossfadeDuration(parseFloat(e.target.value))}
            className="w-full accent-accent-cyan"
          />
        </div>
      )}
    </div>
  );
};
