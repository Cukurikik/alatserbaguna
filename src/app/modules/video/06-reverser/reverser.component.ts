import { Component, ChangeDetectionStrategy, inject, OnDestroy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReverserStore } from './reverser.store';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { LucideAngularModule, AlertTriangle, RotateCcw } from 'lucide-angular';

@Component({
  selector: 'app-reverser',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, FileDropZoneComponent, VideoPreviewComponent, ExportPanelComponent, ProgressRingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-8">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-white flex items-center gap-3">
          <lucide-icon [img]="RotateCcw" class="w-8 h-8 text-cyan-400"></lucide-icon>
          Video Reverser
        </h1>
        <p class="text-gray-400 mt-2">Reverse video playback direction with optional audio reverse.</p>
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

            @if (store.durationWarning()) {
              <div class="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4 flex items-start gap-3">
                <lucide-icon [img]="AlertTriangle" class="w-5 h-5 text-amber-400 shrink-0 mt-0.5"></lucide-icon>
                <p class="text-sm text-amber-200">
                  <span class="font-semibold block mb-1">Long video detected</span>
                  Processing videos over 2 minutes may take several minutes and use significant memory.
                </p>
              </div>
            }

            <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 class="text-lg font-semibold text-white mb-4">Settings</h3>
              
              <label class="flex items-center gap-3 cursor-pointer group">
                <div class="relative flex items-center justify-center w-6 h-6 rounded border border-gray-600 bg-gray-800 group-hover:border-cyan-400 transition-colors">
                  <input
                    type="checkbox"
                    class="peer sr-only"
                    [checked]="store.reverseAudio()"
                    (change)="onReverseAudioChange($event)"
                  />
                  <lucide-icon 
                    [img]="RotateCcw" 
                    class="w-4 h-4 text-cyan-400 opacity-0 peer-checked:opacity-100 transition-opacity"
                  ></lucide-icon>
                </div>
                <span class="text-gray-300 group-hover:text-white transition-colors">Also reverse audio track</span>
              </label>
            </div>

            @if (store.status() === 'idle' || store.status() === 'error') {
              <button
                (click)="startProcessing()"
                class="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-[0_0_20px_rgba(0,245,255,0.1)] hover:shadow-[0_0_20px_rgba(0,245,255,0.3)]"
              >
                Reverse Video
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
                  label="Reversing frames..."
                ></app-progress-ring>
              </div>
            }

            @if (store.status() === 'done' && store.outputBlob()) {
              <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div class="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <h3 class="text-sm font-medium text-gray-400 mb-3">Reversed Preview</h3>
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
                  defaultFilename="omni_reversed_video"
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
export class ReverserComponent implements OnDestroy {
  store = inject(ReverserStore);
  private destroyRef = inject(DestroyRef);
  
  readonly AlertTriangle = AlertTriangle;
  readonly RotateCcw = RotateCcw;

  get outputUrl(): string | null {
    const blob = this.store.outputBlob();
    return blob ? URL.createObjectURL(blob) : null;
  }

  onFileSelected(files: File[]) {
    if (files.length > 0) {
      this.store.loadFile({ file: files[0] });
    }
  }

  onReverseAudioChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.store.updateConfig({ reverseAudio: input.checked });
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
