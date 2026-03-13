import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorCorrectionStore } from './color-correction.store';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule, Palette, RefreshCw, Settings2, Video } from 'lucide-angular';

@Component({
  selector: 'app-color-correction',
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
          <div class="p-3 bg-pink-500/20 rounded-xl">
            <lucide-icon name="palette" class="w-8 h-8 text-pink-400"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Color Correction</h1>
            <p class="text-neutral-400 mt-1">Adjust brightness, contrast, saturation, and gamma.</p>
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
                    <lucide-icon name="video" class="w-4 h-4 text-pink-400"></lucide-icon>
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
                      <div class="w-8 h-8 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
                      <p class="text-sm text-neutral-400">Analyzing video...</p>
                    </div>
                  } @else if (store.inputFile()) {
                    <app-video-preview 
                      [file]="store.inputFile()!"
                      [style.filter]="getPreviewFilter()">
                    </app-video-preview>
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
                <lucide-icon name="settings-2" class="w-5 h-5 text-pink-400"></lucide-icon>
                <span>Color Settings</span>
              </h3>
              
              <div class="space-y-6" [class.opacity-50]="!store.inputFile() || store.status() === 'processing'" [class.pointer-events-none]="!store.inputFile() || store.status() === 'processing'">
                
                <!-- Brightness -->
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <label class="text-sm font-medium text-neutral-300">Brightness</label>
                    <span class="text-xs text-pink-400 font-mono">{{ store.brightness() | number:'1.2-2' }}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-1" max="1" step="0.05"
                    [ngModel]="store.brightness()" 
                    (ngModelChange)="updateConfig('brightness', $event)"
                    class="w-full accent-pink-500">
                  <div class="flex justify-between text-[10px] text-neutral-500">
                    <span>-1.0</span>
                    <span>0.0</span>
                    <span>1.0</span>
                  </div>
                </div>

                <!-- Contrast -->
                <div class="space-y-3 pt-4 border-t border-neutral-800">
                  <div class="flex justify-between items-center">
                    <label class="text-sm font-medium text-neutral-300">Contrast</label>
                    <span class="text-xs text-pink-400 font-mono">{{ store.contrast() | number:'1.2-2' }}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-2" max="2" step="0.1"
                    [ngModel]="store.contrast()" 
                    (ngModelChange)="updateConfig('contrast', $event)"
                    class="w-full accent-pink-500">
                  <div class="flex justify-between text-[10px] text-neutral-500">
                    <span>-2.0</span>
                    <span>1.0</span>
                    <span>2.0</span>
                  </div>
                </div>

                <!-- Saturation -->
                <div class="space-y-3 pt-4 border-t border-neutral-800">
                  <div class="flex justify-between items-center">
                    <label class="text-sm font-medium text-neutral-300">Saturation</label>
                    <span class="text-xs text-pink-400 font-mono">{{ store.saturation() | number:'1.2-2' }}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="3" step="0.1"
                    [ngModel]="store.saturation()" 
                    (ngModelChange)="updateConfig('saturation', $event)"
                    class="w-full accent-pink-500">
                  <div class="flex justify-between text-[10px] text-neutral-500">
                    <span>0.0 (Grayscale)</span>
                    <span>1.0</span>
                    <span>3.0</span>
                  </div>
                </div>

                <!-- Gamma -->
                <div class="space-y-3 pt-4 border-t border-neutral-800">
                  <div class="flex justify-between items-center">
                    <label class="text-sm font-medium text-neutral-300">Gamma</label>
                    <span class="text-xs text-pink-400 font-mono">{{ store.gamma() | number:'1.2-2' }}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" max="10" step="0.1"
                    [ngModel]="store.gamma()" 
                    (ngModelChange)="updateConfig('gamma', $event)"
                    class="w-full accent-pink-500">
                  <div class="flex justify-between text-[10px] text-neutral-500">
                    <span>0.1</span>
                    <span>1.0</span>
                    <span>10.0</span>
                  </div>
                </div>

                <!-- Process Button -->
                <button 
                  (click)="processVideo()"
                  [disabled]="!store.inputFile() || store.status() === 'processing'"
                  class="w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2">
                  @if (store.status() === 'processing') {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Applying Colors...</span>
                  } @else {
                    <lucide-icon name="palette" class="w-5 h-5"></lucide-icon>
                    <span>Apply Color Correction</span>
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
                    <p class="text-sm text-neutral-400 font-medium">Applying color correction...</p>
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
                    [filename]="'omni_color_' + store.inputFile()?.name"
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
export class ColorCorrectionComponent {
  store = inject(ColorCorrectionStore);

  onFileSelected(files: File[]) {
    if (files.length) this.store.loadFile({ file: files[0] });
  }

  updateConfig(key: string, value: any) {
    this.store.updateConfig({ [key]: value });
  }

  processVideo() {
    this.store.startProcessing();
  }

  getPreviewFilter(): string {
    // Approximate FFmpeg eq filter with CSS filters
    // brightness: -1 to 1 -> brightness(0 to 200%)
    // contrast: -2 to 2 -> contrast(0 to 200%)
    // saturation: 0 to 3 -> saturate(0 to 300%)
    // gamma: not directly supported in CSS, but we can approximate or ignore in preview
    
    const b = (this.store.brightness() + 1) * 100;
    const c = Math.max(0, this.store.contrast()) * 100; // CSS contrast doesn't do negative well
    const s = this.store.saturation() * 100;
    
    return `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
  }
}
