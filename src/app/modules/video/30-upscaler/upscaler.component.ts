import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../shared/animations';
import { Component, ChangeDetectionStrategy, inject, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { UpscalerActions, selectUpscalerState, UpscalerState } from './upscaler.store';
import { UpscalerService, UpscaleModel } from './upscaler.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-upscaler',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, FileDropZoneComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-blue-400 via-cyan-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Nova Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Neural Stream Super-Resolution: Pixel Reconstruction v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-cyan-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-cyan-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Dispose Kernel
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        <div class="flex-1 flex flex-col gap-8" [@fadeIn]>
            
            <div class="flex flex-col lg:flex-row gap-8 min-h-0">
               
               <!-- Asset Ingress -->
               <div class="flex-1 bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col gap-8">
                  <div class="flex justify-between items-center px-2">
                     <span class="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] italic opacity-60">Neural_Asset_Port</span>
                     <div class="flex gap-4">
                        <span [class]="vm.webGpuAvailable ? 'text-emerald-400' : 'text-amber-500'" class="text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 font-mono">
                           <span class="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                           {{ vm.webGpuAvailable ? 'WebGPU_Active' : 'CPU_Fallback' }}
                        </span>
                     </div>
                  </div>

                  @if (!vm.inputFile) {
                     <div class="flex-1 flex flex-col items-center justify-center py-20 gap-8 animate-in fade-in zoom-in-95 duration-700">
                        <app-file-drop-zone (fileDropped)="onFileSelected($event)" class="w-full max-w-sm"></app-file-drop-zone>
                        <p class="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] text-center max-w-xs leading-relaxed italic">Awaiting_Low_Res_Stream_Ingress<br>4x_Super_Resolution_Ready</p>
                     </div>
                  } @else {
                     <div class="flex-1 flex flex-col gap-8" [@slideUp]>
                        <!-- Source Card -->
                        <div class="p-8 bg-black/40 rounded-3xl border border-gray-800 flex items-center gap-8 group relative overflow-hidden transition-all hover:border-cyan-500/30">
                           <div class="w-24 h-24 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
                              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                           </div>
                           <div class="flex-1 min-w-0">
                              <h4 class="text-white font-black text-lg uppercase tracking-tight truncate">{{ vm.inputFile.name }}</h4>
                              <div class="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                                 <span class="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{{ vm.videoMeta?.width }}x{{ vm.videoMeta?.height }} @ {{ vm.videoMeta?.fps | number:'1.0-2' }} FPS</span>
                                 <span class="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{{ vm.inputFile.size | number:'1.0-0' }} Bytes</span>
                              </div>
                           </div>
                           <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <!-- Config Matrix -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div class="space-y-4">
                              <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Magnification_Factor</label>
                              <div class="flex gap-2">
                                 @for (scale of [2, 4]; track scale) {
                                    <button (click)="onSetScale(scale === 2 ? 2 : 4)" [class]="vm.scaleFactor === scale ? 'bg-cyan-500 text-cyan-950 font-black border-cyan-400' : 'bg-black/40 text-gray-500 border-gray-800'"
                                      class="flex-1 py-4 rounded-2xl text-xs uppercase font-black transition-all border shadow-lg shadow-cyan-500/10">{{ scale }}X</button>
                                 }
                              </div>
                           </div>

                           <div class="space-y-4">
                              <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Neural_Engine_Model</label>
                              <select #modelSelect (change)="onSetModel(modelSelect.value)" class="w-full bg-black/40 border border-gray-800 rounded-2xl py-4 px-6 text-xs font-black text-white uppercase appearance-none cursor-pointer focus:border-cyan-500/50 outline-none shadow-lg transition-all tracking-widest">
                                 <option value="realesrgan" [selected]="vm.model === 'realesrgan'">Real-ESRGAN v3</option>
                                 <option value="esrgan" [selected]="vm.model === 'esrgan'">Ultra-ESRGAN</option>
                                 <option value="swinir" [selected]="vm.model === 'swinir'">SwinIR Transformer</option>
                              </select>
                           </div>
                        </div>
                     </div>
                  }
               </div>

               <!-- Status Monitor -->
               <div class="w-full lg:w-[400px] flex flex-col gap-6">
                  <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative flex flex-col items-center justify-center min-h-[400px]">
                     
                     @if (vm.status === 'processing' || vm.status === 'downloading') {
                        <div class="relative flex flex-col items-center gap-10">
                           <app-progress-ring [progress]="vm.status === 'downloading' ? vm.modelDownloadProgress : vm.progress" 
                             [status]="vm.status === 'downloading' ? 'DOWNLOADING_WEIGHTS' : 'RECONSTRUCTING'"></app-progress-ring>
                           
                           @if (vm.status === 'processing') {
                              <div class="grid grid-cols-2 gap-8 w-full">
                                 <div class="flex flex-col items-center gap-1">
                                    <span class="text-[8px] font-black text-gray-500 uppercase tracking-widest">Throughput</span>
                                    <span class="text-xs font-black text-white font-mono">{{ vm.processingSpeedFps | number:'1.2-2' }} FPS</span>
                                 </div>
                                 <div class="flex flex-col items-center gap-1">
                                    <span class="text-[8px] font-black text-gray-500 uppercase tracking-widest">Temporal_ETA</span>
                                    <span class="text-xs font-black text-white font-mono">{{ vm.estimatedTimeRemaining }}</span>
                                 </div>
                              </div>
                           }
                        </div>
                     } @else if (vm.status === 'success') {
                        <div class="flex flex-col items-center gap-8 w-full" [@slideUp]>
                           <div class="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                           </div>
                           <div class="text-center">
                              <h4 class="text-white font-black text-xl uppercase tracking-tighter">Reconstruction Complete</h4>
                              <p class="text-[9px] font-mono text-emerald-500 uppercase tracking-widest mt-1">Neural Matrix Verified</p>
                           </div>
                           <button (click)="onDownload(vm)" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                              Export Nova Stream
                           </button>
                        </div>
                     } @else {
                        <div class="flex flex-col items-center gap-8 opacity-30 text-center">
                           <div class="w-24 h-24 rounded-full border border-gray-800 flex items-center justify-center relative overflow-hidden group">
                              <svg class="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                              <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-500/20 to-transparent"></div>
                           </div>
                           <p class="text-[9px] font-black text-white/50 uppercase tracking-[0.4em] italic leading-relaxed">Neural_Module_Standby<br>Awaiting_Trigger_Pulse</p>
                        </div>
                     }

                     <!-- Action Bar -->
                     <div class="absolute bottom-10 inset-x-10">
                        @if (vm.status === 'idle' && vm.inputFile) {
                           <button (click)="onUpscale(vm)"
                             class="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                             Energize Neural Core
                           </button>
                        } @else if (vm.status === 'processing') {
                           <button (click)="onAbort()" class="w-full bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-rose-500/20 transition-all">
                              Abort_Synthesis
                           </button>
                        }
                     </div>
                  </div>
               </div>
            </div>
        </div>
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
export class UpscalerComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private novaService = inject(UpscalerService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectUpscalerState);

  async ngOnInit(): Promise<void> {
    const available = await this.novaService.checkWebGPU();
    this.store.dispatch(UpscalerActions.setWebGPUAvailable({ available }));
  }

  onFileSelected(file: File): void {
     this.store.dispatch(UpscalerActions.loadFile({ file }));
     // Meta detection logic should be handled here or via effects
     // Simulate meta load for now to unblock UI
     setTimeout(() => {
        this.store.dispatch(UpscalerActions.loadMetaSuccess({
           meta: { filename: file.name, fileSizeMB: file.size / (1024 * 1024), duration: 10, width: 1920, height: 1080, fps: 30, codec: 'h264', audioCodec: 'aac', audioBitrate: 128, videoBitrate: 0, hasAudio: true, aspectRatio: '16:9' },
           framesTotal: 300
        }));
     }, 500);
  }

  onSetScale(scaleFactor: 2 | 4): void { this.store.dispatch(UpscalerActions.setScaleFactor({ scaleFactor })); }
  onSetModel(model: string): void { this.store.dispatch(UpscalerActions.setModel({ model: model as UpscaleModel })); }

  onUpscale(state: UpscalerState): void {
    if (!state.inputFile) return;
    this.store.dispatch(UpscalerActions.startProcessing());
    
    this.subscription.add(
      this.novaService.process({
        file: state.inputFile,
        scaleFactor: state.scaleFactor,
        model: state.model,
        fps: state.videoMeta?.fps || 30
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(UpscalerActions.initializeProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(UpscalerActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(UpscalerActions.processingFailure({ 
            errorCode: 'WORKER_CRASHED', 
            message: err.message ?? 'Nova core synthesis calculation aborted by kernel.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: UpscalerState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.novaService.getOutputFilename(state.inputFile?.name || 'video', state.scaleFactor);
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onAbort(): void {
    this.store.dispatch(UpscalerActions.abortProcessing());
  }

  onReset(): void {
    this.store.dispatch(UpscalerActions.resetState());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}