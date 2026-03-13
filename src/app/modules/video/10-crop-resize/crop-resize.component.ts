import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CropResizeStore } from './crop-resize.store';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-crop-resize',
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
          <div class="p-3 bg-indigo-500/20 rounded-xl">
            <lucide-icon name="crop" class="w-8 h-8 text-indigo-400"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Smart Crop & Resize</h1>
            <p class="text-neutral-400 mt-1">Crop, scale, and pad your videos for any platform.</p>
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
                    <lucide-icon name="crop" class="w-4 h-4 text-indigo-400"></lucide-icon>
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
                      <div class="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p class="text-sm text-neutral-400">Analyzing video...</p>
                    </div>
                  } @else if (store.inputFile()) {
                    <app-video-preview [file]="store.inputFile()!"></app-video-preview>
                    
                    <!-- Visual Crop Overlay (Simplified representation) -->
                    @if (store.mode() === 'crop') {
                      <div class="absolute inset-0 pointer-events-none border-2 border-dashed border-indigo-500/50"
                           [style.left.%]="(store.cropRegion().x / store.videoMeta()!.width) * 100"
                           [style.top.%]="(store.cropRegion().y / store.videoMeta()!.height) * 100"
                           [style.width.%]="(store.cropRegion().w / store.videoMeta()!.width) * 100"
                           [style.height.%]="(store.cropRegion().h / store.videoMeta()!.height) * 100">
                        <div class="absolute inset-0 bg-indigo-500/10 backdrop-blur-[1px]"></div>
                      </div>
                    }
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
              <h3 class="text-lg font-medium mb-6">Transformation Settings</h3>
              
              <div class="space-y-6" [class.opacity-50]="!store.inputFile() || store.status() === 'processing'" [class.pointer-events-none]="!store.inputFile() || store.status() === 'processing'">
                
                <!-- Mode Selection -->
                <div class="space-y-3">
                  <span class="text-sm font-medium text-neutral-300">Operation Mode</span>
                  <div class="grid grid-cols-2 gap-2">
                    <button 
                      (click)="setMode('crop')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center space-x-2"
                      [class.bg-indigo-500/20]="store.mode() === 'crop'"
                      [class.border-indigo-500/50]="store.mode() === 'crop'"
                      [class.text-indigo-300]="store.mode() === 'crop'"
                      [class.bg-neutral-800]="store.mode() !== 'crop'"
                      [class.border-neutral-700]="store.mode() !== 'crop'"
                      [class.text-neutral-400]="store.mode() !== 'crop'">
                      <lucide-icon name="crop" class="w-4 h-4"></lucide-icon>
                      <span>Crop</span>
                    </button>
                    <button 
                      (click)="setMode('resize')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center space-x-2"
                      [class.bg-indigo-500/20]="store.mode() === 'resize'"
                      [class.border-indigo-500/50]="store.mode() === 'resize'"
                      [class.text-indigo-300]="store.mode() === 'resize'"
                      [class.bg-neutral-800]="store.mode() !== 'resize'"
                      [class.border-neutral-700]="store.mode() !== 'resize'"
                      [class.text-neutral-400]="store.mode() !== 'resize'">
                      <lucide-icon name="maximize" class="w-4 h-4"></lucide-icon>
                      <span>Resize</span>
                    </button>
                  </div>
                </div>

                @if (store.mode() === 'crop') {
                  <!-- Crop Settings -->
                  <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-2">
                        <label for="crop-w" class="text-xs text-neutral-400">Width (px)</label>
                        <input id="crop-w" type="number" 
                               [ngModel]="store.cropRegion().w" 
                               (ngModelChange)="updateCrop('w', $event)"
                               class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                      </div>
                      <div class="space-y-2">
                        <label for="crop-h" class="text-xs text-neutral-400">Height (px)</label>
                        <input id="crop-h" type="number" 
                               [ngModel]="store.cropRegion().h" 
                               (ngModelChange)="updateCrop('h', $event)"
                               class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                      </div>
                      <div class="space-y-2">
                        <label for="crop-x" class="text-xs text-neutral-400">X Offset</label>
                        <input id="crop-x" type="number" 
                               [ngModel]="store.cropRegion().x" 
                               (ngModelChange)="updateCrop('x', $event)"
                               class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                      </div>
                      <div class="space-y-2">
                        <label for="crop-y" class="text-xs text-neutral-400">Y Offset</label>
                        <input id="crop-y" type="number" 
                               [ngModel]="store.cropRegion().y" 
                               (ngModelChange)="updateCrop('y', $event)"
                               class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                      </div>
                    </div>
                  </div>
                } @else {
                  <!-- Resize Settings -->
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-neutral-300">Target Size</span>
                      <button (click)="toggleLockAspect()" class="text-xs flex items-center space-x-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors" [class.text-indigo-400]="store.lockAspectRatio()" [class.text-neutral-400]="!store.lockAspectRatio()">
                        <lucide-icon [name]="store.lockAspectRatio() ? 'lock' : 'unlock'" class="w-3 h-3"></lucide-icon>
                        <span>Lock Aspect</span>
                      </button>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-2">
                        <label for="resize-w" class="text-xs text-neutral-400">Width (px)</label>
                        <input id="resize-w" type="number" 
                               [ngModel]="store.targetWidth()" 
                               (ngModelChange)="updateResize('w', $event)"
                               class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                      </div>
                      <div class="space-y-2">
                        <label for="resize-h" class="text-xs text-neutral-400">Height (px)</label>
                        <input id="resize-h" type="number" 
                               [ngModel]="store.targetHeight()" 
                               (ngModelChange)="updateResize('h', $event)"
                               class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                      </div>
                    </div>

                    @if (store.lockAspectRatio()) {
                      <div class="space-y-2 pt-2 border-t border-neutral-800">
                        <label for="pad-mode" class="text-xs text-neutral-400">Padding Mode</label>
                        <select id="pad-mode" [ngModel]="store.padMode()" (ngModelChange)="setPadMode($event)" class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                          <option value="pad">Add Black Bars (Pad)</option>
                          <option value="crop-to-fit">Crop to Fit</option>
                          <option value="stretch">Stretch (Ignore Aspect)</option>
                        </select>
                      </div>
                    }

                    <!-- Social Presets -->
                    <div class="space-y-2 pt-2 border-t border-neutral-800">
                      <label for="presets" class="text-xs text-neutral-400">Presets</label>
                      <div id="presets" class="flex flex-wrap gap-2">
                        <button (click)="applyPreset(1080, 1920)" class="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 text-neutral-300">TikTok/Reels</button>
                        <button (click)="applyPreset(1920, 1080)" class="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 text-neutral-300">YouTube 1080p</button>
                        <button (click)="applyPreset(1080, 1080)" class="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 text-neutral-300">IG Square</button>
                      </div>
                    </div>
                  </div>
                }

                <!-- Process Button -->
                <button 
                  (click)="processVideo()"
                  [disabled]="!store.inputFile() || store.status() === 'processing'"
                  class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2">
                  @if (store.status() === 'processing') {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  } @else {
                    <lucide-icon name="crop" class="w-5 h-5"></lucide-icon>
                    <span>Apply Transformation</span>
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
                    <p class="text-sm text-neutral-400 font-medium">Transforming video...</p>
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
                    [filename]="'omni_crop_resize_' + store.inputFile()?.name"
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
export class CropResizeComponent {
  store = inject(CropResizeStore);

  onFileSelected(files: File[]) {
    if (files.length) this.store.loadFile({ file: files[0] });
  }

  setMode(mode: 'crop' | 'resize') {
    this.store.updateConfig({ mode });
  }

  updateCrop(prop: 'x' | 'y' | 'w' | 'h', value: number) {
    const current = this.store.cropRegion();
    this.store.updateConfig({ cropRegion: { ...current, [prop]: value } });
  }

  updateResize(prop: 'w' | 'h', value: number) {
    if (prop === 'w') {
      this.store.updateConfig({ targetWidth: value });
      if (this.store.lockAspectRatio() && this.store.videoMeta()) {
        const aspect = this.store.videoMeta()!.height / this.store.videoMeta()!.width;
        this.store.updateConfig({ targetHeight: Math.round(value * aspect) });
      }
    } else {
      this.store.updateConfig({ targetHeight: value });
      if (this.store.lockAspectRatio() && this.store.videoMeta()) {
        const aspect = this.store.videoMeta()!.width / this.store.videoMeta()!.height;
        this.store.updateConfig({ targetWidth: Math.round(value * aspect) });
      }
    }
  }

  toggleLockAspect() {
    this.store.updateConfig({ lockAspectRatio: !this.store.lockAspectRatio() });
  }

  setPadMode(mode: 'stretch' | 'pad' | 'crop-to-fit') {
    this.store.updateConfig({ padMode: mode });
  }

  applyPreset(w: number, h: number) {
    this.store.updateConfig({ targetWidth: w, targetHeight: h, lockAspectRatio: true, padMode: 'pad' });
  }

  processVideo() {
    this.store.startProcessing();
  }
}
