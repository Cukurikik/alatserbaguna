import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeResolutionStore } from './change-resolution.store';
import { ChangeResolutionConfig } from './change-resolution.schema';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule, Monitor, RefreshCw, Settings2, Maximize } from 'lucide-angular';

@Component({
  selector: 'app-change-resolution',
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
          <div class="p-3 bg-emerald-500/20 rounded-xl">
            <lucide-icon name="monitor" class="w-8 h-8 text-emerald-400"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Change Resolution</h1>
            <p class="text-neutral-400 mt-1">Resize your video to fit any screen or platform.</p>
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
                    <lucide-icon name="monitor" class="w-4 h-4 text-emerald-400"></lucide-icon>
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
                      <div class="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
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
            }
          </div>

          <!-- Right Column: Controls -->
          <div class="space-y-6">
            <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
              <h3 class="text-lg font-medium mb-6 flex items-center space-x-2">
                <lucide-icon name="settings-2" class="w-5 h-5 text-emerald-400"></lucide-icon>
                <span>Resolution Settings</span>
              </h3>
              
              <div class="space-y-6" [class.opacity-50]="!store.inputFile() || store.status() === 'processing'" [class.pointer-events-none]="!store.inputFile() || store.status() === 'processing'">
                
                <!-- Presets -->
                <div class="space-y-3">
                  <label class="text-sm font-medium text-neutral-300">Common Presets</label>
                  <div class="grid grid-cols-2 gap-2">
                    <button 
                      (click)="applyPreset(3840, 2160)"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-emerald-500/50 hover:text-emerald-400">
                      4K (2160p)
                    </button>
                    <button 
                      (click)="applyPreset(1920, 1080)"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-emerald-500/50 hover:text-emerald-400">
                      FHD (1080p)
                    </button>
                    <button 
                      (click)="applyPreset(1280, 720)"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-emerald-500/50 hover:text-emerald-400">
                      HD (720p)
                    </button>
                    <button 
                      (click)="applyPreset(1080, 1920)"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-emerald-500/50 hover:text-emerald-400">
                      Vertical (9:16)
                    </button>
                    <button 
                      (click)="applyPreset(1080, 1080)"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-emerald-500/50 hover:text-emerald-400">
                      Square (1:1)
                    </button>
                    <button 
                      (click)="applyPreset(854, 480)"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-emerald-500/50 hover:text-emerald-400">
                      SD (480p)
                    </button>
                  </div>
                </div>

                <!-- Custom Dimensions -->
                <div class="space-y-4 pt-4 border-t border-neutral-800">
                  <label class="text-sm font-medium text-neutral-300">Custom Dimensions</label>
                  
                  <div class="flex items-center space-x-4">
                    <div class="flex-1 space-y-1">
                      <label class="text-xs text-neutral-500">Width</label>
                      <input 
                        type="number" 
                        [ngModel]="store.width()" 
                        (ngModelChange)="onWidthChange($event)"
                        class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
                    </div>
                    <div class="flex-1 space-y-1">
                      <label class="text-xs text-neutral-500">Height</label>
                      <input 
                        type="number" 
                        [ngModel]="store.height()" 
                        (ngModelChange)="onHeightChange($event)"
                        class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
                    </div>
                  </div>

                  <label class="flex items-center space-x-3 cursor-pointer group">
                    <div class="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        [ngModel]="store.maintainAspectRatio()" 
                        (ngModelChange)="updateConfig('maintainAspectRatio', $event)"
                        class="peer sr-only">
                      <div class="w-5 h-5 rounded border border-neutral-600 bg-neutral-900 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors"></div>
                      <lucide-icon name="check" class="w-3 h-3 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity"></lucide-icon>
                    </div>
                    <span class="text-sm text-neutral-300 group-hover:text-white transition-colors">Maintain aspect ratio (pad if needed)</span>
                  </label>
                </div>

                <!-- Process Button -->
                <button 
                  (click)="processVideo()"
                  [disabled]="!store.inputFile() || store.status() === 'processing'"
                  class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2">
                  @if (store.status() === 'processing') {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  } @else {
                    <lucide-icon name="maximize" class="w-5 h-5"></lucide-icon>
                    <span>Resize Video</span>
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
                    <p class="text-sm text-neutral-400 font-medium">Resizing video...</p>
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
                    [filename]="'omni_res_' + store.inputFile()?.name"
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
export class ChangeResolutionComponent {
  store = inject(ChangeResolutionStore);

  onFileSelected(files: File[]) {
    if (files.length) this.store.loadFile({ file: files[0] });
  }

  updateConfig(key: keyof ChangeResolutionConfig, value: string | number | boolean) {
    this.store.updateConfig({ [key]: value });
  }

  applyPreset(width: number, height: number) {
    this.store.updateConfig({ width, height });
  }

  onWidthChange(width: number) {
    if (this.store.maintainAspectRatio() && this.store.videoMeta()) {
      const ratio = this.store.videoMeta()!.height / this.store.videoMeta()!.width;
      const height = Math.round((width * ratio) / 2) * 2; // Ensure even
      this.store.updateConfig({ width, height });
    } else {
      this.store.updateConfig({ width });
    }
  }

  onHeightChange(height: number) {
    if (this.store.maintainAspectRatio() && this.store.videoMeta()) {
      const ratio = this.store.videoMeta()!.width / this.store.videoMeta()!.height;
      const width = Math.round((height * ratio) / 2) * 2; // Ensure even
      this.store.updateConfig({ width, height });
    } else {
      this.store.updateConfig({ height });
    }
  }

  processVideo() {
    this.store.startProcessing();
  }
}
