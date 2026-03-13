import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToGifStore } from './to-gif.store';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule } from 'lucide-angular';
import { ToGifConfig } from './to-gif.schema';

@Component({
  selector: 'app-to-gif',
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
            <lucide-icon name="image" class="w-8 h-8 text-indigo-400"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Video to GIF</h1>
            <p class="text-neutral-400 mt-1">Convert video clips into high-quality animated GIFs.</p>
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
                    <lucide-icon name="image" class="w-4 h-4 text-indigo-400"></lucide-icon>
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
                <lucide-icon name="settings-2" class="w-5 h-5 text-indigo-400"></lucide-icon>
                <span>GIF Settings</span>
              </h3>
              
              <div class="space-y-6" [class.opacity-50]="!store.inputFile() || store.status() === 'processing'" [class.pointer-events-none]="!store.inputFile() || store.status() === 'processing'">
                
                <!-- Time Range -->
                <div class="space-y-4">
                  <span class="text-sm font-medium text-neutral-300">Time Range</span>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <label for="start-time" class="text-xs text-neutral-400">Start Time (s)</label>
                      <input id="start-time" type="number" 
                             [ngModel]="store.startTime()" 
                             (ngModelChange)="updateConfig('startTime', $event)"
                             min="0"
                             [max]="store.videoMeta()?.duration || 0"
                             step="0.1"
                             class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                    </div>
                    <div class="space-y-2">
                      <label for="duration" class="text-xs text-neutral-400">Duration (s)</label>
                      <input id="duration" type="number" 
                             [ngModel]="store.duration()" 
                             (ngModelChange)="updateConfig('duration', $event)"
                             min="0.1"
                             max="60"
                             step="0.1"
                             class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                    </div>
                  </div>
                  <p class="text-[10px] text-neutral-500">Max duration is 60 seconds to prevent massive file sizes.</p>
                </div>

                <!-- Quality Settings -->
                <div class="space-y-4 pt-4 border-t border-neutral-800">
                  <span class="text-sm font-medium text-neutral-300">Quality & Size</span>
                  
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <label for="resolution" class="text-xs text-neutral-400">Resolution (Width)</label>
                      <span class="text-xs text-indigo-400">{{ store.scale() }}px</span>
                    </div>
                    <input id="resolution" type="range" 
                           [ngModel]="store.scale()" 
                           (ngModelChange)="updateConfig('scale', $event)"
                           min="160" max="1080" step="10"
                           class="w-full accent-indigo-500">
                  </div>

                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <label for="fps" class="text-xs text-neutral-400">Frame Rate</label>
                      <span class="text-xs text-indigo-400">{{ store.fps() }} FPS</span>
                    </div>
                    <input id="fps" type="range" 
                           [ngModel]="store.fps()" 
                           (ngModelChange)="updateConfig('fps', $event)"
                           min="1" max="30" step="1"
                           class="w-full accent-indigo-500">
                  </div>
                </div>

                <!-- Advanced Settings -->
                <div class="space-y-4 pt-4 border-t border-neutral-800">
                  <span class="text-sm font-medium text-neutral-300">Advanced</span>
                  
                  <div class="space-y-2">
                    <label for="dither-algo" class="text-xs text-neutral-400">Dithering Algorithm</label>
                    <select id="dither-algo" [ngModel]="store.dither()" (ngModelChange)="updateConfig('dither', $event)" class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                      <option value="bayer">Bayer (Balanced)</option>
                      <option value="floyd_steinberg">Floyd-Steinberg (High Quality)</option>
                      <option value="sierra2_4a">Sierra2-4A (Fast)</option>
                      <option value="none">None (Banding)</option>
                    </select>
                  </div>
                </div>

                <!-- Process Button -->
                <button 
                  (click)="processVideo()"
                  [disabled]="!store.inputFile() || store.status() === 'processing'"
                  class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2">
                  @if (store.status() === 'processing') {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Generating GIF...</span>
                  } @else {
                    <lucide-icon name="image" class="w-5 h-5"></lucide-icon>
                    <span>Create GIF</span>
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
                    <p class="text-sm text-neutral-400 font-medium">Generating high-quality GIF...</p>
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
                    [filename]="'omni_gif_' + (store.inputFile()?.name?.split('.')?.[0] || 'video') + '.gif'"
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
export class ToGifComponent {
  store = inject(ToGifStore);

  onFileSelected(files: File[]) {
    if (files.length) this.store.loadFile({ file: files[0] });
  }

  updateConfig(key: keyof ToGifConfig, value: string | number) {
    this.store.updateConfig({ [key]: value });
  }

  processVideo() {
    this.store.startProcessing();
  }
}
