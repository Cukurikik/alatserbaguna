import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddAudioStore } from './add-audio.store';
import { AddAudioConfig } from './add-audio.schema';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-add-audio',
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
            <lucide-icon name="plus" class="w-8 h-8 text-indigo-400"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Add Audio</h1>
            <p class="text-neutral-400 mt-1">Add background music or replace the audio track of your video.</p>
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

            <!-- Audio File Drop Zone -->
            @if (store.inputFile() && !store.audioFile()) {
              <div class="bg-neutral-900 border border-neutral-800 border-dashed rounded-2xl p-8 text-center transition-colors hover:bg-neutral-800/50">
                <input type="file" id="audio-upload" class="hidden" accept="audio/*" (change)="onAudioSelected($event)">
                <label for="audio-upload" class="cursor-pointer flex flex-col items-center space-y-4">
                  <div class="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center">
                    <lucide-icon name="file-audio" class="w-8 h-8 text-indigo-400"></lucide-icon>
                  </div>
                  <div>
                    <h3 class="text-lg font-medium text-white">Add Audio Track</h3>
                    <p class="text-sm text-neutral-400 mt-1">Drop an audio file or click to browse (MP3, WAV, AAC)</p>
                  </div>
                </label>
              </div>
            } @else if (store.audioFile()) {
              <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
                <div class="flex items-center space-x-3">
                  <div class="p-2 bg-indigo-500/20 rounded-lg">
                    <lucide-icon name="file-audio" class="w-5 h-5 text-indigo-400"></lucide-icon>
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-white">{{ store.audioFile()!.name }}</h4>
                    <p class="text-xs text-neutral-400">{{ (store.audioFile()!.size / (1024 * 1024)) | number:'1.1-2' }} MB</p>
                  </div>
                </div>
                <button (click)="store.loadAudioFile(null!)" class="text-xs text-neutral-400 hover:text-white transition-colors flex items-center space-x-1 bg-neutral-800 px-2 py-1 rounded-md">
                  <lucide-icon name="refresh-cw" class="w-3 h-3"></lucide-icon>
                  <span>Change</span>
                </button>
              </div>
            }
          </div>

          <!-- Right Column: Controls -->
          <div class="space-y-6">
            <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
              <h3 class="text-lg font-medium mb-6 flex items-center space-x-2">
                <lucide-icon name="settings-2" class="w-5 h-5 text-indigo-400"></lucide-icon>
                <span>Audio Settings</span>
              </h3>
              
              <div class="space-y-6" [class.opacity-50]="!store.inputFile() || !store.audioFile() || store.status() === 'processing'" [class.pointer-events-none]="!store.inputFile() || !store.audioFile() || store.status() === 'processing'">
                
                <!-- Mode Selection -->
                <div class="space-y-3">
                  <span class="text-sm font-medium text-neutral-300">Operation Mode</span>
                  <div class="grid grid-cols-2 gap-2">
                    <button 
                      (click)="updateConfig('mode', 'replace')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-indigo-500/20]="store.mode() === 'replace'"
                      [class.border-indigo-500/50]="store.mode() === 'replace'"
                      [class.text-indigo-300]="store.mode() === 'replace'"
                      [class.bg-neutral-800]="store.mode() !== 'replace'"
                      [class.border-neutral-700]="store.mode() !== 'replace'"
                      [class.text-neutral-400]="store.mode() !== 'replace'">
                      Replace Original
                    </button>
                    <button 
                      (click)="updateConfig('mode', 'mix')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-indigo-500/20]="store.mode() === 'mix'"
                      [class.border-indigo-500/50]="store.mode() === 'mix'"
                      [class.text-indigo-300]="store.mode() === 'mix'"
                      [class.bg-neutral-800]="store.mode() !== 'mix'"
                      [class.border-neutral-700]="store.mode() !== 'mix'"
                      [class.text-neutral-400]="store.mode() !== 'mix'">
                      Mix Audio
                    </button>
                  </div>
                </div>

                <!-- Volume Controls -->
                <div class="space-y-4 pt-4 border-t border-neutral-800">
                  <span class="text-sm font-medium text-neutral-300">Volume Levels</span>
                  
                  @if (store.mode() === 'mix') {
                    <div class="space-y-2">
                      <div class="flex justify-between">
                        <label for="video-volume-slider" class="text-xs text-neutral-400">Original Video Volume</label>
                        <span class="text-xs text-indigo-400">{{ store.videoVolume() * 100 | number:'1.0-0' }}%</span>
                      </div>
                      <input type="range" 
                             id="video-volume-slider"
                             [ngModel]="store.videoVolume()" 
                             (ngModelChange)="updateConfig('videoVolume', $event)"
                             min="0" max="2" step="0.1"
                             class="w-full accent-indigo-500">
                    </div>
                  }

                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <label for="audio-volume-slider" class="text-xs text-neutral-400">New Audio Volume</label>
                      <span class="text-xs text-indigo-400">{{ store.audioVolume() * 100 | number:'1.0-0' }}%</span>
                    </div>
                    <input type="range" 
                           id="audio-volume-slider"
                           [ngModel]="store.audioVolume()" 
                           (ngModelChange)="updateConfig('audioVolume', $event)"
                           min="0" max="2" step="0.1"
                           class="w-full accent-indigo-500">
                  </div>
                </div>

                <!-- Loop Option -->
                <div class="space-y-4 pt-4 border-t border-neutral-800">
                  <label class="flex items-center space-x-3 cursor-pointer group">
                    <div class="relative flex items-center justify-center">
                      <input type="checkbox" 
                             [ngModel]="store.loopAudio()" 
                             (ngModelChange)="updateConfig('loopAudio', $event)"
                             class="peer sr-only">
                      <div class="w-10 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </div>
                    <span class="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">Loop Audio</span>
                  </label>
                  <p class="text-xs text-neutral-500 ml-13">If checked, the audio will loop until the end of the video.</p>
                </div>

                <!-- Process Button -->
                <button 
                  (click)="processVideo()"
                  [disabled]="!store.inputFile() || !store.audioFile() || store.status() === 'processing'"
                  class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2">
                  @if (store.status() === 'processing') {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  } @else {
                    <lucide-icon name="plus" class="w-5 h-5"></lucide-icon>
                    <span>Add Audio</span>
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
                    <p class="text-sm text-neutral-400 font-medium">Adding audio track...</p>
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
                    [filename]="'omni_audio_added_' + store.inputFile()?.name"
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
export class AddAudioComponent {
  store = inject(AddAudioStore);

  onFileSelected(files: File[]) {
    if (files.length) this.store.loadFile({ file: files[0] });
  }

  onAudioSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.store.loadAudioFile(input.files[0]);
    }
  }

  updateConfig(key: keyof AddAudioConfig, value: string | number | boolean) {
    this.store.updateConfig({ [key]: value });
  }

  processVideo() {
    this.store.startProcessing();
  }
}
