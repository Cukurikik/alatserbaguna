import { Component, ChangeDetectionStrategy, inject, OnDestroy, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlipRotateStore } from './flip-rotate.store';
import { FlipRotateService } from './flip-rotate.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { LucideAngularModule, FlipHorizontal, FlipVertical, RotateCw } from 'lucide-angular';

@Component({
  selector: 'app-flip-rotate',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, FileDropZoneComponent, VideoPreviewComponent, ExportPanelComponent, ProgressRingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-8">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-white flex items-center gap-3">
          <lucide-icon [img]="RotateCw" class="w-8 h-8 text-cyan-400"></lucide-icon>
          Flip & Rotate
        </h1>
        <p class="text-gray-400 mt-2">Flip video horizontally/vertically and rotate by arbitrary degrees.</p>
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
            <div class="relative w-full bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[300px] border border-gray-800">
              <video
                [src]="inputUrl"
                class="max-w-full max-h-full transition-transform duration-300"
                [style.transform]="previewTransform()"
                autoplay
                loop
                muted
              ></video>
            </div>

            <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-6">
              <div>
                <h3 class="text-sm font-medium text-gray-400 mb-3">Flip</h3>
                <div class="flex gap-4">
                  <button
                    (click)="toggleFlipH()"
                    class="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-lg border transition-all duration-200"
                    [class.bg-cyan-500]="store.flipH()"
                    [class.border-cyan-400]="store.flipH()"
                    [class.text-white]="store.flipH()"
                    [class.bg-gray-800]="!store.flipH()"
                    [class.border-gray-700]="!store.flipH()"
                    [class.text-gray-400]="!store.flipH()"
                    [class.hover:bg-gray-700]="!store.flipH()"
                  >
                    <lucide-icon [img]="FlipHorizontal" class="w-6 h-6"></lucide-icon>
                    <span class="text-sm font-medium">Horizontal</span>
                  </button>
                  <button
                    (click)="toggleFlipV()"
                    class="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-lg border transition-all duration-200"
                    [class.bg-cyan-500]="store.flipV()"
                    [class.border-cyan-400]="store.flipV()"
                    [class.text-white]="store.flipV()"
                    [class.bg-gray-800]="!store.flipV()"
                    [class.border-gray-700]="!store.flipV()"
                    [class.text-gray-400]="!store.flipV()"
                    [class.hover:bg-gray-700]="!store.flipV()"
                  >
                    <lucide-icon [img]="FlipVertical" class="w-6 h-6"></lucide-icon>
                    <span class="text-sm font-medium">Vertical</span>
                  </button>
                </div>
              </div>

              <div>
                <div class="flex justify-between items-center mb-3">
                  <h3 class="text-sm font-medium text-gray-400">Rotation</h3>
                  <span class="text-cyan-400 font-mono">{{ store.rotation() }}°</span>
                </div>
                
                <input
                  type="range"
                  [value]="store.rotation()"
                  (input)="onRotationChange($event)"
                  min="0"
                  max="360"
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 mb-4"
                />
                
                <div class="grid grid-cols-4 gap-2">
                  @for (angle of [0, 90, 180, 270]; track angle) {
                    <button
                      (click)="setRotation(angle)"
                      class="py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-300 text-xs hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      {{ angle }}°
                    </button>
                  }
                </div>
              </div>

              @if (store.videoMeta()) {
                <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 flex justify-between items-center">
                  <span class="text-sm text-gray-400">Output Dimensions</span>
                  <span class="text-cyan-400 font-mono font-semibold">
                    {{ outputDimensions().width }} × {{ outputDimensions().height }}
                  </span>
                </div>
              }
            </div>

            @if (store.status() === 'idle' || store.status() === 'error') {
              <button
                (click)="startProcessing()"
                class="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-[0_0_20px_rgba(0,245,255,0.1)] hover:shadow-[0_0_20px_rgba(0,245,255,0.3)]"
              >
                Apply Transformations
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
                  label="Applying transformations..."
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
                  defaultFilename="omni_flip_rotate"
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
export class FlipRotateComponent implements OnDestroy {
  store = inject(FlipRotateStore);
  service = inject(FlipRotateService);
  private destroyRef = inject(DestroyRef);
  
  readonly FlipHorizontal = FlipHorizontal;
  readonly FlipVertical = FlipVertical;
  readonly RotateCw = RotateCw;

  get inputUrl(): string | null {
    const file = this.store.inputFile();
    return file ? URL.createObjectURL(file) : null;
  }

  get outputUrl(): string | null {
    const blob = this.store.outputBlob();
    return blob ? URL.createObjectURL(blob) : null;
  }

  previewTransform = computed(() => {
    let transform = '';
    if (this.store.flipH()) transform += 'scaleX(-1) ';
    if (this.store.flipV()) transform += 'scaleY(-1) ';
    if (this.store.rotation() !== 0) transform += `rotate(${this.store.rotation()}deg) `;
    return transform.trim();
  });

  outputDimensions = computed(() => {
    const meta = this.store.videoMeta();
    if (!meta) return { width: 0, height: 0 };
    return this.service.calculateOutputDimensions(meta.width, meta.height, this.store.rotation());
  });

  onFileSelected(files: File[]) {
    if (files.length > 0) {
      this.store.loadFile({ file: files[0] });
    }
  }

  toggleFlipH() {
    this.store.updateConfig({ flipH: !this.store.flipH() });
  }

  toggleFlipV() {
    this.store.updateConfig({ flipV: !this.store.flipV() });
  }

  onRotationChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.store.updateConfig({ rotation: parseInt(input.value) });
  }

  setRotation(angle: number) {
    this.store.updateConfig({ rotation: angle });
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
