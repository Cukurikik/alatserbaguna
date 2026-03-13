import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, signal } from '@angular/core';
import { AudioErrorCode } from '../../types/audio.types';

@Component({
  selector: 'app-audio-drop-zone',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 min-h-[200px]"
      [class]="isDragging() ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]' : 'border-gray-700 bg-gray-900/30 hover:border-gray-600 hover:bg-gray-900/50'"
      (dragover)="onDragOver($event)" (dragleave)="onDragLeave()" (drop)="onDrop($event)"
      (click)="fileInput.click()"
      (keydown.enter)="fileInput.click()"
      (keydown.space)="fileInput.click()"
      tabindex="0"
      role="button"
      aria-label="Drop audio file here or click to browse">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-transform duration-300"
           [class]="isDragging() ? 'scale-110 bg-cyan-500/20' : 'bg-gray-800'">🎵</div>
      <div class="text-center">
        <p class="text-white font-black text-sm tracking-wide">Drop audio file here</p>
        <p class="text-gray-500 text-xs mt-1">or <span class="text-cyan-400 underline">browse files</span></p>
        <p class="text-gray-600 text-xs mt-2">Supports: MP3, WAV, FLAC, OGG, M4A, OPUS, AAC • Max {{ maxSizeMB }} MB</p>
      </div>
      @if (errorMsg()) {
        <p class="absolute bottom-3 text-xs text-red-400 font-medium">⚠ {{ errorMsg() }}</p>
      }
      <input #fileInput type="file" class="hidden" [accept]="accept" [multiple]="multiple"
             (change)="onFileChange($event)">
    </div>
  `
})
export class AudioDropZoneComponent {
  @Input() accept = 'audio/*,video/*';
  @Input() multiple = false;
  @Input() maxSizeMB = 500;
  @Output() fileSelected = new EventEmitter<File[]>();
  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() validationError = new EventEmitter<AudioErrorCode>();
  isDragging = signal(false);
  errorMsg = signal<string | null>(null);

  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging.set(true); }
  onDragLeave() { this.isDragging.set(false); }
  onDrop(e: DragEvent) {
    e.preventDefault(); this.isDragging.set(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    this.validate(files);
  }
  onFileChange(e: Event) {
    const files = (Array.from((e.target as HTMLInputElement).files ?? []) as File[]);
    this.validate(files);
    (e.target as HTMLInputElement).value = '';
  }
  private validate(files: File[]) {
    this.errorMsg.set(null);
    const valid = files.filter(f => {
      if (f.size > this.maxSizeMB * 1024 * 1024) {
        this.errorMsg.set(`${f.name} exceeds ${this.maxSizeMB} MB limit`);
        this.validationError.emit('FILE_TOO_LARGE');
        return false;
      }
      return true;
    });
    if (valid.length) { this.fileSelected.emit(valid); this.filesSelected.emit(valid); }
  }
}
