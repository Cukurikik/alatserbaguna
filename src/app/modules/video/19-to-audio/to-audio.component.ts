import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToAudioStore } from './to-audio.store';
import { ToAudioConfig } from './to-audio.schema';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule, Music, RefreshCw, Settings2, FileAudio } from 'lucide-angular';

@Component({
  selector: 'app-to-audio',
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
          <div class="p-3 bg-purple-500/20 rounded-xl">
            <lucide-icon name="music" class="w-8 h-8 text-purple-400"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Video to Audio</h1>
            <p class="text-neutral-400 mt-1">Convert video files to audio formats (MP3, WAV, AAC, etc.).</p>
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
                    <lucide-icon name="music" class="w-4 h-4 text-purple-400"></lucide-icon>
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
                      <div class="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
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
                <lucide-icon name="settings-2" class="w-5 h-5 text-purple-400"></lucide-icon>
                <span>Conversion Settings</span>
              </h3>
              
              <div class="space-y-6" [class.opacity-50]="!store.inputFile() || store.status() === 'processing'" [class.pointer-events-none]="!store.inputFile() || store.status() === 'processing'">
                
                <!-- Format Selection -->
                <div class="space-y-3">
                  <label class="text-sm font-medium text-neutral-300">Audio Format</label>
                  <div class="grid grid-cols-3 gap-2">
                    <button 
                      (click)="updateConfig('format', 'mp3')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-purple-500/20]="store.format() === 'mp3'"
                      [class.border-purple-500/50]="store.format() === 'mp3'"
                      [class.text-purple-300]="store.format() === 'mp3'"
                      [class.bg-neutral-800]="store.format() !== 'mp3'"
                      [class.border-neutral-700]="store.format() !== 'mp3'"
                      [class.text-neutral-400]="store.format() !== 'mp3'">
                      MP3
                    </button>
                    <button 
                      (click)="updateConfig('format', 'wav')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-purple-500/20]="store.format() === 'wav'"
                      [class.border-purple-500/50]="store.format() === 'wav'"
                      [class.text-purple-300]="store.format() === 'wav'"
                      [class.bg-neutral-800]="store.format() !== 'wav'"
                      [class.border-neutral-700]="store.format() !== 'wav'"
                      [class.text-neutral-400]="store.format() !== 'wav'">
                      WAV
                    </button>
                    <button 
                      (click)="updateConfig('format', 'aac')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-purple-500/20]="store.format() === 'aac'"
                      [class.border-purple-500/50]="store.format() === 'aac'"
                      [class.text-purple-300]="store.format() === 'aac'"
                      [class.bg-neutral-800]="store.format() !== 'aac'"
                      [class.border-neutral-700]="store.format() !== 'aac'"
                      [class.text-neutral-400]="store.format() !== 'aac'">
                      AAC
                    </button>
                    <button 
                      (click)="updateConfig('format', 'ogg')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-purple-500/20]="store.format() === 'ogg'"
                      [class.border-purple-500/50]="store.format() === 'ogg'"
                      [class.text-purple-300]="store.format() === 'ogg'"
                      [class.bg-neutral-800]="store.format() !== 'ogg'"
                      [class.border-neutral-700]="store.format() !== 'ogg'"
                      [class.text-neutral-400]="store.format() !== 'ogg'">
                      OGG
                    </button>
                    <button 
                      (click)="updateConfig('format', 'flac')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-purple-500/20]="store.format() === 'flac'"
                      [class.border-purple-500/50]="store.format() === 'flac'"
                      [class.text-purple-300]="store.format() === 'flac'"
                      [class.bg-neutral-800]="store.format() !== 'flac'"
                      [class.border-neutral-700]="store.format() !== 'flac'"
                      [class.text-neutral-400]="store.format() !== 'flac'">
                      FLAC
                    </button>
                  </div>
                </div>

                <!-- Quality Selection -->
                <div class="space-y-3 pt-4 border-t border-neutral-800" [class.opacity-50]="store.format() === 'wav' || store.format() === 'flac'" [class.pointer-events-none]="store.format() === 'wav' || store.format() === 'flac'">
                  <label class="text-sm font-medium text-neutral-300">Audio Quality</label>
                  <div class="grid grid-cols-3 gap-2">
                    <button 
                      (click)="updateConfig('quality', 'low')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-purple-500/20]="store.quality() === 'low'"
                      [class.border-purple-500/50]="store.quality() === 'low'"
                      [class.text-purple-300]="store.quality() === 'low'"
                      [class.bg-neutral-800]="store.quality() !== 'low'"
                      [class.border-neutral-700]="store.quality() !== 'low'"
                      [class.text-neutral-400]="store.quality() !== 'low'">
                      Low
                    </button>
                    <button 
                      (click)="updateConfig('quality', 'medium')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-purple-500/20]="store.quality() === 'medium'"
                      [class.border-purple-500/50]="store.quality() === 'medium'"
                      [class.text-purple-300]="store.quality() === 'medium'"
                      [class.bg-neutral-800]="store.quality() !== 'medium'"
                      [class.border-neutral-700]="store.quality() !== 'medium'"
                      [class.text-neutral-400]="store.quality() !== 'medium'">
                      Medium
                    </button>
                    <button 
                      (click)="updateConfig('quality', 'high')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-purple-500/20]="store.quality() === 'high'"
                      [class.border-purple-500/50]="store.quality() === 'high'"
                      [class.text-purple-300]="store.quality() === 'high'"
                      [class.bg-neutral-800]="store.quality() !== 'high'"
                      [class.border-neutral-700]="store.quality() !== 'high'"
                      [class.text-neutral-400]="store.quality() !== 'high'">
                      High
                    </button>
                  </div>
                </div>

                <!-- Process Button -->
                <button 
                  (click)="processVideo()"
                  [disabled]="!store.inputFile() || store.status() === 'processing'"
                  class="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2">
                  @if (store.status() === 'processing') {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  } @else {
                    <lucide-icon name="file-audio" class="w-5 h-5"></lucide-icon>
                    <span>Convert to Audio</span>
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
                    <p class="text-sm text-neutral-400 font-medium">Converting to audio...</p>
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
                    [filename]="'omni_audio_' + (store.inputFile()?.name || 'video').split('.')[0] + '.' + store.format()"
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
export class ToAudioComponent {
  store = inject(ToAudioStore);

  onFileSelected(files: File[]) {
    if (files.length) this.store.loadFile({ file: files[0] });
  }

  updateConfig(key: keyof ToAudioConfig, value: string) {
    this.store.updateConfig({ [key]: value });
  }

  processVideo() {
    this.store.startProcessing();
  }
}
