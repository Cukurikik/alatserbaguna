import { Component, ChangeDetectionStrategy, inject, DestroyRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { TrimmerActions, selectTrimmerState, selectIsLoading, selectIsDone, selectHasError, selectCanProcess } from './trimmer.store';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { LucideAngularModule, Scissors } from 'lucide-angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-trimmer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    FileDropZoneComponent,
    VideoPreviewComponent,
    ProgressRingComponent,
    ExportPanelComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto p-6 space-y-8">
      <div class="flex items-center gap-4 mb-8">
        <div class="p-3 bg-cyan-500/10 rounded-xl">
          <lucide-icon [img]="Scissors" class="w-8 h-8 text-cyan-400"></lucide-icon>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-white tracking-tight">Video Trimmer</h1>
          <p class="text-gray-400 mt-1">Precision frame-level video trimming</p>
        </div>
      </div>

      @if ((state$ | async)?.inputFile === null || (state$ | async)?.inputFile === undefined) {
        <app-file-drop-zone
          (filesSelected)="onFileSelected($event)"
          [multiple]="false"
          accept="video/*"
        ></app-file-drop-zone>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-6">
            <app-video-preview
              [file]="(state$ | async)?.inputFile || null"
              [currentTime]="(state$ | async)?.startTime || 0"
              (durationDetected)="onDurationDetected($event)"
            ></app-video-preview>

            <!-- Trimmer Controls -->
            <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 class="text-lg font-semibold text-white mb-4">Trim Range</h3>
              
              <div class="flex items-center gap-4 mb-6">
                <div class="flex-1">
                  <label class="block text-sm text-gray-400 mb-1" for="startTime">Start Time (s)</label>
                  <input
                    id="startTime"
                    type="number"
                    [ngModel]="(state$ | async)?.startTime"
                    (ngModelChange)="updateStartTime($event)"
                    step="0.1"
                    min="0"
                    [max]="(state$ | async)?.endTime || 0"
                    class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
                <div class="flex-1">
                  <label class="block text-sm text-gray-400 mb-1" for="endTime">End Time (s)</label>
                  <input
                    id="endTime"
                    type="number"
                    [ngModel]="(state$ | async)?.endTime"
                    (ngModelChange)="updateEndTime($event)"
                    step="0.1"
                    [min]="(state$ | async)?.startTime || 0"
                    [max]="(state$ | async)?.videoMeta?.duration || 0"
                    class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <!-- Visual Range Slider (Simplified) -->
              <div class="relative h-12 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <div 
                  class="absolute top-0 bottom-0 bg-cyan-500/20 border-x-2 border-cyan-400"
                  [style.left.%]="((state$ | async)?.startTime || 0) / ((state$ | async)?.videoMeta?.duration || 1) * 100"
                  [style.width.%]="(((state$ | async)?.endTime || 0) - ((state$ | async)?.startTime || 0)) / ((state$ | async)?.videoMeta?.duration || 1) * 100"
                ></div>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            @if (isLoading$ | async) {
              <div class="bg-gray-900 rounded-xl p-8 border border-gray-800 flex flex-col items-center justify-center min-h-[300px]">
                <app-progress-ring
                  [progress]="(state$ | async)?.progress || 0"
                  label="Trimming Video..."
                ></app-progress-ring>
              </div>
            } @else {
              <app-export-panel
                [outputBlob]="(state$ | async)?.outputBlob || null"
                [outputSizeMB]="(state$ | async)?.outputSizeMB || null"
                [availableFormats]="['mp4', 'webm', 'mov']"
                (formatChanged)="updateFormat($event)"
                (download)="onDownload()"
              ></app-export-panel>

              <button
                (click)="onProcess()"
                [disabled]="(canProcess$ | async) === false"
                class="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300"
                [class.bg-cyan-500]="(canProcess$ | async)"
                [class.text-white]="(canProcess$ | async)"
                [class.hover:bg-cyan-400]="(canProcess$ | async)"
                [class.shadow-[0_0_20px_rgba(0,245,255,0.3)]]="(canProcess$ | async)"
                [class.bg-gray-800]="(canProcess$ | async) === false"
                [class.text-gray-500]="(canProcess$ | async) === false"
                [class.cursor-not-allowed]="(canProcess$ | async) === false"
              >
                Trim Video
              </button>

              @if (hasError$ | async) {
                <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {{ (state$ | async)?.errorMessage }}
                </div>
              }

              <button
                (click)="onReset()"
                class="w-full py-3 text-gray-400 hover:text-white transition-colors"
              >
                Start Over
              </button>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class TrimmerComponent implements OnDestroy {
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  state$ = this.store.select(selectTrimmerState);
  isLoading$ = this.store.select(selectIsLoading);
  isDone$ = this.store.select(selectIsDone);
  hasError$ = this.store.select(selectHasError);
  canProcess$ = this.store.select(selectCanProcess);

  readonly Scissors = Scissors;

  ngOnDestroy() {
    this.store.dispatch(TrimmerActions.resetState());
  }

  onFileSelected(files: File[]) {
    if (files.length > 0) {
      this.store.dispatch(TrimmerActions.loadFile({ file: files[0] }));
    }
  }

  onDurationDetected(duration: number) {
    this.store.dispatch(TrimmerActions.updateConfig({
      config: { endTime: duration }
    }));
  }

  updateStartTime(time: number) {
    this.store.dispatch(TrimmerActions.updateConfig({
      config: { startTime: time }
    }));
  }

  updateEndTime(time: number) {
    this.store.dispatch(TrimmerActions.updateConfig({
      config: { endTime: time }
    }));
  }

  updateFormat(format: string) {
    this.store.dispatch(TrimmerActions.updateConfig({
      config: { outputFormat: format as 'mp4' | 'webm' | 'mov' }
    }));
  }

  onProcess() {
    this.store.dispatch(TrimmerActions.startProcessing());
  }

  onDownload() {
    this.store.dispatch(TrimmerActions.downloadOutput());
  }

  onReset() {
    this.store.dispatch(TrimmerActions.resetState());
  }
}
