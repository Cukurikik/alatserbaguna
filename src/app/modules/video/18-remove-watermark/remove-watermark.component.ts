import { Component, inject, type OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RemoveWatermarkStore } from './remove-watermark.store';
import { RemoveWatermarkConfig } from './remove-watermark.schema';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule, Eraser, RefreshCw, Settings2, Sparkles } from 'lucide-angular';

@Component({
  selector: 'app-remove-watermark',
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
          <div class="p-3 bg-fuchsia-500/20 rounded-xl">
            <lucide-icon name="eraser" class="w-8 h-8 text-fuchsia-400"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Remove Watermark</h1>
            <p class="text-neutral-400 mt-1">Blur out logos or watermarks from your video.</p>
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
                    <lucide-icon name="eraser" class="w-4 h-4 text-fuchsia-400"></lucide-icon>
                    <span>Original Video</span>
                  </h3>
                  <button (click)="store.resetState()" class="text-xs text-neutral-400 hover:text-white transition-colors flex items-center space-x-1 bg-neutral-800 px-2 py-1 rounded-md">
                    <lucide-icon name="refresh-cw" class="w-3 h-3"></lucide-icon>
                    <span>Change File</span>
                  </button>
                </div>
                
                <div class="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  @if (store.status() === 'loading') {
                    <div class="flex flex-col items-center space-y-4">
                      <div class="w-8 h-8 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin"></div>
                      <p class="text-sm text-neutral-400">Analyzing video...</p>
                    </div>
                  } @else if (store.inputFile()) {
                    <app-video-preview [file]="store.inputFile()!"></app-video-preview>
                    
                    <!-- Overlay Box for Watermark Region -->
                    <div 
                      class="absolute border-2 border-fuchsia-500 bg-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.5)] pointer-events-none"
                      [style.left.%]="(store.x() / store.videoMeta()!.width) * 100"
                      [style.top.%]="(store.y() / store.videoMeta()!.height) * 100"
                      [style.width.%]="(store.width() / store.videoMeta()!.width) * 100"
                      [style.height.%]="(store.height() / store.videoMeta()!.height) * 100">
                    </div>
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
            }
          </div>

          <!-- Right Column: Controls -->
          <div class="space-y-6">
            <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
              <h3 class="text-lg font-medium mb-6 flex items-center space-x-2">
                <lucide-icon name="settings-2" class="w-5 h-5 text-fuchsia-400"></lucide-icon>
                <span>Blur Settings</span>
              </h3>
              
              <div class="space-y-6" [class.opacity-50]="!store.inputFile() || store.status() === 'processing'" [class.pointer-events-none]="!store.inputFile() || store.status() === 'processing'">
                
                <!-- X Position -->
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <label for="x-pos" class="text-sm font-medium text-neutral-300">X Position</label>
                    <span class="text-xs text-fuchsia-400 font-mono">{{ store.x() }}px</span>
                  </div>
                  <input 
                    id="x-pos"
                    type="range" 
                    min="0" [max]="store.videoMeta()?.width || 1920" 
                    [ngModel]="store.x()" 
                    (ngModelChange)="updateConfig('x', $event)"
                    class="w-full accent-fuchsia-500">
                </div>

                <!-- Y Position -->
                <div class="space-y-3 pt-4 border-t border-neutral-800">
                  <div class="flex justify-between items-center">
                    <label for="y-pos" class="text-sm font-medium text-neutral-300">Y Position</label>
                    <span class="text-xs text-fuchsia-400 font-mono">{{ store.y() }}px</span>
                  </div>
                  <input 
                    id="y-pos"
                    type="range" 
                    min="0" [max]="store.videoMeta()?.height || 1080" 
                    [ngModel]="store.y()" 
                    (ngModelChange)="updateConfig('y', $event)"
                    class="w-full accent-fuchsia-500">
                </div>

                <!-- Width -->
                <div class="space-y-3 pt-4 border-t border-neutral-800">
                  <div class="flex justify-between items-center">
                    <label for="width-pos" class="text-sm font-medium text-neutral-300">Width</label>
                    <span class="text-xs text-fuchsia-400 font-mono">{{ store.width() }}px</span>
                  </div>
                  <input 
                    id="width-pos"
                    type="range" 
                    min="10" [max]="store.videoMeta()?.width || 1920" 
                    [ngModel]="store.width()" 
                    (ngModelChange)="updateConfig('width', $event)"
                    class="w-full accent-fuchsia-500">
                </div>

                <!-- Height -->
                <div class="space-y-3 pt-4 border-t border-neutral-800">
                  <div class="flex justify-between items-center">
                    <label for="height-pos" class="text-sm font-medium text-neutral-300">Height</label>
                    <span class="text-xs text-fuchsia-400 font-mono">{{ store.height() }}px</span>
                  </div>
                  <input 
                    id="height-pos"
                    type="range" 
                    min="10" [max]="store.videoMeta()?.height || 1080" 
                    [ngModel]="store.height()" 
                    (ngModelChange)="updateConfig('height', $event)"
                    class="w-full accent-fuchsia-500">
                </div>

                <!-- Blur Strength -->
                <div class="space-y-3 pt-4 border-t border-neutral-800">
                  <div class="flex justify-between items-center">
                    <label for="blur-strength" class="text-sm font-medium text-neutral-300">Blur Strength</label>
                    <span class="text-xs text-fuchsia-400 font-mono">{{ store.blurStrength() }}</span>
                  </div>
                  <input 
                    id="blur-strength"
                    type="range" 
                    min="1" max="50" 
                    [ngModel]="store.blurStrength()" 
                    (ngModelChange)="updateConfig('blurStrength', $event)"
                    class="w-full accent-fuchsia-500">
                </div>

                <!-- Process Button -->
                <button 
                  (click)="processVideo()"
                  [disabled]="!store.inputFile() || store.status() === 'processing'"
                  class="w-full py-3 px-4 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2">
                  @if (store.status() === 'processing') {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  } @else {
                    <lucide-icon name="sparkles" class="w-5 h-5"></lucide-icon>
                    <span>Blur Region</span>
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
                    <p class="text-sm text-neutral-400 font-medium">Blurring watermark...</p>
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
                    [filename]="'omni_nowatermark_' + store.inputFile()?.name"
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
export class RemoveWatermarkComponent {
  store = inject(RemoveWatermarkStore);

  onFileSelected(files: File[]) {
    if (files.length) this.store.loadFile({ file: files[0] });
  }

  updateConfig(key: keyof RemoveWatermarkConfig, value: number) {
    this.store.updateConfig({ [key]: value });
  }

  processVideo() {
    this.store.startProcessing();
  }
}
