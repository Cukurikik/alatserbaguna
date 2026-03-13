import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddSubtitlesStore } from './add-subtitles.store';
import { AddSubtitlesConfig } from './add-subtitles.schema';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-add-subtitles',
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
            <lucide-icon name="type" class="w-8 h-8 text-indigo-400"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">Add Subtitles</h1>
            <p class="text-neutral-400 mt-1">Embed or burn subtitles into your video files.</p>
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
                    <lucide-icon name="type" class="w-4 h-4 text-indigo-400"></lucide-icon>
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

            <!-- Subtitle File Drop Zone -->
            @if (store.inputFile() && !store.subtitleFile()) {
              <div class="bg-neutral-900 border border-neutral-800 border-dashed rounded-2xl p-8 text-center transition-colors hover:bg-neutral-800/50">
                <input type="file" id="subtitle-upload" class="hidden" accept=".srt,.vtt,.ass" (change)="onSubtitleSelected($event)">
                <label for="subtitle-upload" class="cursor-pointer flex flex-col items-center space-y-4">
                  <div class="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center">
                    <lucide-icon name="file-text" class="w-8 h-8 text-indigo-400"></lucide-icon>
                  </div>
                  <div>
                    <h3 class="text-lg font-medium text-white">Add Subtitle File</h3>
                    <p class="text-sm text-neutral-400 mt-1">Drop a subtitle file or click to browse (SRT, VTT, ASS)</p>
                  </div>
                </label>
              </div>
            } @else if (store.subtitleFile()) {
              <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
                <div class="flex items-center space-x-3">
                  <div class="p-2 bg-indigo-500/20 rounded-lg">
                    <lucide-icon name="file-text" class="w-5 h-5 text-indigo-400"></lucide-icon>
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-white">{{ store.subtitleFile()!.name }}</h4>
                    <p class="text-xs text-neutral-400">{{ (store.subtitleFile()!.size / 1024) | number:'1.0-1' }} KB</p>
                  </div>
                </div>
                <button (click)="store.loadSubtitleFile(null!)" class="text-xs text-neutral-400 hover:text-white transition-colors flex items-center space-x-1 bg-neutral-800 px-2 py-1 rounded-md">
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
                <span>Subtitle Settings</span>
              </h3>
              
              <div class="space-y-6" [class.opacity-50]="!store.inputFile() || !store.subtitleFile() || store.status() === 'processing'" [class.pointer-events-none]="!store.inputFile() || !store.subtitleFile() || store.status() === 'processing'">
                
                <!-- Mode Selection -->
                <div class="space-y-3">
                  <span class="text-sm font-medium text-neutral-300">Integration Mode</span>
                  <div class="grid grid-cols-2 gap-2">
                    <button 
                      (click)="updateConfig('mode', 'hard')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-indigo-500/20]="store.mode() === 'hard'"
                      [class.border-indigo-500/50]="store.mode() === 'hard'"
                      [class.text-indigo-300]="store.mode() === 'hard'"
                      [class.bg-neutral-800]="store.mode() !== 'hard'"
                      [class.border-neutral-700]="store.mode() !== 'hard'"
                      [class.text-neutral-400]="store.mode() !== 'hard'">
                      <div class="flex flex-col items-center">
                        <span>Hardcode (Burn)</span>
                        <span class="text-[10px] opacity-70 mt-1 font-normal">Permanent, works everywhere</span>
                      </div>
                    </button>
                    <button 
                      (click)="updateConfig('mode', 'soft')"
                      class="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                      [class.bg-indigo-500/20]="store.mode() === 'soft'"
                      [class.border-indigo-500/50]="store.mode() === 'soft'"
                      [class.text-indigo-300]="store.mode() === 'soft'"
                      [class.bg-neutral-800]="store.mode() !== 'soft'"
                      [class.border-neutral-700]="store.mode() !== 'soft'"
                      [class.text-neutral-400]="store.mode() !== 'soft'">
                      <div class="flex flex-col items-center">
                        <span>Softcode (Embed)</span>
                        <span class="text-[10px] opacity-70 mt-1 font-normal">Toggleable, faster export</span>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- Language Selection -->
                @if (store.mode() === 'soft') {
                  <div class="space-y-2 pt-4 border-t border-neutral-800">
                    <label for="language-select" class="text-xs text-neutral-400">Subtitle Language Code</label>
                    <select id="language-select" [ngModel]="store.language()" (ngModelChange)="updateConfig('language', $event)" class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                      <option value="eng">English (eng)</option>
                      <option value="spa">Spanish (spa)</option>
                      <option value="fre">French (fre)</option>
                      <option value="ger">German (ger)</option>
                      <option value="jpn">Japanese (jpn)</option>
                      <option value="kor">Korean (kor)</option>
                      <option value="chi">Chinese (chi)</option>
                      <option value="ind">Indonesian (ind)</option>
                      <option value="und">Undefined (und)</option>
                    </select>
                  </div>
                }

                <!-- Process Button -->
                <button 
                  (click)="processVideo()"
                  [disabled]="!store.inputFile() || !store.subtitleFile() || store.status() === 'processing'"
                  class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2">
                  @if (store.status() === 'processing') {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  } @else {
                    <lucide-icon name="plus" class="w-5 h-5"></lucide-icon>
                    <span>Add Subtitles</span>
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
                    <p class="text-sm text-neutral-400 font-medium">Adding subtitles...</p>
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
                    [filename]="'omni_subbed_' + store.inputFile()?.name"
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
export class AddSubtitlesComponent {
  store = inject(AddSubtitlesStore);

  onFileSelected(files: File[]) {
    if (files.length) this.store.loadFile({ file: files[0] });
  }

  onSubtitleSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.store.loadSubtitleFile(input.files[0]);
    }
  }

  updateConfig(key: keyof AddSubtitlesConfig, value: string) {
    this.store.updateConfig({ [key]: value });
  }

  processVideo() {
    this.store.startProcessing();
  }
}
