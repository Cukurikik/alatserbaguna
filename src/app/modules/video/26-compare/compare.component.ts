import { Component, ChangeDetectionStrategy, inject, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { CompareActions, selectCompareState, CompareState } from './compare.store';
import { CompareService } from './compare.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Duo Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Synchronized Analysis: Pixel-Diff v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.fileA || vm.fileB) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-orange-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-orange-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Dispose
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        <!-- Pillar 5: I/O — Input State -->
        @if (!vm.fileA || !vm.fileB) {
          <div class="flex-1 flex flex-col gap-6 max-w-5xl mx-auto w-full" [@slideUp]>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div class="flex flex-col gap-3">
                  <span class="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 italic opacity-60">Source_Node_A</span>
                  <app-file-drop-zone accept="video/*" (fileDropped)="onFileASelected($event)" 
                    [class]="vm.fileA ? 'border-orange-500/50 bg-orange-500/5' : ''">
                  </app-file-drop-zone>
               </div>
               <div class="flex flex-col gap-3">
                  <span class="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 italic opacity-60">Source_Node_B</span>
                  <app-file-drop-zone accept="video/*" (fileDropped)="onFileBSelected($event)"
                    [class]="vm.fileB ? 'border-amber-500/50 bg-amber-500/5' : ''">
                  </app-file-drop-zone>
               </div>
            </div>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
               <div class="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex flex-col gap-3">
                  <div class="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10l-4-4m4 4l4-4M15 7v10m0-10l-4 4m4-4l4 4"/></svg>
                  </div>
                  <h4 class="text-white font-bold text-xs uppercase tracking-wide">Sync Playback</h4>
                  <p class="text-[10px] text-gray-500 leading-relaxed font-mono uppercase italic opacity-60">Driver-follower temporal alignment for precise frame matching.</p>
               </div>
               <div class="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col gap-3">
                  <div class="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <h4 class="text-white font-bold text-xs uppercase tracking-wide">Pixel-Diff Kernel</h4>
                  <p class="text-[10px] text-gray-500 leading-relaxed font-mono uppercase italic opacity-60">Real-time absolute difference mapping for encoding loss analysis.</p>
               </div>
               <div class="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 flex flex-col gap-3">
                  <div class="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <h4 class="text-white font-bold text-xs uppercase tracking-wide">Dual Rendering</h4>
                  <p class="text-[10px] text-gray-500 leading-relaxed font-mono uppercase italic opacity-60">High-performance canvas interleaving for synchronized viewing.</p>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.fileA && vm.fileB) {
          <div class="flex-1 flex flex-col gap-8" [@fadeIn]>
            
            <!-- Comparison Layout -->
            <div class="flex-1 relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 min-h-[400px]">
              
              <div class="absolute inset-0 flex items-center justify-center">
                 @if (vm.mode === 'sidebyside') {
                    <div class="grid grid-cols-2 w-full h-full gap-1 p-1">
                       <div class="relative rounded-2xl overflow-hidden bg-black/80">
                          <video #videoA [src]="urlA" class="w-full h-full object-contain" muted controls></video>
                          <div class="absolute top-4 left-4 px-2 py-0.5 bg-orange-500/40 border border-orange-500/40 rounded backdrop-blur-md">
                             <span class="text-[8px] font-black text-white uppercase tracking-widest">STREAM_A</span>
                          </div>
                       </div>
                       <div class="relative rounded-2xl overflow-hidden bg-black/80">
                          <video #videoB [src]="urlB" class="w-full h-full object-contain" muted></video>
                          <div class="absolute top-4 left-4 px-2 py-0.5 bg-amber-500/40 border border-amber-500/40 rounded backdrop-blur-md">
                             <span class="text-[8px] font-black text-white uppercase tracking-widest">STREAM_B</span>
                          </div>
                       </div>
                    </div>
                 } @else if (vm.mode === 'divider') {
                    <div class="relative w-full h-full bg-black">
                       <video #videoA [src]="urlA" class="absolute inset-0 w-full h-full object-contain" muted controls></video>
                       <div class="absolute inset-0 overflow-hidden" [style.width.%]="vm.dividerPosition">
                          <video #videoB [src]="urlB" class="w-[100vw] h-full object-cover" muted></video>
                       </div>
                       <!-- Interaction Handle -->
                       <div class="absolute inset-y-0 w-1 bg-white cursor-ew-resize group/handle" [style.left.%]="vm.dividerPosition">
                          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center opacity-0 group-hover/handle:opacity-100 transition-opacity">
                             <svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l4-4"/></svg>
                          </div>
                       </div>
                    </div>
                 } @else {
                    <div class="w-full h-full flex items-center justify-center bg-black/90 relative">
                       <canvas #diffCanvas class="max-w-full max-h-full"></canvas>
                       <video #videoA [src]="urlA" class="hidden" muted controls></video>
                       <video #videoB [src]="urlB" class="hidden" muted></video>
                       <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-20 pointer-events-none">
                          <span class="text-[40px] font-black text-white uppercase tracking-[1em] ml-4">DIFF</span>
                       </div>
                    </div>
                 }
              </div>

              @if (vm.status === 'processing') {
                 <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                    <app-progress-ring [progress]="vm.progress" [status]="'SYNC_EXPORT'"></app-progress-ring>
                    <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                       <p class="text-orange-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Exporting Composed Analysis</p>
                       <p class="text-gray-500 font-mono text-[8px] uppercase">Interleaving Multi-Stream Frames</p>
                    </div>
                 </div>
              }

              <!-- Engine Metadata -->
              <div class="absolute top-6 right-6 px-4 py-2 bg-black/40 border border-gray-800 rounded-2xl backdrop-blur-xl flex items-center gap-3">
                 <div class="flex flex-col gap-0.5 pr-3 border-r border-gray-800">
                    <span class="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none opacity-60">Sync_Lock</span>
                    <span class="text-orange-400 text-[10px] font-mono leading-none font-black uppercase tracking-tighter italic">ACTIVE</span>
                 </div>
                 <div class="flex flex-col gap-0.5">
                    <span class="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none opacity-60">Engine</span>
                    <span class="text-white text-[10px] font-mono leading-none tracking-tighter uppercase font-black">DUO_MAPPING_V1.0</span>
                 </div>
              </div>
            </div>

            <!-- Dashboard Control -->
            <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col lg:flex-row gap-8 items-center">
               
               <!-- Mode Select -->
               <div class="flex gap-2">
                  <button (click)="onSetMode('sidebyside')" [class]="vm.mode === 'sidebyside' ? 'bg-orange-500 text-orange-950 font-black border-orange-400 shadow-lg shadow-orange-500/20' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                    class="px-6 py-4 rounded-xl text-[9px] uppercase font-black transition-all border flex flex-col items-center gap-1 group">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    Split-Full
                  </button>
                  <button (click)="onSetMode('divider')" [class]="vm.mode === 'divider' ? 'bg-orange-500 text-orange-950 font-black border-orange-400 shadow-lg shadow-orange-500/20' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                    class="px-6 py-4 rounded-xl text-[9px] uppercase font-black transition-all border flex flex-col items-center gap-1 group">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l4-4"/></svg>
                    Slider
                  </button>
                  <button (click)="onSetMode('difference')" [class]="vm.mode === 'difference' ? 'bg-orange-500 text-orange-950 font-black border-orange-400 shadow-lg shadow-orange-500/20' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                    class="px-6 py-4 rounded-xl text-[9px] uppercase font-black transition-all border flex flex-col items-center gap-1 group">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
                    Pixel-Diff
                  </button>
               </div>

               @if (vm.mode === 'divider') {
                  <div class="flex-1 px-4 lg:px-8 max-w-sm w-full">
                     <div class="flex justify-between items-center mb-2">
                        <span class="text-[8px] font-black text-gray-600 uppercase tracking-widest leading-none">Divider_TX</span>
                        <span class="text-[8px] font-mono text-orange-400 font-black">{{ vm.dividerPosition }}%</span>
                     </div>
                     <input type="range" [value]="vm.dividerPosition" (input)="onSetDivider($event)" class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500">
                  </div>
               }

               <div class="shrink-0 flex gap-4 ml-auto">
                  @if (vm.status === 'idle' || vm.status === 'error') {
                     <button (click)="onExport(vm)" 
                       class="bg-gradient-to-r from-orange-600 to-amber-600 hover:opacity-90 text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-95 text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                       <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                       Snapshot Layer
                     </button>
                  } @else if (vm.status === 'success') {
                     <button (click)="onDownload(vm)" 
                       class="bg-emerald-500 hover:bg-emerald-400 text-white px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                       <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                       Propagate Pkg
                     </button>
                  } @else {
                     <div class="h-14 px-12 bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                        <span class="text-[9px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Encoding Dual Matrix...</span>
                     </div>
                  }
               </div>

               <div class="absolute inset-0 bg-gradient-to-l from-orange-500/5 via-transparent to-transparent pointer-events-none"></div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
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
export class CompareComponent implements OnDestroy {
  private store = inject(Store);
  private duoService = inject(CompareService);
  private subscription = new Subscription();

  @ViewChild('videoA') videoA!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoB') videoB!: ElementRef<HTMLVideoElement>;
  @ViewChild('diffCanvas') diffCanvas!: ElementRef<HTMLCanvasElement>;
  
  readonly vm$ = this.store.select(selectCompareState);
  urlA: string | null = null;
  urlB: string | null = null;
  private cleanupSync: (() => void) | null = null;
  private animFrameId: number | null = null;

  onFileASelected(file: File): void {
    if (this.urlA) URL.revokeObjectURL(this.urlA);
    this.urlA = URL.createObjectURL(file);
    this.store.dispatch(CompareActions.loadFileA({ file }));
    this.checkReady();
  }

  onFileBSelected(file: File): void {
    if (this.urlB) URL.revokeObjectURL(this.urlB);
    this.urlB = URL.createObjectURL(file);
    this.store.dispatch(CompareActions.loadFileB({ file }));
    this.checkReady();
  }

  private checkReady(): void {
    setTimeout(() => {
      if (this.videoA && this.videoB) {
        if (this.cleanupSync) this.cleanupSync();
        this.cleanupSync = this.duoService.syncPlayback(this.videoA.nativeElement, this.videoB.nativeElement);
        this.initDiffLoop();
      }
    }, 100);
  }

  private initDiffLoop(): void {
    const loop = () => {
      if (this.diffCanvas && this.videoA && this.videoB) {
        const vA = this.videoA.nativeElement;
        const vB = this.videoB.nativeElement;
        const ctx = this.diffCanvas.nativeElement.getContext('2d');
        if (ctx && vA.readyState >= 2 && vB.readyState >= 2) {
           const w = vA.videoWidth;
           const h = vA.videoHeight;
           this.diffCanvas.nativeElement.width = w;
           this.diffCanvas.nativeElement.height = h;

           const tempA = document.createElement('canvas'); tempA.width = w; tempA.height = h;
           const tempB = document.createElement('canvas'); tempB.width = w; tempB.height = h;
           const tCtxA = tempA.getContext('2d')!; tCtxA.drawImage(vA, 0, 0);
           const tCtxB = tempB.getContext('2d')!; tCtxB.drawImage(vB, 0, 0);

           this.duoService.computeDifference(tCtxA, tCtxB, ctx, w, h);
        }
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  onSetMode(mode: any): void { this.store.dispatch(CompareActions.setMode({ mode })); }
  onSetDivider(e: Event): void { this.store.dispatch(CompareActions.setDividerPosition({ position: parseInt((e.target as HTMLInputElement).value, 10) })); }

  onExport(state: CompareState): void {
    if (!state.fileA || !state.fileB) return;
    this.store.dispatch(CompareActions.startProcessing());
    
    this.subscription.add(
      this.duoService.export({ fileA: state.fileA, fileB: state.fileB, mode: state.mode }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') this.store.dispatch(CompareActions.updateProgress({ progress: msg.value ?? 0 }));
          else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(CompareActions.processingSuccess({ outputBlob: blob, outputSizeMB: blob.size / (1024 * 1024) }));
          }
        },
        error: (err) => this.store.dispatch(CompareActions.processingFailure({ errorCode: 'FFMPEG_COMMAND_FAILED', message: err.message ?? 'Dual kernel compositing fault.', retryable: true }))
      })
    );
  }

  onDownload(state: CompareState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `omni_duo_analysis.mp4` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.urlA) URL.revokeObjectURL(this.urlA);
    if (this.urlB) URL.revokeObjectURL(this.urlB);
    this.urlA = null; this.urlB = null;
    if (this.cleanupSync) this.cleanupSync();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.store.dispatch(CompareActions.resetState());
  }

  ngOnDestroy(): void {
    this.onReset();
    this.subscription.unsubscribe();
  }
}