
import { Component, EventEmitter, Output, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-audio-drop-zone',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <div
      class="relative flex flex-col items-center justify-center w-full min-h-64 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer group"
      [ngClass]="dragOver ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]' : 'border-gray-700 hover:border-gray-600 bg-gray-900/20'"
      (dragover)="onDragOver($event)"
      (dragleave)="dragOver = false"
      (drop)="onDrop($event)"
      (click)="fileInput.click()">
      <div class="flex flex-col items-center gap-4 p-12">
        <div class="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
        </div>
        <div class="text-center">
          <p class="text-white font-black text-lg">Drop Audio File Here</p>
          <p class="text-gray-500 text-sm mt-1">or click to browse</p>
          <p class="text-gray-600 text-xs mt-2">MP3, WAV, FLAC, OGG, AAC, M4A, OPUS, WebM — Max 500 MB</p>
        </div>
      </div>
      <input #fileInput type="file" class="hidden" [accept]="accept" [multiple]="multiple" (change)="onFileInput($event)">
    </div>
  `,
})
export class AudioDropZoneComponent {
  @Input() accept = 'audio/*,video/mp4,video/webm';
  @Input() multiple = false;
  @Input() maxSizeMB = 500;
  @Output() filesSelected = new EventEmitter<File[]>();

  dragOver = false;

  private allowedTypes = ['audio/mpeg','audio/wav','audio/flac','audio/ogg','audio/aac','audio/opus','audio/mp4','audio/webm','video/mp4','video/webm'];

  onDragOver(e: DragEvent): void { e.preventDefault(); this.dragOver = true; }

  onDrop(e: DragEvent): void {
    e.preventDefault(); this.dragOver = false;
    const files = Array.from(e.dataTransfer?.files ?? []).filter(f => this.validate(f));
    if (files.length) this.filesSelected.emit(files);
  }

  onFileInput(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []).filter(f => this.validate(f));
    if (files.length) this.filesSelected.emit(files);
  }

  private validate(f: File): boolean {
    return f.size <= this.maxSizeMB * 1024 * 1024 && (this.allowedTypes.includes(f.type) || f.type.startsWith('audio/'));
  }
}
