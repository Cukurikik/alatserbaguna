import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToImagesStore } from './to-images.store';
import { ToImagesConfig } from './to-images.schema';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule, Image as ImageIcon, RefreshCw, Settings2, Images } from 'lucide-angular';

@Component({
  selector: 'app-to-images',
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
            <lucide-icon name="images" class="w-8 h-8 text-emerald-400"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Video to Images</h1>
            <p class="text-neutral-400 mt-1">Extract frames from your video as an image sequence (ZIP).</p>
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
                    <lucide-icon name="images" class="w-4 h-4 text-emerald-400"></lucide-icon>
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
                <span>Extraction Settings</span>
              </h3>
              
              <div class="space-y-6" [class.opacity-50]="!store.inputFile() || store.status() === 'processing'" [class.pointer-events-none]="!store.inputFile() || store.status() === 'processing'">
                
                <!-- Format Selection -->
                <div class="space-y-3">
                  <label class="text-sm font-medium text-neutral-300">Image Format</label>
                  <div class="grid grid-cols-2 gap-2">
                    <button 
                      (click)="updateConfig('format', 'jpg')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-emerald-500/20]="store.format() === 'jpg'"
                      [class.border-emerald-500/50]="store.format() === 'jpg'"
                      [class.text-emerald-300]="store.format() === 'jpg'"
                      [class.bg-neutral-800]="store.format() !== 'jpg'"
                      [class.border-neutral-700]="store.format() !== 'jpg'"
                      [class.text-neutral-400]="store.format() !== 'jpg'">
                      JPG (Smaller)
                    </button>
                    <button 
                      (click)="updateConfig('format', 'png')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-emerald-500/20]="store.format() === 'png'"
                      [class.border-emerald-500/50]="store.format() === 'png'"
                      [class.text-emerald-300]="store.format() === 'png'"
                      [class.bg-neutral-800]="store.format() !== 'png'"
                      [class.border-neutral-700]="store.format() !== 'png'"
                      [class.text-neutral-400]="store.format() !== 'png'">
                      PNG (Lossless)
                    </button>
                  </div>
                </div>

                <!-- FPS Selection -->
                <div class="space-y-3 pt-4 border-t border-neutral-800">
                  <div class="flex justify-between items-center">
                    <label for="fps-rate" class="text-sm font-medium text-neutral-300">Extraction Rate (FPS)</label>
                    <span class="text-xs text-emerald-400 font-mono">{{ store.fps() }} fps</span>
                  </div>
                  <input 
                    id="fps-rate"
                    type="range" 
                    min="0.1" max="30" step="0.1"
                    [ngModel]="store.fps()" 
                    (ngModelChange)="updateConfig('fps', $event)"
                    class="w-full accent-emerald-500">
                  <p class="text-[10px] text-neutral-500">
                    Estimated frames: {{ store.videoMeta() ? Math.ceil(store.videoMeta()!.duration * store.fps()) : 0 }}
                  </p>
                </div>

                <!-- Quality Selection (JPG only) -->
                @if (store.format() === 'jpg') {
                  <div class="space-y-3 pt-4 border-t border-neutral-800">
                    <div class="flex justify-between items-center">
                      <label for="jpg-quality" class="text-sm font-medium text-neutral-300">JPG Quality</label>
                      <span class="text-xs text-emerald-400 font-mono">
                        {{ store.quality() <= 5 ? 'High' : store.quality() <= 15 ? 'Medium' : 'Low' }}
                      </span>
                    </div>
                    <!-- For ffmpeg -q:v, lower is better. 2 is high, 31 is low -->
                    <input 
                      id="jpg-quality"
                      type="range" 
                      min="2" max="31" step="1"
                      [ngModel]="33 - store.quality()" 
                      (ngModelChange)="updateConfig('quality', 33 - $event)"
                      class="w-full accent-emerald-500">
                  </div>
                }

                <!-- Process Button -->
                <button 
                  (click)="processVideo()"
                  [disabled]="!store.inputFile() || store.status() === 'processing'"
                  class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2">
                  @if (store.status() === 'processing') {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  } @else {
                    <lucide-icon name="images" class="w-5 h-5"></lucide-icon>
                    <span>Extract Frames (ZIP)</span>
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
                    <p class="text-sm text-neutral-400 font-medium">Extracting and zipping frames...</p>
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
                    [filename]="'omni_frames_' + store.inputFile()?.name.split('.')[0] + '.zip'"
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
export class ToImagesComponent {
  store = inject(ToImagesStore);
  Math = Math;

  onFileSelected(files: File[]) {
    if (files.length) this.store.loadFile({ file: files[0] });
  }

  updateConfig(key: keyof ToImagesConfig, value: string | number) {
    this.store.updateConfig({ [key]: value });
  }

  processVideo() {
    this.store.startProcessing();
  }
}
