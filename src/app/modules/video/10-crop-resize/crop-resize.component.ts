import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { CropResizeActions, selectCropResizeState, CropResizeState } from './crop-resize.store';
import { CropResizeService } from './crop-resize.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

const PRESET_SCALES = [
  { label: '4K_UHD', w: 3840, h: 2160 },
  { label: 'FHD_1080', w: 1920, h: 1080 },
  { label: 'HD_720', w: 1280, h: 720 },
  { label: 'SD_480', w: 854, h: 480 },
  { label: 'SQUARE', w: 1080, h: 1080 },
  { label: 'VERTICAL', w: 1080, h: 1920 },
];

@Component({
  selector: 'app-crop-resize',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-lime-400 via-green-500 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Geometry Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Geometry Engine: Spatial Refinement v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-lime-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-lime-950/30 transition-colors">
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
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-lime-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-lime-500/10 rounded-2xl flex items-center justify-center text-lime-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-xl shadow-lime-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758L5 19m0-14l4.121 4.121"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">Coordinate Cropping</h4>
                    <p class="text-[10px] text-gray-500 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">Extract specific viewport regions with pixel precision. Ideal for removing bars or centering subjects in low-level buffers.</p>
                  </div>
               </div>
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-emerald-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-xl shadow-emerald-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">Dynamic Scaling</h4>
                    <p class="text-[10px] text-gray-400 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">Resample video dimensions using high-frequency Lanczos algorithms for professional downscaling and upscaling.</p>
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
                
                <!-- Crop Visualizer Overlay -->
                @if (vm.mode === 'crop' && vm.cropRegion) {
                   <div class="absolute inset-0 pointer-events-none border-2 border-dashed border-lime-500/40 z-10 shadow-[0_0_50px_rgba(132,204,22,0.1)]"
                     [style.left.%]="(vm.cropRegion.x / (vm.videoMeta?.width || 1)) * 100"
                     [style.top.%]="(vm.cropRegion.y / (vm.videoMeta?.height || 1)) * 100"
                     [style.width.%]="(vm.cropRegion.w / (vm.videoMeta?.width || 1)) * 100"
                     [style.height.%]="(vm.cropRegion.h / (vm.videoMeta?.height || 1)) * 100">
                      <div class="absolute top-0 left-0 px-2 py-0.5 bg-lime-500 text-lime-950 text-[8px] font-black uppercase italic tracking-widest">Active_Viewport</div>
                   </div>
                }

                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-gray-950/70 backdrop-blur-md flex flex-col items-center justify-center z-20" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'REFINING'"></app-progress-ring>
                      <div class="mt-8 flex flex-col items-center gap-2">
                         <span class="text-lime-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse italic font-black">Geometry_Core_Processing</span>
                         <span class="text-gray-500 font-mono text-[8px] uppercase tracking-widest opacity-60 italic">Interpolating Pixel Matrix...</span>
                      </div>
                   </div>
                }
              </div>

              <!-- Metadata Dashboard -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-lime-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">Source_Dim</span>
                    <span class="text-white font-mono text-xs font-black italic tracking-tighter">{{ vm.videoMeta?.width }}x{{ vm.videoMeta?.height }} Px</span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-lime-500/20 transition-colors">
                    <span class="text-[10px] font-black text-lime-500 uppercase tracking-widest italic opacity-60 leading-none">Target_Output</span>
                    <span class="text-lime-400 font-mono text-xs font-black italic tracking-tighter uppercase">
                       {{ vm.mode === 'crop' ? vm.cropRegion?.w : vm.targetWidth }}x{{ vm.mode === 'crop' ? vm.cropRegion?.h : vm.targetHeight }} Px
                    </span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-lime-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">Interpolation</span>
                    <span class="text-white font-mono text-[10px] font-black italic tracking-tighter uppercase">{{ vm.padMode }}</span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-lime-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">VFS_Pointer</span>
                    <span class="text-white font-mono text-xs font-black italic tracking-tighter uppercase">0x{{ (vm.inputFile.size || 0).toString(16).toUpperCase() }}</span>
                 </div>
              </div>
            </div>

            <div class="w-full lg:w-[420px] shrink-0 flex flex-col gap-8">
              
              <!-- Settings Panel -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-[2.5rem] p-10 flex flex-col gap-10 shadow-2xl relative overflow-hidden">
                 <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-lime-500/20 to-transparent"></div>
                 
                 <!-- Mode Toggle -->
                 <div class="p-1.5 bg-black/40 rounded-[1.8rem] border border-gray-800 flex overflow-hidden shadow-inner">
                    <button (click)="onSetMode('crop')"
                      [class]="vm.mode === 'crop' ? 'bg-lime-500 text-lime-950 font-black shadow-lg rounded-2xl scale-100' : 'text-gray-500 hover:text-white scale-95'"
                      class="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all italic">✂️ Crop</button>
                    <button (click)="onSetMode('resize')"
                      [class]="vm.mode === 'resize' ? 'bg-lime-500 text-lime-950 font-black shadow-lg rounded-2xl scale-100' : 'text-gray-500 hover:text-white scale-95'"
                      class="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all italic">⇔ Resize</button>
                 </div>

                 <!-- Geometry Controls -->
                 <div class="p-8 bg-black/40 rounded-[2rem] border border-gray-800 shadow-xl group hover:border-lime-500/20 transition-colors duration-500">
                    @if (vm.mode === 'crop') {
                       <div class="space-y-6" [@slideUp]>
                          <label class="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60 mb-2">Viewport_Offset</label>
                          <div class="grid grid-cols-2 gap-4">
                             @for (f of ['x', 'y', 'w', 'h']; track f) {
                                <div class="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-2 hover:border-lime-500/30 transition-colors">
                                   <span class="text-[8px] font-black text-lime-500/60 uppercase italic">{{ f }}_VEC</span>
                                   <input type="number" [value]="getCropVal(vm, f)" (input)="updateCrop(vm, f, $event)"
                                     class="w-full bg-transparent text-white font-mono text-sm font-black outline-none italic">
                                </div>
                             }
                          </div>
                       </div>
                    } @else {
                       <div class="space-y-8" [@slideUp]>
                          <div class="flex justify-between items-center mb-2">
                             <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60">Resolution_Presets</label>
                             <button (click)="onToggleLock()" [class]="vm.lockAspectRatio ? 'text-lime-500 shadow-[0_0_10px_rgba(132,204,22,0.3)]' : 'text-gray-600'"
                               class="p-2.5 rounded-xl bg-gray-800/50 border border-white/5 transition-all active:scale-95 shadow-lg">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                             </button>
                          </div>
                          
                          <div class="grid grid-cols-3 gap-2">
                             @for (p of presets; track p.label) {
                                <button (click)="onSetPreset(p)"
                                  [class]="vm.targetWidth === p.w && vm.targetHeight === p.h ? 'bg-lime-500 text-lime-950 font-black shadow-lg' : 'bg-white/5 text-gray-500 border-white/5 hover:text-white'"
                                  class="py-3 px-1 rounded-xl border text-[9px] font-black uppercase tracking-tighter transition-all active:scale-95 italic">
                                   {{ p.label }}
                                </button>
                             }
                          </div>
                       </div>
                    }
                 </div>

                 <!-- Interpolation Logic -->
                 <div class="p-8 bg-black/40 rounded-[2rem] border border-gray-800 shadow-xl group hover:border-lime-500/20 transition-colors duration-500">
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60 mb-6">Pipeline_Interpolation</label>
                    <div class="flex flex-col gap-2">
                       @for (opt of ['pad', 'stretch', 'crop-to-fit']; track opt) {
                          <button (click)="onSetPadMode(opt)"
                            [class]="vm.padMode === opt ? 'bg-lime-500/10 border-lime-500/40 text-white shadow-inner' : 'bg-white/5 border-white/5 text-gray-600 opacity-60'"
                            class="flex items-center justify-between p-5 rounded-2xl border transition-all text-left group/opt">
                             <span class="text-[10px] font-black uppercase italic tracking-widest">{{ opt }}</span>
                             @if (vm.padMode === opt) { 
                               <div class="w-2 h-2 rounded-full bg-lime-500 shadow-[0_0_12px_rgba(132,204,22,0.8)]"></div> 
                             } @else {
                               <div class="w-2 h-2 rounded-full bg-gray-800 group-hover/opt:bg-gray-700 transition-colors"></div>
                             }
                          </button>
                       }
                    </div>
                 </div>

                 <!-- Action Button Area -->
                 <div class="pt-6 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onApplyGeometry(vm)"
                         class="w-full bg-gradient-to-r from-lime-600 to-emerald-600 hover:opacity-90 text-lime-950 font-black py-5 rounded-2xl shadow-2xl shadow-lime-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-4 italic">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                         Execute Geometry Shift
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-4" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 group italic">
                            <svg class="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Geometry Result
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-black font-mono text-emerald-500/60 uppercase tracking-[0.3em] italic">Density_Verified: {{ vm.outputSizeMB | number:'1.2-2' }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-16 w-full bg-gray-950/40 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-800/50 opacity-40">
                          <span class="text-[10px] font-black font-mono text-gray-500 uppercase tracking-[0.4em] animate-pulse italic">Re-mapping_Pixels...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-6 p-6 bg-rose-500/5 border border-rose-500/20 rounded-[1.5rem] flex items-start gap-4 animate-in shake-1 duration-500" [@fadeIn]>
                          <div class="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 shrink-0 shadow-lg">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-white font-black text-xs uppercase tracking-tight italic">Coordinate_Geometry_Fault</p>
                            <p class="text-rose-400 font-black font-mono text-[9px] mt-1.5 leading-relaxed uppercase tracking-wider opacity-80 italic line-clamp-2">{{ vm.errorMessage || 'Unknown pixel matrix overflow' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onApplyGeometry(vm)" class="mt-4 text-[9px] font-black uppercase text-white border-b-2 border-white/10 hover:border-lime-500 transition-all hover:text-lime-400 tracking-[0.2em] italic">Retry_Attempt_Ops</button>
                            }
                          </div>
                       </div>
                    }
                 </div>
              </div>

              <!-- Technical Command visualizer -->
              <div class="bg-gray-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-gray-800 shadow-inner">
                 <h4 class="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4 italic opacity-60">Geometry_Kernel_Visualizer</h4>
                 <div class="bg-black/60 p-5 rounded-2xl border border-white/5 font-mono group overflow-hidden relative">
                    <div class="text-[9px] text-lime-400/80 leading-relaxed uppercase tracking-widest italic group-hover:scale-105 transition-transform duration-500">
                       <span class="opacity-40">ffmpeg -i src.mp4 -vf</span> 
                       <span class="font-black text-white px-1.5 py-0.5 bg-lime-500/20 rounded-md mx-1 shadow-sm border border-lime-500/20">
                          {{ vm.mode === 'crop' ? 'crop=' + vm.cropRegion?.w + ':' + vm.cropRegion?.h : 'scale=' + vm.targetWidth + ':' + vm.targetHeight }}
                       </span>
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
            message: err.message ?? 'Spatial interpolation failed. Matrix shift divergence.',
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
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
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