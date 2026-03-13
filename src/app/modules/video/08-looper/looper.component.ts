import { Component, ChangeDetectionStrategy, inject, OnDestroy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LooperStore } from './looper.store';
import { LooperService } from './looper.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { LucideAngularModule, Repeat, Clock, Layers } from 'lucide-angular';

@Component({
  selector: 'app-looper',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, FileDropZoneComponent, VideoPreviewComponent, ExportPanelComponent, ProgressRingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-8">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-white flex items-center gap-3">
          <lucide-icon [img]="Repeat" class="w-8 h-8 text-cyan-400"></lucide-icon>
          Video Looper
        </h1>
        <p class="text-gray-400 mt-2">Loop a video N times or to a target duration, with optional crossfade transition.</p>
      </header>

      @if (store.status() === 'idle' && !store.inputFile()) {
        <app-file-drop-zone
          (filesSelected)="onFileSelected($event)"
          [multiple]="false"
          accept="video/*"
        ></app-file-drop-zone>
      }

      @if (store.status() === 'loading') {
        <div class="flex justify-center p-12">
          <div class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @if (store.inputFile() && store.status() !== 'loading') {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-6">
            <app-video-preview
              [file]="store.inputFile()"
              [showControls]="true"
            ></app-video-preview>

            <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-6">
              <div class="flex bg-gray-800 rounded-lg p-1 relative">
                <div 
                  class="absolute inset-y-1 w-1/2 bg-cyan-500 rounded-md transition-transform duration-300 ease-in-out"
                  [class.translate-x-0]="store.mode() === 'count'"
                  [class.translate-x-full]="store.mode() === 'duration'"
                ></div>
                
                <button 
                  (click)="setMode('count')"
                  class="relative z-10 flex-1 py-2 text-sm font-medium transition-colors duration-300"
                  [class.text-white]="store.mode() === 'count'"
                  [class.text-gray-400]="store.mode() !== 'count'"
                >
                  <div class="flex items-center justify-center gap-2">
                    <lucide-icon [img]="Repeat" class="w-4 h-4"></lucide-icon>
                    Loop Count
                  </div>
                </button>
                
                <button 
                  (click)="setMode('duration')"
                  class="relative z-10 flex-1 py-2 text-sm font-medium transition-colors duration-300"
                  [class.text-white]="store.mode() === 'duration'"
                  [class.text-gray-400]="store.mode() !== 'duration'"
                >
                  <div class="flex items-center justify-center gap-2">
                    <lucide-icon [img]="Clock" class="w-4 h-4"></lucide-icon>
                    Target Duration
                  </div>
                </button>
              </div>

              <div class="min-h-[80px]">
                @if (store.mode() === 'count') {
                  <div class="animate-in fade-in slide-in-from-left-4 duration-300">
                    <label for="loop-count" class="block text-sm font-medium text-gray-400 mb-2">Number of loops</label>
                    <div class="flex items-center gap-4">
                      <button (click)="updateLoopCount(-1)" class="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 flex items-center justify-center">-</button>
                      <input
                        id="loop-count"
                        type="number"
                        [value]="store.loopCount()"
                        (change)="onLoopCountChange($event)"
                        min="1"
                        max="100"
                        class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-center focus:border-cyan-500 outline-none"
                      />
                      <button (click)="updateLoopCount(1)" class="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 flex items-center justify-center">+</button>
                    </div>
                  </div>
                } @else {
                  <div class="animate-in fade-in slide-in-from-right-4 duration-300">
                    <label for="target-duration" class="block text-sm font-medium text-gray-400 mb-2">Target duration (seconds)</label>
                    <input
                      id="target-duration"
                      type="number"
                      [value]="store.targetDuration()"
                      (change)="onTargetDurationChange($event)"
                      min="1"
                      class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none"
                    />
                  </div>
                }
              </div>

              <div class="border-t border-gray-800 pt-6">
                <label class="flex items-center justify-between cursor-pointer group mb-4">
                  <div class="flex items-center gap-3">
                    <lucide-icon [img]="Layers" class="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors"></lucide-icon>
                    <span class="text-gray-300 font-medium group-hover:text-white transition-colors">Crossfade Transition</span>
                  </div>
                  <div class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" [class.bg-cyan-500]="store.crossfade()" [class.bg-gray-700]="!store.crossfade()">
                    <input type="checkbox" class="sr-only peer" [checked]="store.crossfade()" (change)="onCrossfadeToggle($event)" />
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" [class.translate-x-6]="store.crossfade()" [class.translate-x-1]="!store.crossfade()"></span>
                  </div>
                </label>

                @if (store.crossfade()) {
                  <div class="animate-in fade-in slide-in-from-top-2 duration-300 pl-8">
                    <div class="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Duration</span>
                      <span>{{ store.crossfadeDuration().toFixed(1) }}s</span>
                    </div>
                    <input
                      type="range"
                      [value]="store.crossfadeDuration()"
                      (input)="onCrossfadeDurationChange($event)"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                }
              </div>
            </div>

            <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 flex flex-col items-center justify-center">
              <span class="text-sm text-gray-400 mb-1">Calculated Output Duration</span>
              <span class="text-3xl font-mono font-bold text-cyan-400">{{ formatDuration(store.outputDuration()) }}</span>
            </div>

            @if (store.status() === 'idle' || store.status() === 'error') {
              <button
                (click)="startProcessing()"
                class="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-[0_0_20px_rgba(0,245,255,0.1)] hover:shadow-[0_0_20px_rgba(0,245,255,0.3)]"
              >
                Loop Video
              </button>
            }

            @if (store.status() === 'error') {
              <div class="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p class="text-red-400 text-sm">{{ store.errorMessage() }}</p>
              </div>
            }
          </div>

          <div class="space-y-6">
            @if (store.status() === 'processing') {
              <div class="bg-gray-900 rounded-xl p-8 border border-gray-800 flex flex-col items-center justify-center min-h-[300px]">
                <app-progress-ring
                  [progress]="store.progress()"
                  label="Looping video..."
                ></app-progress-ring>
              </div>
            }

            @if (store.status() === 'done' && store.outputBlob()) {
              <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div class="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <h3 class="text-sm font-medium text-gray-400 mb-3">Preview</h3>
                  <video
                    [src]="outputUrl"
                    controls
                    loop
                    autoplay
                    class="w-full rounded-lg bg-black"
                  ></video>
                </div>

                <app-export-panel
                  [outputBlob]="store.outputBlob()"
                  [outputSizeMB]="store.outputSizeMB()"
                  defaultFilename="omni_looped_video"
                  (download)="onDownload()"
                ></app-export-panel>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class LooperComponent implements OnDestroy {
  store = inject(LooperStore);
  service = inject(LooperService);
  private destroyRef = inject(DestroyRef);
  
  readonly Repeat = Repeat;
  readonly Clock = Clock;
  readonly Layers = Layers;

  get outputUrl(): string | null {
    const blob = this.store.outputBlob();
    return blob ? URL.createObjectURL(blob) : null;
  }

  onFileSelected(files: File[]) {
    if (files.length > 0) {
      this.store.loadFile({ file: files[0] });
    }
  }

  setMode(mode: 'count' | 'duration') {
    this.store.updateConfig({ mode });
  }

  updateLoopCount(delta: number) {
    const val = Math.max(1, Math.min(100, this.store.loopCount() + delta));
    this.store.updateConfig({ loopCount: val });
  }

  onLoopCountChange(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = parseInt(input.value);
    if (isNaN(val)) val = 2;
    val = Math.max(1, Math.min(100, val));
    input.value = val.toString();
    this.store.updateConfig({ loopCount: val });
  }

  onTargetDurationChange(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = parseFloat(input.value);
    if (isNaN(val)) val = 60;
    val = Math.max(1, val);
    input.value = val.toString();
    this.store.updateConfig({ targetDuration: val });
  }

  onCrossfadeToggle(event: Event) {
    const input = event.target as HTMLInputElement;
    this.store.updateConfig({ crossfade: input.checked });
  }

  onCrossfadeDurationChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.store.updateConfig({ crossfadeDuration: parseFloat(input.value) });
  }

  formatDuration(seconds: number): string {
    return this.service.formatDuration(seconds);
  }

  startProcessing() {
    this.store.startProcessing();
  }

  onDownload() {
    this.store.downloadOutput();
  }

  ngOnDestroy() {
    this.store.resetState();
  }
}
