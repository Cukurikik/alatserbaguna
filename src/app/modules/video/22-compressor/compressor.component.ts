import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompressorStore } from './compressor.store';
import { CompressorConfig } from './compressor.schema';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule, Minimize2, RefreshCw, Settings2, Zap, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-compressor',
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
            <lucide-icon name="minimize-2" class="w-8 h-8 text-indigo-400"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Compress Video</h1>
            <p class="text-neutral-400 mt-1">Reduce video file size while maintaining quality.</p>
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
                    <lucide-icon name="minimize-2" class="w-4 h-4 text-indigo-400"></lucide-icon>
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
                    <span>{{ (store.inputFile()!.size / (1024 * 1024)) | number:'1.1-2' }} MB</span>
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
                <span>Compression Settings</span>
              </h3>
              
              <div class="space-y-6" [class.opacity-50]="!store.inputFile() || store.status() === 'processing'" [class.pointer-events-none]="!store.inputFile() || store.status() === 'processing'">
                
                <!-- Compression Level (CRF) -->
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <label for="crf-range" class="text-sm font-medium text-neutral-300">Compression Level</label>
                    <span class="text-xs text-indigo-400 font-mono">
                      {{ store.crf() <= 23 ? 'High Quality' : store.crf() <= 30 ? 'Balanced' : 'Small Size' }}
                    </span>
                  </div>
                  <!-- CRF: 0-51. Lower is better quality. We map 0-100 slider to 51-0 -->
                  <input 
                    id="crf-range"
                    type="range" 
                    min="18" max="45" step="1"
                    [ngModel]="store.crf()" 
                    (ngModelChange)="updateConfig('crf', $event)"
                    class="w-full accent-indigo-500">
                  <div class="flex justify-between text-[10px] text-neutral-500">
                    <span>Higher Quality (Larger)</span>
                    <span>Smaller Size (Lower Quality)</span>
                  </div>
                </div>

                <!-- Encoding Speed (Preset) -->
                <div class="space-y-3 pt-4 border-t border-neutral-800">
                  <label for="preset-select" class="text-sm font-medium text-neutral-300">Encoding Speed</label>
                  <select 
                    id="preset-select"
                    [ngModel]="store.preset()" 
                    (ngModelChange)="updateConfig('preset', $event)"
                    class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                    <option value="ultrafast">Ultrafast (Largest file, fastest)</option>
                    <option value="superfast">Superfast</option>
                    <option value="veryfast">Veryfast</option>
                    <option value="faster">Faster</option>
                    <option value="fast">Fast</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="slow">Slow</option>
                    <option value="slower">Slower</option>
                    <option value="veryslow">Veryslow (Smallest file, slowest)</option>
                  </select>
                </div>

                <!-- Audio Bitrate -->
                <div class="space-y-3 pt-4 border-t border-neutral-800">
                  <label for="audio-bitrate-select" class="text-sm font-medium text-neutral-300">Audio Bitrate</label>
                  <select 
                    id="audio-bitrate-select"
                    [ngModel]="store.audioBitrate()" 
                    (ngModelChange)="updateConfig('audioBitrate', $event)"
                    class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                    <option value="64k">64 kbps (Low)</option>
                    <option value="96k">96 kbps</option>
                    <option value="128k">128 kbps (Standard)</option>
                    <option value="192k">192 kbps (High)</option>
                    <option value="256k">256 kbps</option>
                    <option value="320k">320 kbps (Max)</option>
                  </select>
                </div>

                <!-- Process Button -->
                <button 
                  (click)="processVideo()"
                  [disabled]="!store.inputFile() || store.status() === 'processing'"
                  class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2">
                  @if (store.status() === 'processing') {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Compressing...</span>
                  } @else {
                    <lucide-icon name="zap" class="w-5 h-5"></lucide-icon>
                    <span>Compress Video</span>
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
                    <p class="text-sm text-neutral-400 font-medium">Compressing video...</p>
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
                  <div class="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex justify-between items-center">
                    <span class="text-sm text-neutral-400">Original: <span class="text-white">{{ (store.inputFile()!.size / (1024 * 1024)) | number:'1.1-2' }} MB</span></span>
                    <lucide-icon name="arrow-right" class="w-4 h-4 text-indigo-400"></lucide-icon>
                    <span class="text-sm text-neutral-400">New: <span class="text-emerald-400 font-bold">{{ store.outputSizeMB() | number:'1.1-2' }} MB</span></span>
                  </div>
                  <app-export-panel
                    [blob]="store.outputBlob()!"
                    [filename]="'omni_compressed_' + store.inputFile()?.name"
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
export class CompressorComponent {
  store = inject(CompressorStore);

  onFileSelected(files: File[]) {
    if (files.length) this.store.loadFile({ file: files[0] });
  }

  updateConfig(key: keyof CompressorConfig, value: string | number) {
    this.store.updateConfig({ [key]: value });
  }

  processVideo() {
    this.store.startProcessing();
  }
}
