import React, { useState, useRef, useEffect } from 'react';
import { CropOptions, AspectRatio } from './crop.types';

interface CropCanvasProps {
  videoUrl: string;
  videoDimensions: { width: number; height: number };
  aspectRatio: AspectRatio;
  onChange: (options: CropOptions) => void;
}

export const CropCanvas: React.FC<CropCanvasProps> = ({ videoUrl, videoDimensions, aspectRatio, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current || videoDimensions.width === 0) return;
    
    const container = containerRef.current;
    const containerRatio = container.clientWidth / container.clientHeight;
    const videoRatio = videoDimensions.width / videoDimensions.height;
    
    let renderWidth, renderHeight;
    if (containerRatio > videoRatio) {
      renderHeight = container.clientHeight;
      renderWidth = renderHeight * videoRatio;
    } else {
      renderWidth = container.clientWidth;
      renderHeight = renderWidth / videoRatio;
    }

    // Initialize crop box
    let newWidth = renderWidth * 0.8;
    let newHeight = renderHeight * 0.8;

    if (aspectRatio.value) {
      if (newWidth / newHeight > aspectRatio.value) {
        newWidth = newHeight * aspectRatio.value;
      } else {
        newHeight = newWidth / aspectRatio.value;
      }
    }

    const newCrop = {
      x: (renderWidth - newWidth) / 2,
      y: (renderHeight - newHeight) / 2,
      width: newWidth,
      height: newHeight
    };
    
    setCropBox(newCrop);
    updateActualCrop(newCrop, renderWidth, renderHeight);
  }, [videoDimensions, aspectRatio]);

  const updateActualCrop = (box: typeof cropBox, renderW: number, renderH: number) => {
    const scaleX = videoDimensions.width / renderW;
    const scaleY = videoDimensions.height / renderH;
    
    onChange({
      x: Math.round(box.x * scaleX),
      y: Math.round(box.y * scaleY),
      width: Math.round(box.width * scaleX),
      height: Math.round(box.height * scaleY)
    });
  };

  const handleMouseDown = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    e.stopPropagation();
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartCrop({ ...cropBox });
    if (action === 'move') {
      setIsDragging(true);
    } else {
      setIsResizing(action);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    if (!containerRef.current) return;

    const container = containerRef.current;
    const videoRatio = videoDimensions.width / videoDimensions.height;
    const containerRatio = container.clientWidth / container.clientHeight;
    
    let renderWidth, renderHeight;
    if (containerRatio > videoRatio) {
      renderHeight = container.clientHeight;
      renderWidth = renderHeight * videoRatio;
    } else {
      renderWidth = container.clientWidth;
      renderHeight = renderWidth / videoRatio;
    }

    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;

    let newCrop = { ...startCrop };

    if (isDragging) {
      newCrop.x = Math.max(0, Math.min(renderWidth - newCrop.width, startCrop.x + dx));
      newCrop.y = Math.max(0, Math.min(renderHeight - newCrop.height, startCrop.y + dy));
    } else if (isResizing) {
      if (isResizing.includes('e')) newCrop.width = Math.max(20, Math.min(renderWidth - newCrop.x, startCrop.width + dx));
      if (isResizing.includes('s')) newCrop.height = Math.max(20, Math.min(renderHeight - newCrop.y, startCrop.height + dy));
      if (isResizing.includes('w')) {
        const newX = Math.max(0, Math.min(startCrop.x + startCrop.width - 20, startCrop.x + dx));
        newCrop.width = startCrop.width + (startCrop.x - newX);
        newCrop.x = newX;
      }
      if (isResizing.includes('n')) {
        const newY = Math.max(0, Math.min(startCrop.y + startCrop.height - 20, startCrop.y + dy));
        newCrop.height = startCrop.height + (startCrop.y - newY);
        newCrop.y = newY;
      }

      if (aspectRatio.value) {
        // Enforce aspect ratio on resize
        if (isResizing === 'se' || isResizing === 'e' || isResizing === 's') {
           newCrop.height = newCrop.width / aspectRatio.value;
           if (newCrop.y + newCrop.height > renderHeight) {
             newCrop.height = renderHeight - newCrop.y;
             newCrop.width = newCrop.height * aspectRatio.value;
           }
        }
        // Add more complex logic for other corners if needed, keeping it simple for now
      }
    }

    setCropBox(newCrop);
    updateActualCrop(newCrop, renderWidth, renderHeight);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };

  return (
    <div 
      className="relative w-full h-[60vh] bg-black/50 rounded-2xl overflow-hidden flex items-center justify-center"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {videoUrl && (
        <div className="relative" style={{ aspectRatio: `${videoDimensions.width} / ${videoDimensions.height}`, maxHeight: '100%', maxWidth: '100%' }}>
          <video src={videoUrl} className="w-full h-full object-contain pointer-events-none" />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 pointer-events-none" />
          
          {/* Crop Box */}
          <div 
            className="absolute border-2 border-accent-cyan cursor-move"
            style={{
              left: `${(cropBox.x / containerRef.current?.clientWidth!) * 100}%`,
              top: `${(cropBox.y / containerRef.current?.clientHeight!) * 100}%`,
              width: `${(cropBox.width / containerRef.current?.clientWidth!) * 100}%`,
              height: `${(cropBox.height / containerRef.current?.clientHeight!) * 100}%`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)' // Alternative to overlay
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          >
            {/* Handles */}
            <div className="absolute top-0 left-0 w-3 h-3 bg-white border border-accent-cyan -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" onMouseDown={(e) => handleMouseDown(e, 'nw')} />
            <div className="absolute top-0 right-0 w-3 h-3 bg-white border border-accent-cyan translate-x-1/2 -translate-y-1/2 cursor-nesw-resize" onMouseDown={(e) => handleMouseDown(e, 'ne')} />
            <div className="absolute bottom-0 left-0 w-3 h-3 bg-white border border-accent-cyan -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" onMouseDown={(e) => handleMouseDown(e, 'sw')} />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-white border border-accent-cyan translate-x-1/2 translate-y-1/2 cursor-nwse-resize" onMouseDown={(e) => handleMouseDown(e, 'se')} />
          </div>
        </div>
      )}
    </div>
  );
};
