import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { FlipRotateActions, selectFlipRotateState, FlipRotateState } from './flip-rotate.store';
import { FlipRotateService } from './flip-rotate.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-flip-rotate',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-fuchsia-400 via-pink-500 to-rose-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Matrix Shift
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Matrix Engine: Spatial Transformation v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-fuchsia-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-fuchsia-950/30 transition-colors">
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
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-fuchsia-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center text-fuchsia-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-xl shadow-fuchsia-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">Axis Mirroring</h4>
                    <p class="text-[10px] text-gray-500 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">Reflect video coordinates instantly. Supports Horizontal (x-axis) and Vertical (y-axis) inversion via hardware-accelerated buffers.</p>
                  </div>
               </div>
               <div class="p-8 rounded-[2.5rem] bg-gray-900/40 border border-gray-800 backdrop-blur-md flex items-start gap-6 group hover:border-pink-500/30 transition-all duration-500">
                  <div class="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-xl shadow-pink-500/5">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-black text-sm uppercase tracking-tight italic">Angular Rotation</h4>
                    <p class="text-[10px] text-gray-400 mt-2 leading-relaxed font-medium uppercase tracking-widest opacity-60 italic">Lossless rotation at 90° increments or arbitrary angular shifts with high-fidelity re-sampling and interpolation.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0" [@fadeIn]>
            
            <div class="flex-1 flex flex-col gap-8 min-h-0">
              <div class="relative group rounded-[2.5rem] overflow-hidden border border-gray-800 shadow-2xl bg-black/40 backdrop-blur-md flex items-center justify-center perspective-mid">
                <div class="w-full h-full" [style.transform]="getPreviewTransform(vm)" [style.transition]="'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'">
                   <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                </div>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-gray-950/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'SHIFTING_MATRIX'"></app-progress-ring>
                      <div class="mt-8 flex flex-col items-center gap-2">
                         <span class="text-fuchsia-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse italic font-black">Matrix_Core_Firing</span>
                         <span class="text-gray-500 font-mono text-[8px] uppercase tracking-widest opacity-60 italic">Re-aligning Spatial Vectors...</span>
                      </div>
                   </div>
                }
                
                <!-- Matrix Overlay (Decorative) -->
                <div class="absolute inset-8 border border-fuchsia-500/5 pointer-events-none rounded-[2rem]"></div>
              </div>

              <!-- Metrics -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-fuchsia-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">Axis_State</span>
                    <span class="text-white font-mono text-xs font-black italic tracking-tighter uppercase">{{ vm.flipH ? 'H_FLIP' : '' }} {{ vm.flipV ? 'V_FLIP' : '' }} {{ !vm.flipH && !vm.flipV ? 'NORMAL' : '' }}</span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-fuchsia-500/20 transition-colors">
                    <span class="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest italic opacity-60 leading-none">Euler_Rotation</span>
                    <span class="text-fuchsia-400 font-mono text-xs font-black italic tracking-tighter">{{ vm.rotation }}° OFFSET</span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-fuchsia-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">Target_Aspect</span>
                    <span class="text-white font-mono text-xs font-black italic tracking-tighter">{{ getTargetAspect(vm) }}</span>
                 </div>
                 <div class="bg-gray-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-gray-800 flex flex-col gap-3 shadow-xl group hover:border-fuchsia-500/20 transition-colors">
                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60 leading-none">Data_Volume</span>
                    <span class="text-white font-mono text-xs font-black italic tracking-tighter">{{ (vm.inputFile.size / (1024*1024)) | number:'1.2-2' }} MB</span>
                 </div>
              </div>
            </div>

            <div class="w-full lg:w-[420px] shrink-0 flex flex-col gap-8">
              
              <!-- Settings Panel -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-[2.5rem] p-10 flex flex-col gap-10 shadow-2xl relative overflow-hidden">
                 <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-fuchsia-500/20 to-transparent"></div>
                 
                 <!-- Mirroring Toggles -->
                 <div class="p-8 bg-black/40 rounded-[2rem] border border-gray-800 shadow-xl group hover:border-fuchsia-500/20 transition-colors duration-500">
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60 mb-6">Mirroring_Vectors</label>
                    <div class="grid grid-cols-2 gap-4">
                       <button (click)="onToggleFlipH()"
                         [class]="vm.flipH ? 'bg-fuchsia-500/10 border-fuchsia-500/40 text-white shadow-inner' : 'bg-white/5 border-white/5 text-gray-600 opacity-60'"
                         class="flex flex-col items-center gap-4 p-6 rounded-2xl border transition-all active:scale-95 group/btn">
                          <svg class="w-6 h-6 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l4-4"/></svg>
                          <span class="text-[9px] font-black uppercase italic tracking-widest">Horizontal</span>
                       </button>
                       <button (click)="onToggleFlipV()"
                         [class]="vm.flipV ? 'bg-fuchsia-500/10 border-fuchsia-500/40 text-white shadow-inner' : 'bg-white/5 border-white/5 text-gray-600 opacity-60'"
                         class="flex flex-col items-center gap-4 p-6 rounded-2xl border transition-all active:scale-95 group/btn">
                          <svg class="w-6 h-6 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 8v12m0 0l4-4m-4 4l-4-4m6-10V4m0 0l4 4m-4-4l-4 4"/></svg>
                          <span class="text-[9px] font-black uppercase italic tracking-widest">Vertical</span>
                       </button>
                    </div>
                 </div>

                 <!-- Rotation Dial -->
                 <div class="p-8 bg-black/40 rounded-[2rem] border border-gray-800 shadow-xl group hover:border-fuchsia-500/20 transition-colors duration-500">
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic opacity-60 mb-6">Spatial_Rotation</label>
                    <div class="grid grid-cols-4 gap-2 mb-6">
                       @for (deg of [0, 90, 180, 270]; track deg) {
                          <button (click)="onSetRotation(deg)"
                            [class]="vm.rotation === deg ? 'bg-fuchsia-500 text-fuchsia-950 font-black shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'bg-white/5 text-gray-500 border-white/5 hover:text-white'"
                            class="py-4 rounded-xl text-[10px] font-black font-mono transition-all border active:scale-95 italic">
                             {{ deg }}°
                          </button>
                       }
                    </div>
                    <div class="flex items-center gap-6">
                       <input type="range" min="0" max="359" step="1" [value]="vm.rotation" (input)="onSetRotationInput($event)"
                         class="flex-1 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500 focus:outline-none shadow-inner">
                       <span class="text-[10px] font-black font-mono text-fuchsia-400 w-12 text-right italic">{{ vm.rotation }}°</span>
                    </div>
                 </div>

                 <!-- Action Button Area -->
                 <div class="pt-6 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onApplyTransform(vm)"
                         class="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-90 text-white font-black py-5 rounded-2xl shadow-2xl shadow-fuchsia-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-4 italic">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                         Execute Transform
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-4" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 group italic">
                            <svg class="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Matrix Result
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-black font-mono text-emerald-500/60 uppercase tracking-[0.3em] italic">Density_Verified: {{ vm.outputSizeMB | number:'1.2-2' }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-16 w-full bg-gray-950/40 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-800/50 opacity-40">
                          <span class="text-[10px] font-black font-mono text-gray-500 uppercase tracking-[0.4em] animate-pulse italic">Re-mapping_Buffers...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-6 p-6 bg-rose-500/5 border border-rose-500/20 rounded-[1.5rem] flex items-start gap-4 animate-in shake-1 duration-500" [@fadeIn]>
                          <div class="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 shrink-0 shadow-lg">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-white font-black text-xs uppercase tracking-tight italic">Matrix_Divergence_Error</p>
                            <p class="text-rose-400 font-black font-mono text-[9px] mt-1.5 leading-relaxed uppercase tracking-wider opacity-80 italic line-clamp-2">{{ vm.errorMessage || 'Unknown spatial vector failure' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onApplyTransform(vm)" class="mt-4 text-[9px] font-black uppercase text-white border-b-2 border-white/10 hover:border-fuchsia-500 transition-all hover:text-fuchsia-400 tracking-[0.2em] italic">Retry_Attempt_Ops</button>
                            }
                          </div>
                       </div>
                    }
                 </div>
              </div>

              <!-- Technical Command visualizer -->
              <div class="bg-gray-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-gray-800 shadow-inner">
                 <h4 class="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4 italic opacity-60">Engine_Command_Visualizer</h4>
                 <div class="bg-black/60 p-5 rounded-2xl border border-white/5 font-mono group overflow-hidden relative">
                    <div class="text-[9px] text-fuchsia-400/80 leading-relaxed uppercase tracking-widest italic group-hover:scale-105 transition-transform duration-500">
                       <span class="opacity-40">ffmpeg -i src.mp4 -vf</span> 
                       <span class="font-black text-white px-1.5 py-0.5 bg-fuchsia-500/20 rounded-md mx-1 shadow-sm border border-fuchsia-500/20">{{ getFilterPreview(vm) }}</span>
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
    .perspective-mid { perspective: 1000px; }
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
export class FlipRotateComponent implements OnDestroy {
  private store = inject(Store);
  private transformService = inject(FlipRotateService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectFlipRotateState);
  videoUrl: string | null = null;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(FlipRotateActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(FlipRotateActions.loadMetaSuccess({
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

  onToggleFlipH(): void { this.store.dispatch(FlipRotateActions.toggleFlipH()); }
  onToggleFlipV(): void { this.store.dispatch(FlipRotateActions.toggleFlipV()); }
  onSetRotation(rotation: number): void { this.store.dispatch(FlipRotateActions.setRotation({ rotation })); }
  onSetRotationInput(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    this.store.dispatch(FlipRotateActions.setRotation({ rotation: val }));
  }

  getPreviewTransform(state: FlipRotateState): string {
    return this.transformService.getPreviewTransform(state.flipH, state.flipV, state.rotation);
  }

  getFilterPreview(state: FlipRotateState): string {
    const filters = [];
    if (state.flipH) filters.push('hflip');
    if (state.flipV) filters.push('vflip');
    if (state.rotation !== 0) filters.push(`rotate=${state.rotation}`);
    return filters.join(',') || 'NULL_SET';
  }

  getTargetAspect(state: FlipRotateState): string {
    if (!state.videoMeta) return '---';
    const isSwapped = state.rotation === 90 || state.rotation === 270;
    return isSwapped ? `${state.videoMeta.height}:${state.videoMeta.width}` : state.videoMeta.aspectRatio;
  }

  onApplyTransform(state: FlipRotateState): void {
    if (!state.inputFile || !state.videoMeta) return;
    
    this.store.dispatch(FlipRotateActions.startProcessing());
    
    this.subscription.add(
      this.transformService.process({
        file: state.inputFile,
        flipH: state.flipH,
        flipV: state.flipV,
        rotation: state.rotation
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(FlipRotateActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(FlipRotateActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(FlipRotateActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Transform failed. Matrix offset exhausted WASM resources.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: FlipRotateState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.transformService.getOutputFilename(state.inputFile?.name || 'video');
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
    this.store.dispatch(FlipRotateActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}