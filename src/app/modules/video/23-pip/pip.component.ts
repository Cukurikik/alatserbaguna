import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { PipActions, selectPipState, PipState } from './pip.store';
import { PipService, PipPosition } from './pip.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pip',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-blue-400 via-cyan-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Visto Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Spatial Compositing: Picture-in-Picture v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.mainFile || vm.overlayFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-cyan-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-cyan-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Dispose
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        <!-- Pillar 5: I/O — Input State -->
        @if (!vm.mainFile || !vm.overlayFile) {
          <div class="flex-1 flex flex-col gap-6 max-w-5xl mx-auto w-full" [@slideUp]>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div class="flex flex-col gap-3">
                  <span class="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Primary Feed (Base)</span>
                  <app-file-drop-zone accept="video/*" (fileDropped)="onMainFileSelected($event)" 
                    [class]="vm.mainFile ? 'border-cyan-500/50 bg-cyan-500/5' : ''">
                  </app-file-drop-zone>
                  @if (vm.mainFile) {
                     <p class="text-[10px] font-mono text-cyan-400 uppercase tracking-tighter truncate px-2">Loaded: {{ vm.mainFile.name }}</p>
                  }
               </div>
               <div class="flex flex-col gap-3">
                  <span class="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Overlay Feed (PiP)</span>
                  <app-file-drop-zone accept="video/*" (fileDropped)="onOverlayFileSelected($event)"
                    [class]="vm.overlayFile ? 'border-indigo-500/50 bg-indigo-500/5' : ''">
                  </app-file-drop-zone>
                  @if (vm.overlayFile) {
                     <p class="text-[10px] font-mono text-indigo-400 uppercase tracking-tighter truncate px-2">Loaded: {{ vm.overlayFile.name }}</p>
                  }
               </div>
            </div>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div class="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Spatial Compositing</h4>
                    <p class="text-xs text-gray-500 mt-1">Multi-layer pixel blending. Overlay secondary video streams with alpha-aware scaling and positioning.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354l1.1 3.383h3.558l-2.877 2.09 1.1 3.383-2.878-2.09-2.878 2.09 1.1-3.383-2.877-2.09h3.558L12 4.354z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Temporal Sync</h4>
                    <p class="text-xs text-gray-500 mt-1">Precise start/end control for the overlay layer. Synchronize secondary streams to specific timestamps.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.mainFile && vm.overlayFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Compositing Preview -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex-col flex items-center justify-center">
                <app-video-preview [videoUrl]="mainUrl" (durationLoaded)="onMainDurationLoaded($event)"></app-video-preview>
                
                <!-- PiP Virtual HUD Overlay -->
                <div class="absolute inset-0 z-10 pointer-events-none">
                   <!-- Positioning HUD -->
                   <div [class]="getPipHudClass(vm.position)" class="absolute w-[var(--pip-w)] h-[var(--pip-h)] border-2 border-cyan-500/40 bg-cyan-500/10 backdrop-blur-sm flex items-center justify-center m-4 rounded-lg"
                     [style.--pip-w.%]="vm.pipWidthPercent" [style.--pip-h.%]="vm.pipWidthPercent * 0.56">
                      <span class="text-[8px] font-black text-cyan-400 uppercase tracking-tighter">OVERLAY_SINK</span>
                   </div>
                </div>

                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'COMPOSITING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-cyan-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Spatial Kernel Blending</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Interleaving Stream Packets</p>
                      </div>
                   </div>
                }

                <div class="absolute top-4 right-4 px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-lg backdrop-blur-md flex items-center gap-2">
                   <div class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                   <span class="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Visto-Live v1.0</span>
                </div>
              </div>

              <!-- Metrics Dashboard -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Primary Feed</span>
                       <span class="text-white text-xs truncate uppercase tracking-tighter">{{ vm.mainMeta?.width }}x{{ vm.mainMeta?.height }}</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-cyan-500/60 uppercase tracking-widest leading-none mb-1">Overlay Scale</span>
                       <span class="text-cyan-400 text-xs font-black truncate uppercase">
                          {{ vm.pipWidthPercent }}% Width
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Anchor Node</span>
                       <span class="text-white text-[10px] uppercase font-black">
                          {{ vm.position }} POS
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Compositor</span>
                       <span class="text-gray-400 text-[10px] tracking-tighter">visto_spatial_v1.0</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Parameters Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                 
                 <!-- Anchor Selection -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Spatial Anchor Node</label>
                    <div class="grid grid-cols-2 gap-2">
                       <button (click)="onSetPos('TL')" [class]="vm.position === 'TL' ? 'bg-cyan-500 text-cyan-950 font-black border-cyan-400 shadow-lg shadow-cyan-500/20' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-4 rounded-xl text-[10px] uppercase font-black transition-all border">TL</button>
                       <button (click)="onSetPos('TR')" [class]="vm.position === 'TR' ? 'bg-cyan-500 text-cyan-950 font-black border-cyan-400 shadow-lg shadow-cyan-500/20' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-4 rounded-xl text-[10px] uppercase font-black transition-all border">TR</button>
                       <button (click)="onSetPos('BL')" [class]="vm.position === 'BL' ? 'bg-cyan-500 text-cyan-950 font-black border-cyan-400 shadow-lg shadow-cyan-500/20' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-4 rounded-xl text-[10px] uppercase font-black transition-all border">BL</button>
                       <button (click)="onSetPos('BR')" [class]="vm.position === 'BR' ? 'bg-cyan-500 text-cyan-950 font-black border-cyan-400 shadow-lg shadow-cyan-500/20' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                         class="py-4 rounded-xl text-[10px] uppercase font-black transition-all border">BR</button>
                    </div>
                 </div>

                 <!-- Scaling Area -->
                 <div class="p-4 bg-black/40 rounded-2xl border border-gray-800">
                    <div class="flex justify-between items-center mb-3">
                       <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Spatial Scale</label>
                       <span class="text-[9px] font-mono text-cyan-400 font-black">{{ vm.pipWidthPercent }}%</span>
                    </div>
                    <input type="range" min="5" max="80" step="1" [value]="vm.pipWidthPercent" (input)="onSetScale($event)"
                      class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500">
                 </div>

                 <!-- Temporal Offset -->
                 <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-black/40 rounded-2xl border border-gray-800 flex flex-col gap-2">
                       <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Temporal_Start</label>
                       <input type="number" [value]="vm.startTime || 0" (input)="onSetStart($event)" class="bg-transparent border-none p-0 text-white font-mono font-black text-xl">
                    </div>
                    <div class="p-4 bg-black/40 rounded-2xl border border-gray-800 flex flex-col gap-2">
                       <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Temporal_End</label>
                       <input type="number" [value]="vm.endTime || (vm.overlayMeta?.duration || 0)" (input)="onSetEnd($event)" class="bg-transparent border-none p-0 text-white font-mono font-black text-xl">
                    </div>
                 </div>

                 <!-- Action Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onCompose(vm)"
                         class="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354l1.1 3.383h3.558l-2.877 2.09 1.1 3.383-2.878-2.09-2.878 2.09 1.1-3.383-2.877-2.09h3.558L12 4.354z"/></svg>
                         Start Composite
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Export Spatial Pkg
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Hydrated Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Rendering Spatial Matrix...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase tracking-tight">Compositing Fault</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Unknown spatial kernel rejection' }}</p>
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
export class PipComponent implements OnDestroy {
  private store = inject(Store);
  private vistoService = inject(PipService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectPipState);
  mainUrl: string | null = null;
  overlayUrl: string | null = null;

