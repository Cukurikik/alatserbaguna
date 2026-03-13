import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoErrorCode } from '../../errors/video.errors';
import { LucideAngularModule, UploadCloud } from 'lucide-angular';

@Component({
  selector: 'app-file-drop-zone',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200"
      [class.scale-105]="isDragOver()"
      [class.border-cyan-400]="isDragOver()"
      [class.bg-cyan-400/5]="isDragOver()"
      [class.border-gray-600]="!isDragOver() && !hasError() && !hasFile()"
      [class.border-red-500]="hasError()"
      [class.border-green-500]="hasFile()"
      [class.opacity-50]="disabled"
      [class.pointer-events-none]="disabled"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
      (keydown.enter)="fileInput.click()"
      (keydown.space)="fileInput.click()"
      tabindex="0"
      role="button"
    >
      <input
        #fileInput
        type="file"
        class="hidden"
        [accept]="accept"
        [multiple]="multiple"
        (change)="onFileSelected($event)"
      />
      
      <lucide-icon [img]="UploadCloud" class="w-12 h-12 mb-4 text-gray-400" [class.text-cyan-400]="isDragOver()"></lucide-icon>
      
      <p class="mb-2 text-sm text-gray-400" [class.text-red-400]="hasError()">
        <span class="font-semibold">{{ hasError() ? 'Invalid file' : label }}</span>
      </p>
      
      @if (hasFile() && !multiple && selectedFiles().length > 0) {
        <div class="mt-4 px-4 py-2 bg-gray-800 rounded-full flex items-center gap-2">
          <span class="text-sm text-gray-200 truncate max-w-[200px]">{{ selectedFiles()[0].name }}</span>
          <span class="text-xs text-gray-500">{{ (selectedFiles()[0].size / 1024 / 1024).toFixed(2) }} MB</span>
        </div>
      }
    </div>
  `
})
export class FileDropZoneComponent {
  @Input() accept = 'video/*';
  @Input() multiple = false;
  @Input() maxSizeMB = 2048;
  @Input() disabled = false;
  @Input() label = 'Drop video file here or click to browse';

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() validationError = new EventEmitter<VideoErrorCode>();

  isDragOver = signal(false);
  isValidating = signal(false);
  hasError = signal(false);
  hasFile = signal(false);
  selectedFiles = signal<File[]>([]);

  readonly UploadCloud = UploadCloud;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled) {
      this.isDragOver.set(true);
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    
    if (this.disabled) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
    }
    // Reset input value so the same file can be selected again if needed
    input.value = '';
  }

  private handleFiles(files: File[]) {
    this.isValidating.set(true);
    this.hasError.set(false);

    const validFiles: File[] = [];
    let error: VideoErrorCode | null = null;

    for (const file of files) {
      // Check MIME type
      if (this.accept === 'video/*' && !file.type.startsWith('video/')) {
        error = 'INVALID_FILE_TYPE';
        break;
      }

      // Check size
      if (file.size > this.maxSizeMB * 1024 * 1024) {
        error = 'FILE_TOO_LARGE';
        break;
      }

      validFiles.push(file);
    }

    this.isValidating.set(false);

    if (error) {
      this.hasError.set(true);
      this.hasFile.set(false);
      this.selectedFiles.set([]);
      this.validationError.emit(error);
    } else if (validFiles.length > 0) {
      const filesToEmit = this.multiple ? validFiles : [validFiles[0]];
      this.hasFile.set(true);
      this.selectedFiles.set(filesToEmit);
      this.filesSelected.emit(filesToEmit);
    }
  }
}

