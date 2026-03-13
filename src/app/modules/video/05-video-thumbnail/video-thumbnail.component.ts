import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoThumbnailStore } from './video-thumbnail.store';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-video-thumbnail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FileDropZoneComponent,
    VideoPreviewComponent,
    ProgressRingComponent,
    ExportPanelComponent,
    LucideAngularModule
  ],
  template: `
    <div class="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div class="max-w-6xl mx-auto space-y-8">
        <!-- Header -->
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-amber-500/20 rounded-xl">
            <lucide-icon name="camera" class="w-8 h-8 text-amber-400"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Video Thumbnail</h1>
            <p class="text-neutral-400 mt-1">Extract a high-quality frame from your video at a specific timestamp.</p>
          </div>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Left Column: Input & Preview -->
          <div class="lg:col-span-2 space-y-6">
            @if (!store.inputFile()) {
              <app-file-drop-zone
                accept="video/*"
                title="Drop video here"
                subtitle="Supports MP4, WebM, MOV up to 2GB"
                (filesSelected)="onFileSelected($event)">
              </app-file-drop-zone>
            } @else {
              <div class="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                <div class="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                  <h3 class="font-medium flex items-center space-x-2">
                    <lucide-icon name="video" class="w-4 h-4 text-amber-400"></lucide-icon>
                    <span>Original Video</span>
                  </h3>
                  <button (click)="store.resetState()" class="text-xs text-neutral-400 hover:text-white transition-colors flex items-center space-x-1 bg-neutral-800 px-2 py-1 rounded-md">
                    <lucide-icon name="refresh-cw" class="w-3 h-3"></lucide-icon>
                    <span>Change File</span>
                  </button>
                </div>
                
                <div class="relative aspect-video bg-black flex items-center justify-center">
                  @if (store.status() === 'loading') {
                    <div class="flex flex-col items-center space-y-4">
                      <div class="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                      <p class="text-sm text-neutral-400">Analyzing video...</p>
                    </div>
                  } @else if (store.inputFile()) {
                    <app-video-preview [file]="store.inputFile()!"></app-video-preview>
                  }
                </div>
                
                @if (store.videoMeta()) {
                  <div class="p-4 bg-neutral-900/50 text-xs text-neutral-400 flex justify-between">
                    <span>{{ store.videoMeta()!.width }}x{{ store.videoMeta()!.height }}</span>
                    <span>{{ store.videoMeta()!.duration | number:'1.1-1' }}s</span>
                    <span>{{ store.videoMeta()!.fps }} FPS</span>
                  </div>
                }
              </div>

              @if (store.status() === 'done' && store.outputBlob()) {
                <div class="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl p-4">
                  <h3 class="text-sm font-medium text-neutral-400 mb-4 flex items-center space-x-2">
                    <lucide-icon name="image" class="w-4 h-4"></lucide-icon>
                    <span>Extracted Thumbnail</span>
                  </h3>
                  <div class="relative rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
                    <img [src]="thumbnailUrl" class="w-full h-auto" alt="Extracted Thumbnail">
                  </div>
                </div>
              }
            }
          </div>

          <!-- Right Column: Controls -->
          <div class="space-y-6">
            <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
              <h3 class="text-lg font-medium mb-6 flex items-center space-x-2">
                <lucide-icon name="settings-2" class="w-5 h-5 text-amber-400"></lucide-icon>
                <span>Thumbnail Settings</span>
              </h3>
              
              <div class="space-y-6" [class.opacity-50]="!store.inputFile() || store.status() === 'processing'" [class.pointer-events-none]="!store.inputFile() || store.status() === 'processing'">
                
                <!-- Timestamp -->
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <label for="timestamp-range" class="text-sm font-medium text-neutral-300">Timestamp</label>
                    <span class="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md">
                      {{ store.timestamp() | number:'1.2-2' }}s
                    </span>
                  </div>
                  <input 
                    id="timestamp-range"
                    type="range" 
                    [ngModel]="store.timestamp()" 
                    (ngModelChange)="updateConfig('timestamp', $event)"
                    [min]="0" 
                    [max]="store.videoMeta()?.duration || 0" 
                    step="0.01"
                    class="w-full accent-amber-500 bg-neutral-800 rounded-lg appearance-none h-2 cursor-pointer">
                  <div class="flex justify-between text-xs text-neutral-500">
                    <span>Start</span>
                    <span>End</span>
                  </div>
                </div>

                <!-- Format -->
                <div class="space-y-3 pt-4 border-t border-neutral-800">
                  <span class="text-sm font-medium text-neutral-300 block">Output Format</span>
                  <div class="grid grid-cols-3 gap-2">
                    @for (fmt of ['jpeg', 'png', 'webp']; track fmt) {
                      <button 
                        (click)="updateConfig('format', fmt)"
                        [class.bg-amber-500]="store.format() === fmt"
                        [class.text-white]="store.format() === fmt"
                        [class.bg-neutral-800]="store.format() !== fmt"
                        [class.text-neutral-400]="store.format() !== fmt"
                        class="py-2 rounded-lg text-xs font-medium transition-all uppercase tracking-wider">
                        {{ fmt }}
                      </button>
                    }
                  </div>
                </div>

                <!-- Quality -->
                <div class="space-y-3 pt-4 border-t border-neutral-800">
                  <div class="flex justify-between items-center">
                    <label for="quality-range" class="text-sm font-medium text-neutral-300">Quality (qscale)</label>
                    <span class="text-xs text-neutral-500">{{ store.quality() }}</span>
                  </div>
                  <input 
                    id="quality-range"
                    type="range" 
                    [ngModel]="store.quality()" 
                    (ngModelChange)="updateConfig('quality', $event)"
                    min="1" max="31" step="1"
                    class="w-full accent-amber-500 bg-neutral-800 rounded-lg appearance-none h-2 cursor-pointer">
                  <p class="text-[10px] text-neutral-500">Lower is better quality (1-31).</p>
                </div>

                <!-- Process Button -->
                <button 
                  (click)="processVideo()"
                  [disabled]="!store.inputFile() || store.status() === 'processing'"
                  class="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2">
                  @if (store.status() === 'processing') {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Extracting...</span>
                  } @else {
                    <lucide-icon name="camera" class="w-5 h-5"></lucide-icon>
                    <span>Capture Frame</span>
                  }
                </button>
              </div>
            </div>

            <!-- Progress & Export -->
            @if (store.status() === 'processing' || store.status() === 'done' || store.status() === 'error') {
              <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                @if (store.status() === 'processing') {
                  <div class="flex flex-col items-center justify-center py-6 space-y-4">
                    <app-progress-ring [progress]="store.progress()"></app-progress-ring>
                    <p class="text-sm text-neutral-400 font-medium">Extracting frame...</p>
                  </div>
                }
                
                @if (store.status() === 'error') {
                  <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center space-y-2">
                    <p class="text-red-400 font-medium">{{ store.errorMessage() }}</p>
                    @if (store.retryable()) {
                      <button (click)="processVideo()" class="text-sm text-red-300 hover:text-red-200 underline">Try Again</button>
                    }
                  </div>
                }

                @if (store.status() === 'done' && store.outputBlob()) {
                  <app-export-panel
                    [blob]="store.outputBlob()!"
                    [filename]="'thumbnail_' + store.inputFile()?.name + '.' + store.format()"
                    [sizeMB]="store.outputSizeMB()!">
                  </app-export-panel>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class VideoThumbnailComponent {
  store = inject(VideoThumbnailStore);
  thumbnailUrl: string | null = null;

  onFileSelected(files: File[]) {
    if (files.length) this.store.loadFile({ file: files[0] });
  }

  updateConfig(key: string, value: string | number) {
    this.store.updateConfig({ [key]: value } as Partial<VideoThumbnailConfig>);
  }

  processVideo() {
    this.store.startProcessing();
    // Watch for output to update local preview
    const checkOutput = setInterval(() => {
      if (this.store.status() === 'done' && this.store.outputBlob()) {
        if (this.thumbnailUrl) URL.revokeObjectURL(this.thumbnailUrl);
        this.thumbnailUrl = URL.createObjectURL(this.store.outputBlob()!);
        clearInterval(checkOutput);
      } else if (this.store.status() !== 'processing') {
        clearInterval(checkOutput);
      }
    }, 100);
  }
}
