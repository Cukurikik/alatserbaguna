import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
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
  unit: string;
}

@Component({
  selector: 'app-color-grading',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-orange-400 via-pink-500 to-purple-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Ghost Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Chroma Engine: Spectral Manipulation v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-orange-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-orange-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Purge Payload
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        @if (!vm.inputFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-20" [@slideUp]>
            <app-file-drop-zone 
              accept="video/*" 
              (fileDropped)="onFileSelected($event)"
              class="w-full">
            </app-file-drop-zone>
            
            <div class="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-orange-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-xl shadow-orange-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">Luminous Density</h4>
                    <p class="text-[10px] text-gray-500 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">Surgical control over brightness and gamma curves. Expand dynamic range without crushing blacks in the byte-stream.</p>
                  </div>
               </div>
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-pink-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-xl shadow-pink-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.172-1.172a4 4 0 115.656 5.656L15 13"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">Chroma Vibrancy</h4>
                    <p class="text-[10px] text-gray-400 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">High-fidelity saturation and hue shifting. Calibrate global spectral offsets with zero artifacts using WASM color kernels.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0" [@fadeIn]>
            
            <div class="flex-1 flex flex-col gap-8 min-h-0">
              <div class="relative group rounded-[2.5rem] overflow-hidden border border-gray-800 shadow-2xl bg-black/40 backdrop-blur-md flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                <!-- Spectral Overlay -->
                <div class="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 via-green-500 via-blue-500 via-purple-500 to-pink-500 opacity-20 group-hover:opacity-60 transition-opacity"></div>

                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-gray-950/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'RE-COLORING'"></app-progress-ring>
                      <div class="mt-8 flex flex-col items-center gap-2">
                         <span class="text-pink-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse italic font-black">Chroma_Core_Warping</span>
                         <span class="text-gray-500 font-mono text-[8px] uppercase tracking-widest opacity-60 italic">Normalizing Spectral Components...</span>
                      </div>
                   </div>
                }
              </div>

              <!-- Metadata Metrics -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-orange-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">Exposure_State</span>
                    <span class="text-white font-mono text-xs font-black italic tracking-tighter">{{ vm.brightness >= 0 ? '+' : '' }}{{ vm.brightness | number:'1.2-2' }} EV</span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-orange-500/20 transition-colors">
                    <span class="text-[10px] font-black text-orange-500 uppercase tracking-widest italic opacity-60 leading-none">Gamma_Curve</span>
                    <span class="text-orange-400 font-mono text-xs font-black italic tracking-tighter">{{ vm.gamma | number:'1.2-2' }} G-REF</span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-orange-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">Spectral_Offset</span>
                    <span class="text-white font-mono text-xs font-black italic tracking-tighter">{{ vm.hue }}° SHIFT</span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-orange-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">VFS_Memory</span>
                    <span class="text-white font-mono text-xs font-black italic tracking-tighter uppercase">0x{{ (vm.inputFile.size || 0).toString(16).toUpperCase() }}</span>
                 </div>
              </div>
            </div>

            <div class="w-full lg:w-[420px] shrink-0 flex flex-col gap-8">
              
              <!-- Settings Panel -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-[2.5rem] p-10 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                 <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
                 
                 <div class="flex justify-between items-center mb-2 px-2">
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60">Chroma_Parameters</label>
                    <button (click)="onResetCorrection()" class="text-[9px] font-black text-orange-400 uppercase tracking-widest hover:text-orange-300 transition-colors italic border-b border-orange-400/20">Purge_Reset</button>
                 </div>

                 <!-- Scoped Sliders -->
                 <div class="space-y-4">
                    @for (s of sliders; track s.key) {
                       <div class="p-6 bg-black/40 rounded-[2rem] border border-gray-800 group focus-within:border-orange-500/30 transition-all duration-500 shadow-xl">
                          <div class="flex justify-between items-center mb-4">
                             <div class="flex items-center gap-3">
                                <span class="text-lg opacity-80 shrink-0 group-hover:scale-125 transition-transform duration-500">{{ s.icon }}</span>
                                <span class="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] group-focus-within:text-white transition-colors italic">{{ s.label }}</span>
                             </div>
                             <span class="text-[10px] font-mono font-black" [class]="'text-' + s.color + '-400'">{{ getVal(vm, s.key) | number:'1.2-2' }}{{ s.unit }}</span>
                          </div>
                          <input type="range" [min]="s.min" [max]="s.max" [step]="s.step" [value]="getVal(vm, s.key)" 
                            (input)="onSlider(s.key, $event)"
                            class="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none shadow-inner">
                       </div>
                    }
                 </div>

                 <!-- Action Button Area -->
                 <div class="pt-6 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onApplyGrade(vm)"
                         class="w-full bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 hover:opacity-90 text-white font-black py-5 rounded-2xl shadow-2xl shadow-orange-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-4 italic">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.172-1.172a4 4 0 115.656 5.656L15 13"/></svg>
                         Execute Grade
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-4" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 group italic">
                            <svg class="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Spectral Map
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-black font-mono text-emerald-500/60 uppercase tracking-[0.3em] italic">Density_Verified: {{ vm.outputSizeMB | number:'1.2-2' }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-16 w-full bg-gray-950/40 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-800/50 opacity-40">
                          <span class="text-[10px] font-black font-mono text-gray-500 uppercase tracking-[0.4em] animate-pulse italic">Aligning_Atoms...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-6 p-6 bg-rose-500/5 border border-rose-500/20 rounded-[1.5rem] flex items-start gap-4 animate-in shake-1 duration-500" [@fadeIn]>
                          <div class="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 shrink-0 shadow-lg">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-white font-black text-xs uppercase tracking-tight italic">Spectral_Alignment_Fault</p>
                            <p class="text-rose-400 font-black font-mono text-[9px] mt-1.5 leading-relaxed uppercase tracking-wider opacity-80 italic line-clamp-2">{{ vm.errorMessage || 'Unknown chroma divergence error' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onApplyGrade(vm)" class="mt-4 text-[9px] font-black uppercase text-white border-b-2 border-white/10 hover:border-orange-500 transition-all hover:text-orange-400 tracking-[0.2em] italic">Retry_Attempt_Ops</button>
                            }
                          </div>
                       </div>
                    }
                 </div>
              </div>

              <!-- Technical Command visualizer -->
              <div class="bg-gray-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-gray-800 shadow-inner">
                 <h4 class="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4 italic opacity-60">Engine_Filter_Visualizer</h4>
                 <div class="bg-black/60 p-5 rounded-2xl border border-white/5 font-mono group overflow-hidden relative">
                    <div class="text-[9px] text-orange-400/80 leading-relaxed uppercase tracking-widest italic group-hover:scale-105 transition-transform duration-500">
                       <span class="opacity-40">ffmpeg -i src.mp4 -vf</span> 
                       <span class="font-black text-white px-1.5 py-0.5 bg-orange-500/20 rounded-md mx-1 shadow-sm border border-orange-500/20">{{ getFilterString(vm) }}</span>
                       <span class="opacity-40">dst.mp4</span>
                    </div>
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
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
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
    { label: 'Brightness', key: 'brightness', min: -1, max: 1, step: 0.01, icon: '🔅', color: 'orange', unit: 'ev' },
    { label: 'Contrast', key: 'contrast', min: 0, max: 2, step: 0.01, icon: '🌓', color: 'blue', unit: 'x' },
    { label: 'Saturation', key: 'saturation', min: 0, max: 2, step: 0.01, icon: '🌈', color: 'pink', unit: 'x' },
    { label: 'Gamma', key: 'gamma', min: 0.1, max: 3, step: 0.01, icon: '📉', color: 'purple', unit: 'y' },
    { label: 'Hue Shift', key: 'hue', min: -180, max: 180, step: 1, icon: '🌀', color: 'teal', unit: '°' },
    { label: 'Sharpness', key: 'sharpness', min: -1, max: 1, step: 0.01, icon: '✨', color: 'yellow', unit: 'f' },
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
            message: err.message ?? 'Spectral shift failed. Atomic buffer alignment lost.',
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
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
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