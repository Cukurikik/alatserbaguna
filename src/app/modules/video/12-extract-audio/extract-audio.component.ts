import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExtractAudioStore } from './extract-audio.store';
import { ExtractAudioConfig } from './extract-audio.schema';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-extract-audio',
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
            <lucide-icon name="music" class="w-8 h-8 text-indigo-400"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Extract Audio</h1>
            <p class="text-neutral-400 mt-1">Rip high-quality audio tracks from your video files.</p>
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
                    <lucide-icon name="music" class="w-4 h-4 text-indigo-400"></lucide-icon>
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
                    <span class="flex items-center space-x-1">
                      <lucide-icon name="volume-2" class="w-3 h-3"></lucide-icon>
                      <span>{{ store.videoMeta()!.hasAudio ? 'Audio Present' : 'No Audio Detected' }}</span>
                    </span>
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
                <span>Extraction Settings</span>
              </h3>
              
              <div class="space-y-6" [class.opacity-50]="!store.inputFile() || store.status() === 'processing'" [class.pointer-events-none]="!store.inputFile() || store.status() === 'processing'">
                
                <!-- Format Selection -->
                <div class="space-y-3">
                  <span class="text-sm font-medium text-neutral-300">Output Format</span>
                  <div class="grid grid-cols-2 gap-2">
                    @for (fmt of ['mp3', 'wav', 'aac', 'ogg']; track fmt) {
                      <button 
                        (click)="updateConfig('format', fmt)"
                        class="py-2 px-3 rounded-lg border text-sm font-medium transition-all uppercase"
                        [class.bg-indigo-500/20]="store.format() === fmt"
                        [class.border-indigo-500/50]="store.format() === fmt"
                        [class.text-indigo-300]="store.format() === fmt"
                        [class.bg-neutral-800]="store.format() !== fmt"
                        [class.border-neutral-700]="store.format() !== fmt"
                        [class.text-neutral-400]="store.format() !== fmt">
                        {{ fmt }}
                      </button>
                    }
                  </div>
                </div>

                <!-- Quality Settings -->
                @if (store.format() !== 'wav') {
                  <div class="space-y-4 pt-4 border-t border-neutral-800">
                    <span class="text-sm font-medium text-neutral-300">Audio Quality</span>
                    
                    <div class="space-y-2">
                      <div class="flex justify-between">
                        <label for="bitrate-slider" class="text-xs text-neutral-400">Bitrate</label>
                        <span class="text-xs text-indigo-400">{{ store.bitrate() }} kbps</span>
                      </div>
                      <input type="range" 
                             id="bitrate-slider"
                             [ngModel]="store.bitrate()" 
                             (ngModelChange)="updateConfig('bitrate', $event)"
                             min="64" max="320" step="32"
                             class="w-full accent-indigo-500">
                      <div class="flex justify-between text-[10px] text-neutral-500">
                        <span>Smaller File</span>
                        <span>Better Quality</span>
                      </div>
                    </div>
                  </div>
                } @else {
                  <div class="pt-4 border-t border-neutral-800">
                    <p class="text-sm text-neutral-400">WAV format uses lossless PCM encoding. Bitrate settings are disabled.</p>
                  </div>
                }

                <!-- Warning if no audio -->
                @if (store.videoMeta() && !store.videoMeta()!.hasAudio) {
                  <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm flex items-start space-x-2">
                    <lucide-icon name="volume-2" class="w-4 h-4 mt-0.5 flex-shrink-0"></lucide-icon>
                    <p>Warning: No audio streams detected in this video. Extraction may fail or produce an empty file.</p>
                  </div>
                }

                <!-- Process Button -->
                <button 
                  (click)="processVideo()"
                  [disabled]="!store.inputFile() || store.status() === 'processing' || (store.videoMeta() && !store.videoMeta()!.hasAudio)"
                  class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2">
                  @if (store.status() === 'processing') {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Extracting...</span>
                  } @else {
                    <lucide-icon name="music" class="w-5 h-5"></lucide-icon>
                    <span>Extract Audio</span>
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
                    <p class="text-sm text-neutral-400 font-medium">Extracting audio track...</p>
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
                    [filename]="'omni_audio_' + (store.inputFile()?.name?.split('.')?.[0] || 'audio') + '.' + store.format()"
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
export class ExtractAudioComponent {
  store = inject(ExtractAudioStore);

  onFileSelected(files: File[]) {
    if (files.length) this.store.loadFile({ file: files[0] });
  }

  updateConfig(key: keyof ExtractAudioConfig, value: string | number) {
    this.store.updateConfig({ [key]: value });
  }

  processVideo() {
    this.store.startProcessing();
  }
}
