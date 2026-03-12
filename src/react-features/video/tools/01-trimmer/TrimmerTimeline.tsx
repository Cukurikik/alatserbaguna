import React from 'react';

interface Props {
  file: File | null;
}

export function TrimmerTimeline({ file }: Props) {
  if (!file) return null;
  
  return (
    <div className="w-full h-24 bg-bg-surface border border-white/10 rounded-xl flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-accent-cyan to-accent-purple"></div>
      <span className="text-text-muted text-sm z-10">Timeline visualization placeholder</span>
    </div>
  );
}
