import { Component, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-file-drop-zone',
  standalone: true,
  template: `
    <div 
      class="border-2 border-dashed border-gray-600 hover:border-cyan-400 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-gray-800 bg-opacity-50 group hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
      (drop)="onDrop($event)"
      (dragover)="onDragOver($event)"
      (click)="fileInput.click()">
      
      <div class="w-16 h-16 rounded-full bg-gray-700 bg-opacity-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      <span class="text-white font-medium text-lg">Drop video here or click to browse</span>
      <span class="text-gray-400 text-sm mt-2">Supports MP4, WebM, MOV, AVI</span>
      
      <input #fileInput type="file" [accept]="accept" class="hidden" (change)="onFileSelected($event)">
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileDropZoneComponent {
  accept = 'video/*';
  @Output() fileDropped = new EventEmitter<File>();

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      this.fileDropped.emit(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.fileDropped.emit(input.files[0]);
    }
  }
}
