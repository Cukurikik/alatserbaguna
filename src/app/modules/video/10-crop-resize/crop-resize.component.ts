import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { CropResizeActions, selectCropResizeState, CropResizeState } from './crop-resize.store';
import { CropResizeService } from './crop-resize.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

const PRESET_SCALES = [
  { label: '4K', w: 3840, h: 2160 },
  { label: '1080p', w: 1920, h: 1080 },
  { label: '720p', w: 1280, h: 720 },
  { label: '480p', w: 854, h: 480 },
  { label: 'Square', w: 1080, h: 1080 },
  { label: 'Mobile', w: 1080, h: 1920 },
];

@Component({
  selector: 'app-crop-resize',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-lime-400 via-green-500 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Crop & Resize
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Geometry Engine: Spatial Refinement</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-lime-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-lime-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Erase
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
               <div class="p-6 rounded-2xl bg-lime-500/5 border border-lime-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-lime-500/10 rounded-xl flex items-center justify-center text-lime-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758L5 19m0-14l4.121 4.121"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Coordinate Cropping</h4>
                    <p class="text-xs text-gray-500 mt-1">Extract specific viewport regions with pixel precision. Ideal for removing bars or centering subjects.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Dynamic Scaling</h4>
                    <p class="text-xs text-gray-500 mt-1">Resample video dimensions using high-frequency lanczos algorithms for professional downscaling.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Grid -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                <!-- Crop Visualizer Overlay -->
                @if (vm.mode === 'crop' && vm.cropRegion) {
                   <div class="absolute inset-0 pointer-events-none border-2 border-dashed border-lime-500/30 z-10"
                     [style.left.%]="(vm.cropRegion.x / (vm.videoMeta?.width || 1)) * 100"
                     [style.top.%]="(vm.cropRegion.y / (vm.videoMeta?.height || 1)) * 100"
                     [style.width.%]="(vm.cropRegion.w / (vm.videoMeta?.width || 1)) * 100"
                     [style.height.%]="(vm.cropRegion.h / (vm.videoMeta?.height || 1)) * 100">
                      <div class="absolute top-0 left-0 p-1 bg-lime-500 text-black text-[8px] font-black uppercase">Active Crop</div>
                   </div>
                }

                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-20" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'REFINING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-lime-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Re-calculating Spatial Vectors</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Interpolating Pixel Matrix</p>
                      </div>
                   </div>
                }
              </div>

              <!-- Metadata Dashboard -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Source Dim</span>
                       <span class="text-white font-mono text-xs">{{ vm.videoMeta?.width }}x{{ vm.videoMeta?.height }} Px</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-lime-500/60 uppercase tracking-widest leading-none mb-1">Target Output</span>
                       <span class="text-lime-400 text-xl font-black tracking-tighter">
                          {{ vm.mode === 'crop' ? vm.cropRegion?.w : vm.targetWidth }}x{{ vm.mode === 'crop' ? vm.cropRegion?.h : vm.targetHeight }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Logic Pattern</span>
                       <span class="text-white text-[10px] uppercase font-black">
                          {{ vm.mode }} / {{ vm.padMode }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">WASM Heap</span>
                       <span class="text-gray-400 font-mono text-[10px] tracking-tighter">0x{{ (vm.inputFile?.size || 0).toString(16).toUpperCase() }}</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-lime-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Settings Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                 
                 <!-- Mode Toggle -->
                 <div class="p-1 bg-black/40 rounded-2xl border border-gray-800 flex overflow-hidden">
                    <button (click)="onSetMode('crop')"
                      [class]="vm.mode === 'crop' ? 'bg-lime-500 text-lime-950 font-black' : 'text-gray-500 hover:text-white'"
                      class="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">✂️ Crop</button>
                    <button (click)="onSetMode('resize')"
                      [class]="vm.mode === 'resize' ? 'bg-lime-500 text-lime-950 font-black' : 'text-gray-500 hover:text-white'"
                      class="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">⇔ Resize</button>
                 </div>

                 @if (vm.mode === 'crop') {
                    <!-- Crop Controls -->
                    <div class="grid grid-cols-2 gap-3" [@slideUp]>
                       @for (f of ['x', 'y', 'w', 'h']; track f) {
                          <div class="p-4 bg-black/40 rounded-2xl border border-gray-800 group focus-within:border-lime-500/50 transition-all">
                             <label class="block text-[8px] font-black text-gray-600 uppercase mb-2 leading-none">{{ f }} Offset</label>
                             <input type="number" [value]="getCropVal(vm, f)" (input)="updateCrop(vm, f, $event)"
                               class="w-full bg-transparent text-white font-mono text-sm outline-none border-none p-0">
                          </div>
                       }
                    </div>
                 } @else {
                    <!-- Resize Controls -->
                    <div class="space-y-6" [@slideUp]>
                       <div class="grid grid-cols-3 gap-2">
                          @for (p of presets; track p.label) {
                             <button (click)="onSetPreset(p)"
                               [class]="vm.targetWidth === p.w ? 'bg-lime-500/10 border-lime-500/40 text-white' : 'bg-black/20 border-gray-800 text-gray-600'"
                               class="py-3 px-1 rounded-xl border text-[9px] font-black uppercase tracking-tighter transition-all hover:border-lime-500/20 active:scale-95">
                                {{ p.label }}
                             </button>
                          }
                       </div>
                       
                       <div class="flex items-center justify-between px-2">
                          <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Maintain Aspect</label>
                          <button (click)="onToggleLock()" [class]="vm.lockAspectRatio ? 'text-lime-500' : 'text-gray-600'"
                            class="p-2 rounded-lg bg-black/40 border border-gray-800 transition-all shadow-xl active:scale-90">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                          </button>
                       </div>
                    </div>
                 }

                 <!-- Pad Mode -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Interpolation Logic</label>
                    <div class="flex flex-col gap-2">
                       @for (opt of ['pad', 'stretch', 'crop-to-fit']; track opt) {
                          <button (click)="onSetPadMode(opt)"
                            [class]="vm.padMode === opt ? 'bg-lime-500/10 border-lime-500/40 text-white' : 'bg-black/20 border-gray-800 text-gray-600'"
                            class="flex items-center justify-between p-4 rounded-2xl border transition-all text-left">
                             <span class="text-[10px] font-black uppercase">{{ opt }}</span>
                             @if (vm.padMode === opt) { <div class="w-1.5 h-1.5 rounded-full bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.8)]"></div> }
                          </button>
                       }
                    </div>
                 </div>

                 <!-- Action Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onApplyGeometry(vm)"
                         class="w-full bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-lime-950 font-black py-4 rounded-2xl shadow-xl shadow-lime-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                         Refine Geometry
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Save Definition
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Processed Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Mapping Frame Context...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase tracking-tight">VFS Segmentation Error</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Pixel buffer overflow' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onApplyGeometry(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Re-init Buffer</button>
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
export class CropResizeComponent implements OnDestroy {
  private store = inject(Store);
  private crService = inject(CropResizeService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectCropResizeState);
  readonly presets = PRESET_SCALES;
  videoUrl: string | null = null;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(CropResizeActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(CropResizeActions.loadMetaSuccess({
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

  onSetMode(mode: 'crop' | 'resize'): void { this.store.dispatch(CropResizeActions.setMode({ mode })); }
  onSetPadMode(padMode: string): void { this.store.dispatch(CropResizeActions.setPadMode({ padMode: padMode as any })); }
  onToggleLock(): void { this.store.dispatch(CropResizeActions.toggleLockAspect()); }

  getCropVal(state: CropResizeState, key: string): number {
    return (state.cropRegion as any)?.[key] || 0;
  }

  updateCrop(state: CropResizeState, key: string, event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    this.store.dispatch(CropResizeActions.setCropRegion({ 
      region: { ...state.cropRegion!, [key]: val } 
    }));
  }

  onSetPreset(p: { w: number, h: number }): void {
    this.store.dispatch(CropResizeActions.setTargetWidth({ width: p.w }));
    this.store.dispatch(CropResizeActions.setTargetHeight({ height: p.h }));
  }

  onApplyGeometry(state: CropResizeState): void {
    if (!state.inputFile || !state.videoMeta) return;
    
    this.store.dispatch(CropResizeActions.startProcessing());
    
    this.subscription.add(
      this.crService.process({
        file: state.inputFile,
        mode: state.mode,
        cropRegion: state.cropRegion || undefined,
        targetWidth: state.targetWidth || undefined,
        targetHeight: state.targetHeight || undefined,
        padMode: state.padMode,
        videoMeta: state.videoMeta
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(CropResizeActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(CropResizeActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(CropResizeActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Spatial interpolation failed. Check memory.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: CropResizeState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.crService.getOutputFilename(state.inputFile?.name || 'video', state.mode);
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
    this.store.dispatch(CropResizeActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}