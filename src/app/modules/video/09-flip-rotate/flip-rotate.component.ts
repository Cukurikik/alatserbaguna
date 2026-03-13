import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
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
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-fuchsia-400 via-pink-500 to-rose-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Flip & Rotate
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Matrix Engine: Spatial Transformation</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-fuchsia-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-fuchsia-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Discard
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
               <div class="p-6 rounded-2xl bg-fuchsia-500/5 border border-fuchsia-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-fuchsia-500/10 rounded-xl flex items-center justify-center text-fuchsia-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Axis Mirroring</h4>
                    <p class="text-xs text-gray-500 mt-1">Reflect video coordinates instantly. Supports Horizontal (x-axis) and Vertical (y-axis) inversion.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-pink-500/5 border border-pink-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Angular Rotation</h4>
                    <p class="text-xs text-gray-500 mt-1">Lossless rotation at 90° increments or arbitrary angular shifts with high-fidelity re-sampling.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Matrix Visualizer -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex items-center justify-centerperspective-mid">
                <div class="w-full h-full" [style.transform]="getPreviewTransform(vm)" [style.transition]="'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'">
                   <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                </div>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'TRANSFORMING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-fuchsia-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Applying Matrix Shift</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Re-mapping Frame Buffer Vectors</p>
                      </div>
                   </div>
                }

                <!-- Matrix Overlay (Decorative) -->
                <div class="absolute inset-4 border border-fuchsia-500/10 pointer-events-none rounded-xl"></div>
              </div>

              <!-- Logic Dashboard -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Flip H / V</span>
                       <span class="text-white font-mono text-xs">{{ vm.flipH ? 'ACTIVE' : 'OFF' }} / {{ vm.flipV ? 'ACTIVE' : 'OFF' }}</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-fuchsia-500/60 uppercase tracking-widest leading-none">Euler Rotation</span>
                       <span class="text-fuchsia-400 text-xl font-black tracking-tighter">{{ vm.rotation }}°</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Target Aspect</span>
                       <span class="text-white text-xs truncate">
                          {{ getTargetAspect(vm) }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Filter Pipeline</span>
                       <span class="text-gray-400 font-mono text-xs tracking-tighter truncate">{{ getFilterPreview(vm) }}</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Settings Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                 
                 <!-- Mirroring Toggles -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none">Mirroring Vectors</label>
                    <div class="grid grid-cols-2 gap-4">
                       <button (click)="onToggleFlipH()"
                         [class]="vm.flipH ? 'bg-fuchsia-500/10 border-fuchsia-500/40 text-white shadow-fuchsia-500/5' : 'bg-black/20 border-gray-800 text-gray-600'"
                         class="flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all hover:border-fuchsia-500/20 active:scale-95 group">
                          <svg class="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l4-4"/></svg>
                          <span class="text-[10px] font-black uppercase tracking-widest">Horizontal</span>
                       </button>
                       <button (click)="onToggleFlipV()"
                         [class]="vm.flipV ? 'bg-fuchsia-500/10 border-fuchsia-500/40 text-white shadow-fuchsia-500/5' : 'bg-black/20 border-gray-800 text-gray-600'"
                         class="flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all hover:border-fuchsia-500/20 active:scale-95 group">
                          <svg class="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8v12m0 0l4-4m-4 4l-4-4m6-10V4m0 0l4 4m-4-4l-4 4"/></svg>
                          <span class="text-[10px] font-black uppercase tracking-widest">Vertical</span>
                       </button>
                    </div>
                 </div>

                 <!-- Rotation Dial -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none">Spatial Rotation</label>
                    <div class="grid grid-cols-4 gap-2">
                       @for (deg of [0, 90, 180, 270]; track deg) {
                          <button (click)="onSetRotation(deg)"
                            [class]="vm.rotation === deg ? 'bg-fuchsia-500 text-fuchsia-950 font-black' : 'bg-black/40 text-gray-500 hover:text-white'"
                            class="py-4 rounded-xl text-xs font-mono transition-all border border-gray-800 active:scale-95">
                             {{ deg }}°
                          </button>
                       }
                    </div>
                    <div class="mt-4 p-4 bg-black/40 rounded-xl border border-gray-800/50">
                       <span class="text-[9px] font-black text-gray-600 uppercase block mb-2">Custom Euler Angle</span>
                       <div class="flex items-center gap-4">
                          <input type="range" min="0" max="359" step="1" [value]="vm.rotation" (input)="onSetRotationInput($event)"
                            class="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500">
                          <span class="text-[10px] font-mono text-fuchsia-400 w-10 text-right">{{ vm.rotation }}°</span>
                       </div>
                    </div>
                 </div>

                 <!-- Action Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onApplyTransform(vm)"
                         class="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-fuchsia-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                         Execute Transform
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Transformed
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Modified Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Computing Spatial Offset...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase leading-tight tracking-tight tracking-tighter">Coordinate Misalignment</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Unknown vector divergence' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onApplyTransform(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Re-align Matrix</button>
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
    if (state.rotation !== 0) filters.push(`rotate=${state.rotation}°`);
    return filters.join(',') || 'none';
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
            message: err.message ?? 'Transform exhausted WASM memory. Check resolution.',
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
    this.store.dispatch(FlipRotateActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}