import React from 'react';

interface BeforeAfterPreviewProps {
  originalFile: File | null;
  compressedFile: File | null;
}

export const BeforeAfterPreview: React.FC<BeforeAfterPreviewProps> = ({ originalFile, compressedFile }) => {
  if (!originalFile || !compressedFile) return null;

  const originalSize = originalFile.size / (1024 * 1024);
  const compressedSize = compressedFile.size / (1024 * 1024);
  const reduction = ((originalSize - compressedSize) / originalSize) * 100;

  return (
    <div className="bg-bg-surface border border-white/5 rounded-3xl p-6 backdrop-blur-xl space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">Compression Result</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-bg-elevated p-4 rounded-xl border border-white/5 space-y-2">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Original Size</p>
          <p className="text-2xl font-bold text-white font-mono">{originalSize.toFixed(2)} MB</p>
        </div>
        
        <div className="bg-accent-cyan/10 p-4 rounded-xl border border-accent-cyan/20 space-y-2">
          <p className="text-xs font-medium text-accent-cyan uppercase tracking-wider">Compressed Size</p>
          <p className="text-2xl font-bold text-accent-cyan font-mono">{compressedSize.toFixed(2)} MB</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-text-secondary">Space Saved</span>
          <span className="text-status-success">-{reduction.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-bg-elevated rounded-full overflow-hidden">
          <div 
            className="h-full bg-status-success transition-all duration-1000 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, reduction))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
