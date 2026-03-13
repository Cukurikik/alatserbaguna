import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ColorGradingActions, selectColorGradingState, ColorGradingState } from './color-grading.store';
import { ColorGradingService } from './color-grading.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

interface SliderDef { 
  label: string; 
  key: keyof ColorGradingState; 
  min: number; 
  max: number; 
  step: number; 
  icon: string;
  color: string;
}

@Component({
  selector: 'app-color-grading',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-orange-400 via-pink-500 to-purple-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Color Grading
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Chroma Engine: Spectral Manipulation</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-orange-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-orange-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Purge
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        <!-- Pillar 5: I/O — Input State -->
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full" [@slideUp]>
            <app-file-drop-zone accept="video/*" (fileDropped)="onFileSelected($event)"></app-file-drop-zone>
            
            <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div class="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Luminous Density</h4>
                    <p class="text-xs text-gray-500 mt-1">Surgical control over brightness and gamma curves. Expand dynamic range without crushing blacks.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-pink-500/5 border border-pink-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.172-1.172a4 4 0 115.656 5.656L15 13"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Chroma Vibrancy</h4>
                    <p class="text-xs text-gray-500 mt-1">High-fidelity saturation and hue shifting. Calibrate global spectral offsets with zero artifacts.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Spectrum -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                <!-- Spectral Overlay (Visual flair) -->
                <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 opacity-20 group-hover:opacity-60 transition-opacity"></div>

                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'RE-COLORING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-pink-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Re-mapping Spectral Data</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Normalizing Chroma Components</p>
                      </div>
                   </div>
                }
              </div>

              <!-- Filter Dashboard -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Exposure</span>
                       <span class="text-white font-mono text-xs">{{ vm.brightness >= 0 ? '+' : '' }}{{ vm.brightness.toFixed(2) }} EV</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-orange-500/60 uppercase tracking-widest leading-none mb-1">Gamma Curve</span>
                       <span class="text-orange-400 text-xl font-black tracking-tighter">{{ vm.gamma.toFixed(2) }}γ</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Spectrum Offset</span>
                       <span class="text-white text-xs">{{ vm.hue }}° Shift</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Filter Chain</span>
                       <span class="text-gray-400 font-mono text-[8px] tracking-tighter truncate">{{ getFilterString(vm) }}</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Settings Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                 
                 <div class="flex justify-between items-center mb-2">
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Chroma Controls</label>
                    <button (click)="onResetCorrection()" class="text-[8px] font-black text-orange-400 uppercase tracking-widest hover:text-orange-300 transition-colors">Reset All</button>
                 </div>

                 <div class="space-y-4">
                    @for (s of sliders; track s.key) {
                       <div class="p-4 bg-black/40 rounded-2xl border border-gray-800 group focus-within:border-orange-500/30 transition-all">
                          <div class="flex justify-between items-center mb-3">
                             <div class="flex items-center gap-2">
                                <span class="text-gray-600 group-focus-within:text-orange-400 transition-colors" [innerHTML]="s.icon"></span>
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-wide group-focus-within:text-white transition-colors">{{ s.label }}</span>
                             </div>
                             <span class="text-[10px] font-mono font-black" [class]="'text-' + s.color + '-400'">{{ getVal(vm, s.key).toFixed(2) }}</span>
                          </div>
                          <input type="range" [min]="s.min" [max]="s.max" [step]="s.step" [value]="getVal(vm, s.key)" 
                            (input)="onSlider(s.key, $event)"
                            class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500">
                       </div>
                    }
                 </div>

                 <!-- Action Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onApplyGrade(vm)"
                         class="w-full bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.172-1.172a4 4 0 115.656 5.656L15 13"/></svg>
                         Execute Grade
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Spectral Map
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Modified Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Computing Spectral Shift...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase tracking-tight">Spectral Alignment Error</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Pixel buffer divergence' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onApplyGrade(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Re-sync Chroma</button>
                            }
                          </div>
                       </div>
                    }
                 </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorGradingComponent implements OnDestroy {
  private store = inject(Store);
  private colorService = inject(ColorGradingService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectColorGradingState);
  videoUrl: string | null = null;

  readonly sliders: SliderDef[] = [
    { label: 'Brightness', key: 'brightness', min: -1, max: 1, step: 0.01, icon: '🔅', color: 'orange' },
    { label: 'Contrast', key: 'contrast', min: 0, max: 2, step: 0.01, icon: '🌓', color: 'blue' },
    { label: 'Saturation', key: 'saturation', min: 0, max: 2, step: 0.01, icon: '🌈', color: 'pink' },
    { label: 'Gamma', key: 'gamma', min: 0.1, max: 3, step: 0.01, icon: '📉', color: 'purple' },
    { label: 'Hue Shift', key: 'hue', min: -180, max: 180, step: 1, icon: '🌀', color: 'teal' },
    { label: 'Sharpness', key: 'sharpness', min: -1, max: 1, step: 0.01, icon: '✨', color: 'yellow' },
  ];

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(ColorGradingActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(ColorGradingActions.loadMetaSuccess({
      meta: {
        filename: 'video',
        fileSizeMB: 0,
        duration,
        width: 1920,
        height: 1080,
        fps: 30,
        codec: 'h264',
        audioCodec: 'aac',
        audioBitrate: 128,
        videoBitrate: 0,
        hasAudio: true,
        aspectRatio: '16:9',
      }
    }));
  }

  getVal(state: ColorGradingState, key: keyof ColorGradingState): number {
    return state[key] as number;
  }

  onSlider(key: keyof ColorGradingState, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    switch(key) {
      case 'brightness': this.store.dispatch(ColorGradingActions.setBrightness({ brightness: val })); break;
      case 'contrast': this.store.dispatch(ColorGradingActions.setContrast({ contrast: val })); break;
      case 'saturation': this.store.dispatch(ColorGradingActions.setSaturation({ saturation: val })); break;
      case 'gamma': this.store.dispatch(ColorGradingActions.setGamma({ gamma: val })); break;
      case 'hue': this.store.dispatch(ColorGradingActions.setHue({ hue: val })); break;
      case 'sharpness': this.store.dispatch(ColorGradingActions.setSharpness({ sharpness: val })); break;
    }
  }

  getFilterString(state: ColorGradingState): string {
    return `eq=b=${state.brightness}:c=${state.contrast}:s=${state.saturation}:g=${state.gamma},hue=h=${state.hue}`;
  }

  onResetCorrection(): void { this.store.dispatch(ColorGradingActions.resetCorrection()); }

  onApplyGrade(state: ColorGradingState): void {
    if (!state.inputFile) return;
    
    this.store.dispatch(ColorGradingActions.startProcessing());
    
    this.subscription.add(
      this.colorService.process({
        file: state.inputFile,
        brightness: state.brightness,
        contrast: state.contrast,
        saturation: state.saturation,
        gamma: state.gamma,
        hue: state.hue,
        sharpness: state.sharpness
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(ColorGradingActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(ColorGradingActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(ColorGradingActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Spectral shift failed. Check hardware.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: ColorGradingState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.colorService.getOutputFilename(state.inputFile?.name || 'video');
      const a = Object.assign(document.createElement('a'), { 
        href: url, 
        download: filename 
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
    this.store.dispatch(ColorGradingActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}