import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

interface SortableItemProps {
  id: string;
  file: File;
  onRemove: (id: string) => void;
}

function SortableItem({ id, file, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-bg-elevated p-3 rounded-xl border border-white/5 mb-2"
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:text-accent-cyan p-1">
        <GripVertical size={20} className="text-text-muted" />
      </div>
      <div className="flex-1 truncate">
        <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
        <p className="text-xs text-text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-status-error transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

interface MergerFileListProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export const MergerFileList: React.FC<MergerFileListProps> = ({ files, onFilesChange }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.name === active.id);
      const newIndex = files.findIndex((f) => f.name === over.id);
      onFilesChange(arrayMove(files, oldIndex, newIndex));
    }
  };

  const handleRemove = (id: string) => {
    onFilesChange(files.filter((f) => f.name !== id));
  };

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={files.map((f) => f.name)}
          strategy={verticalListSortingStrategy}
        >
          {files.map((file) => (
            <SortableItem key={file.name} id={file.name} file={file} onRemove={handleRemove} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
