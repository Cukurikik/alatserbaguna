import React from 'react';
import { useCrop } from './useCrop';
import { AspectRatioPresets } from './AspectRatioPresets';
import { CropCanvas } from './CropCanvas';

export const CropPage: React.FC = () => {
  const {
    file,
    videoUrl,
    cropOptions,
    setCropOptions,
    aspectRatio,
    setAspectRatio,
    videoDimensions,
    handleFileSelect,
    processCrop,
  } = useCrop();

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Smart Crop</h2>
          <p className="text-text-secondary">Crop your video to any aspect ratio or custom dimensions.</p>
        </div>
        
        {file && (
          <button
            onClick={processCrop}
            className="px-6 py-2.5 rounded-xl bg-accent-cyan text-bg-surface font-bold hover:bg-accent-cyan/90 transition-all hover:scale-105 active:scale-95 shadow-glow"
          >
            Apply Crop
          </button>
        )}
      </div>

      {!file ? (
        <div className="w-full h-64 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
          <input
            type="file"
            accept="video/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
            id="video-upload"
          />
          <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center">
            <span className="text-4xl mb-4">📐</span>
            <span className="text-white font-medium">Click to select video</span>
            <span className="text-text-muted text-sm mt-1">MP4, WebM, MOV supported</span>
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-4">
            {videoUrl && (
              <CropCanvas
                videoUrl={videoUrl}
                videoDimensions={videoDimensions}
                aspectRatio={aspectRatio}
                onChange={setCropOptions}
              />
            )}
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Aspect Ratio</h3>
              <AspectRatioPresets
                selected={aspectRatio}
                onSelect={setAspectRatio}
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Dimensions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wider">Width</label>
                  <input
                    type="number"
                    value={cropOptions.width}
                    onChange={(e) => setCropOptions({ ...cropOptions, width: Number(e.target.value) })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent-cyan/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wider">Height</label>
                  <input
                    type="number"
                    value={cropOptions.height}
                    onChange={(e) => setCropOptions({ ...cropOptions, height: Number(e.target.value) })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent-cyan/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wider">X Offset</label>
                  <input
                    type="number"
                    value={cropOptions.x}
                    onChange={(e) => setCropOptions({ ...cropOptions, x: Number(e.target.value) })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent-cyan/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wider">Y Offset</label>
                  <input
                    type="number"
                    value={cropOptions.y}
                    onChange={(e) => setCropOptions({ ...cropOptions, y: Number(e.target.value) })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent-cyan/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
