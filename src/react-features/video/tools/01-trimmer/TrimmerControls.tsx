import React from 'react';

interface Props {
  startTime: number;
  endTime: number;
  onStartTimeChange: (val: number) => void;
  onEndTimeChange: (val: number) => void;
}

export function TrimmerControls({ startTime, endTime, onStartTimeChange, onEndTimeChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-white">Start Time (s)</label>
        <input type="number" value={startTime} onChange={e => onStartTimeChange(Number(e.target.value))} step="0.1" min="0"
               className="bg-bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-white">End Time (s)</label>
        <input type="number" value={endTime} onChange={e => onEndTimeChange(Number(e.target.value))} step="0.1" min="0.1"
               className="bg-bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all" />
      </div>
    </div>
  );
}
