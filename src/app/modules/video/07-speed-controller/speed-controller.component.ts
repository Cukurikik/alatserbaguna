import { Component, ChangeDetectionStrategy, inject, OnDestroy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpeedStore } from './speed-controller.store';
import { SpeedControllerService } from './speed-controller.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ExportPanelComponent } from '../shared/components/export-panel/export-panel.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { LucideAngularModule, FastForward, Volume2, VolumeX, Sparkles } from 'lucide-angular';

@Component({
  selector: 'app-speed-controller',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, FileDropZoneComponent, VideoPreviewComponent, ExportPanelComponent, ProgressRingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-8">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-white flex items-center gap-3">
          <lucide-icon [img]="FastForward" class="w-8 h-8 text-cyan-400"></lucide-icon>
          Speed Controller
        </h1>
        <p class="text-gray-400 mt-2">Change video playback speed (0.25x to 4x) with pitch-corrected audio.</p>
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
              <div>
                <h3 class="text-lg font-semibold text-white mb-4">Playback Speed</h3>
                <div class="grid grid-cols-4 gap-2 mb-4">
                  @for (preset of speedPresets; track preset) {
                    <button
                      (click)="setSpeed(preset)"
                      class="py-2 rounded-lg text-sm font-medium transition-all duration-200"
                      [class.bg-cyan-500]="store.speed() === preset"
                      [class.text-white]="store.speed() === preset"
                      [class.bg-gray-800]="store.speed() !== preset"
                      [class.text-gray-400]="store.speed() !== preset"
                      [class.hover:bg-gray-700]="store.speed() !== preset"
                      [class.border-cyan-400]="store.speed() === preset"
                      [class.border]="store.speed() === preset"
                      [class.shadow-[0_0_10px_rgba(0,245,255,0.3)]]="store.speed() === preset"
                    >
                      {{ preset }}x
                    </button>
                  }
                </div>
                
                <div class="flex items-center gap-4">
                  <label for="custom-speed" class="text-sm text-gray-400 whitespace-nowrap">Custom Speed:</label>
                  <input
                    id="custom-speed"
                    type="number"
                    [value]="store.speed()"
                    (blur)="onCustomSpeedBlur($event)"
                    step="0.1"
                    min="0.25"
                    max="4.0"
                    class="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-400">Original:</span>
                  <span class="text-gray-300 font-mono">{{ formatDuration(store.originalDuration()) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">New duration:</span>
                  <span class="text-cyan-400 font-mono font-semibold">{{ formatDuration(store.newDuration()) }}</span>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-400 mb-3">Audio Options</h3>
                <div class="space-y-2">
                  <label class="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-800 transition-colors">
                    <input type="radio" name="audioMode" value="keep" [checked]="store.audioMode() === 'keep'" (change)="setAudioMode('keep')" class="accent-cyan-500" />
                    <lucide-icon [img]="Volume2" class="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"></lucide-icon>
                    <span class="text-sm text-gray-300 group-hover:text-white transition-colors">Keep audio (resample)</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-800 transition-colors">
                    <input type="radio" name="audioMode" value="mute" [checked]="store.audioMode() === 'mute'" (change)="setAudioMode('mute')" class="accent-cyan-500" />
                    <lucide-icon [img]="VolumeX" class="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"></lucide-icon>
                    <span class="text-sm text-gray-300 group-hover:text-white transition-colors">Mute audio</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-800 transition-colors">
                    <input type="radio" name="audioMode" value="pitchCorrect" [checked]="store.audioMode() === 'pitchCorrect'" (change)="setAudioMode('pitchCorrect')" class="accent-cyan-500" />
                    <lucide-icon [img]="Sparkles" class="w-4 h-4 text-purple-400"></lucide-icon>
                    <span class="text-sm text-gray-300 group-hover:text-white transition-colors">Pitch-correct audio</span>
                    <span class="text-[10px] uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full ml-auto">AI</span>
                  </label>
                </div>
              </div>
            </div>

            @if (store.status() === 'idle' || store.status() === 'error') {
              <button
                (click)="startProcessing()"
                class="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-[0_0_20px_rgba(0,245,255,0.1)] hover:shadow-[0_0_20px_rgba(0,245,255,0.3)]"
              >
                Apply Speed Change
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
                  label="Processing video..."
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
                  defaultFilename="omni_speed_video"
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
export class SpeedControllerComponent implements OnDestroy {
  store = inject(SpeedStore);
  service = inject(SpeedControllerService);
  private destroyRef = inject(DestroyRef);
  
  readonly FastForward = FastForward;
  readonly Volume2 = Volume2;
  readonly VolumeX = VolumeX;
  readonly Sparkles = Sparkles;

  speedPresets = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

  get outputUrl(): string | null {
    const blob = this.store.outputBlob();
    return blob ? URL.createObjectURL(blob) : null;
  }

  onFileSelected(files: File[]) {
    if (files.length > 0) {
      this.store.loadFile({ file: files[0] });
    }
  }

  setSpeed(speed: number) {
    this.store.updateConfig({ speed });
  }

  onCustomSpeedBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = parseFloat(input.value);
    if (isNaN(val)) val = 1.0;
    val = Math.max(0.25, Math.min(4.0, val));
    input.value = val.toString();
    this.store.updateConfig({ speed: val });
  }

  setAudioMode(mode: 'keep' | 'mute' | 'pitchCorrect') {
    this.store.updateConfig({ audioMode: mode });
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