  onMainFileSelected(file: File): void {
    if (this.mainUrl) URL.revokeObjectURL(this.mainUrl);
    this.mainUrl = URL.createObjectURL(file);
    this.store.dispatch(PipActions.loadMainFile({ file }));
  }

  onOverlayFileSelected(file: File): void {
    if (this.overlayUrl) URL.revokeObjectURL(this.overlayUrl);
    this.overlayUrl = URL.createObjectURL(file);
    this.store.dispatch(PipActions.loadOverlayFile({ file }));
  }

  onMainDurationLoaded(duration: number): void {
    this.store.dispatch(PipActions.loadMainMetaSuccess({
      meta: {
        filename: 'main', fileSizeMB: 0, duration,
        width: 1920, height: 1080, fps: 30, codec: 'h264',
        audioCodec: 'aac', audioBitrate: 128, videoBitrate: 0,
        hasAudio: true, aspectRatio: '16:9',
      }
    }));
  }

  onSetPos(position: PipPosition): void { this.store.dispatch(PipActions.setPosition({ position })); }
  onSetScale(e: Event): void { this.store.dispatch(PipActions.setPipWidthPercent({ percent: parseInt((e.target as HTMLInputElement).value, 10) })); }
  onSetStart(e: Event): void { this.store.dispatch(PipActions.setStartTime({ time: parseFloat((e.target as HTMLInputElement).value) })); }
  onSetEnd(e: Event): void { this.store.dispatch(PipActions.setEndTime({ time: parseFloat((e.target as HTMLInputElement).value) })); }

  onCompose(state: PipState): void {
    if (!state.mainFile || !state.overlayFile || !state.mainMeta) return;
    
    this.store.dispatch(PipActions.startProcessing());
    
    this.subscription.add(
      this.vistoService.process({
        mainFile: state.mainFile,
        overlayFile: state.overlayFile,
        pipWidthPercent: state.pipWidthPercent,
        position: state.position,
        startTime: state.startTime,
        endTime: state.endTime,
        borderRadius: state.borderRadius,
        mainMeta: state.mainMeta,
        overlayMeta: state.overlayMeta || state.mainMeta
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(PipActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(PipActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(PipActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Spatial kernel blending calculation aborted.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: PipState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.vistoService.getOutputFilename(state.mainFile?.name || 'video');
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  getPipHudClass(pos: PipPosition): string {
    switch(pos) {
      case 'TL': return 'top-0 left-0';
      case 'TR': return 'top-0 right-0';
      case 'BL': return 'bottom-0 left-0';
      case 'BR': return 'bottom-0 right-0';
      default: return 'bottom-0 right-0';
    }
  }

  onReset(): void {
    if (this.mainUrl) URL.revokeObjectURL(this.mainUrl);
    if (this.overlayUrl) URL.revokeObjectURL(this.overlayUrl);
    this.mainUrl = null;
    this.overlayUrl = null;
    this.store.dispatch(PipActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.mainUrl) URL.revokeObjectURL(this.mainUrl);
    if (this.overlayUrl) URL.revokeObjectURL(this.overlayUrl);
    this.subscription.unsubscribe();
  }
}