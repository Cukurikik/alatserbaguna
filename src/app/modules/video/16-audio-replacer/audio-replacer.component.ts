import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { AudioReplacerActions, selectAudioReplacerState, AudioReplacerState } from './audio-replacer.store';
import { AudioReplacerService } from './audio-replacer.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-audio-replacer',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-blue-400 via-cyan-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Sync Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Stream Bridge: Audio-Visual Re-Synchronization v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.videoFile) {
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
        @if (!vm.videoFile) {
          <div class="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full" [@slideUp]>
            <app-file-drop-zone accept="video/*" (fileDropped)="onVideoSelected($event)"></app-file-drop-zone>
            
            <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div class="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m4-4l-4-4"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Stream Swapping</h4>
                    <p class="text-xs text-gray-500 mt-1">Surgically replace or mix audio streams without impacting video bitrates. Direct container mapping.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Audio Matrixing</h4>
                    <p class="text-xs text-gray-500 mt-1">Blend original and new audio with per-channel magnitude control. Supports looping for short assets.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.videoFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Dual Control -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex-col flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'SYNCING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-cyan-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Aligning Stream Timestamps</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Integrating Container Metadata Bridge</p>
                      </div>
                   </div>
                }

                <div class="absolute top-4 right-4 px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-lg backdrop-blur-md flex items-center gap-2">
                   <div class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                   <span class="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Sync-Input v1.4</span>
                </div>
              </div>

              <!-- Stream Dashboard -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Visual Stream</span>
                       <span class="text-white font-mono text-xs truncate">{{ vm.videoFile.name }}</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-cyan-500/60 uppercase tracking-widest leading-none mb-1">Target Audio</span>
                       <span class="text-cyan-400 text-xs font-black truncate uppercase">
                          {{ vm.audioFile?.name || 'BRIDGE_DISCONNECTED' }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Sync Mode</span>
                       <span class="text-white text-[10px] uppercase font-black">
                          {{ vm.mode === 'replace' ? 'TRANSPLANT' : 'FUSION' }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Delta Pipeline</span>
                       <span class="text-gray-400 text-[10px] tracking-tighter">stream_cross_v0.4</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Parameters Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                 
                 <!-- Audio Asset Injector -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Audio Buffer Source</label>
                    <div (click)="audioInput.click()" 
                      [class]="vm.audioFile ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-gray-800 bg-black/40'"
                      class="p-8 rounded-2xl border border-dashed hover:border-cyan-500/20 transition-all cursor-pointer group text-center relative overflow-hidden">
                       @if (vm.audioFile) {
                          <div class="flex flex-col items-center gap-2">
                             <span class="text-cyan-400 text-[10px] font-black uppercase tracking-widest truncate max-w-[200px]">{{ vm.audioFile.name }}</span>
                             <span class="text-[9px] text-gray-600 uppercase tracking-widest">Asset Linked ({{ (vm.audioFile.size / 1024 / 1024).toFixed(2) }} MB)</span>
                          </div>
                       } @else {
                          <div class="flex flex-col items-center gap-3">
                             <svg class="w-10 h-10 text-gray-800 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                             <span class="text-[10px] font-black text-gray-700 uppercase tracking-widest font-mono">Inject Audio Stream</span>
                          </div>
                       }
                       <input #audioInput type="file" accept="audio/*" class="hidden" (change)="onAudioSelected($event)">
                    </div>
                 </div>

                 <!-- Mode Toggle -->
                 <div class="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-2xl border border-gray-800">
                    <button (click)="onSetMode('replace')" [class]="vm.mode === 'replace' ? 'bg-cyan-500 text-cyan-950 font-black' : 'text-gray-500 hover:text-white'"
                      class="py-3 rounded-xl text-[9px] uppercase font-black transition-all">Replace</button>
                    <button (click)="onSetMode('mix')" [class]="vm.mode === 'mix' ? 'bg-cyan-500 text-cyan-950 font-black' : 'text-gray-500 hover:text-white'"
                      class="py-3 rounded-xl text-[9px] uppercase font-black transition-all">Mix</button>
                 </div>

                 <!-- Volume Controls -->
                 <div class="space-y-6">
                    @if (vm.mode === 'mix') {
                       <div class="p-6 bg-black/40 rounded-2xl border border-gray-800" [@fadeIn]>
                          <div class="flex justify-between items-center mb-4">
                             <label class="text-[10px] font-black text-gray-400 uppercase tracking-wide">Original Magnitude</label>
                             <span class="text-[10px] font-mono font-black text-cyan-400">{{ (vm.originalVolume * 100).toFixed(0) }}%</span>
                          </div>
                          <input type="range" min="0" max="2" step="0.01" [value]="vm.originalVolume" (input)="onSetOriginalVolume($event)"
                            class="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500">
                       </div>
                    }

                    <div class="p-6 bg-black/40 rounded-2xl border border-gray-800">
                       <div class="flex justify-between items-center mb-4">
                          <label class="text-[10px] font-black text-gray-400 uppercase tracking-wide">Injector Magnitude</label>
                          <span class="text-[10px] font-mono font-black text-cyan-400">{{ (vm.newAudioVolume * 100).toFixed(0) }}%</span>
                       </div>
                       <input type="range" min="0" max="2" step="0.01" [value]="vm.newAudioVolume" (input)="onSetNewAudioVolume($event)"
                         class="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500">
                    </div>
                 </div>

                 <!-- Looping -->
                 <button (click)="onToggleLoop()" [class]="vm.loopAudio ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-black/40 border-gray-800'"
                    class="p-4 rounded-2xl border flex items-center justify-between group transition-all">
                    <span [class]="vm.loopAudio ? 'text-cyan-400' : 'text-gray-500'" class="text-[10px] font-black uppercase tracking-widest">Continuous Loop</span>
                    <div [class]="vm.loopAudio ? 'bg-cyan-500' : 'bg-gray-800'" class="w-10 h-5 rounded-full relative transition-colors">
                       <div [class]="vm.loopAudio ? 'translate-x-5' : 'translate-x-1'" class="absolute top-1 w-3 h-3 bg-white rounded-full transition-transform"></div>
                    </div>
                 </button>

                 <!-- Action Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onSync(vm)" [disabled]="!vm.audioFile"
                         [class.opacity-50]="!vm.audioFile"
                         class="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                         Start Sync
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Save Sync
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Synced Magnitude: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Bridging Stream Headers...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase tracking-tight">Sync Rejection</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Unknown stream fault' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onSync(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Restart Sync</button>
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
export class AudioReplacerComponent implements OnDestroy {
  private store = inject(Store);
  private syncService = inject(AudioReplacerService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectAudioReplacerState);
  videoUrl: string | null = null;

  onVideoSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(AudioReplacerActions.loadVideo({ file }));
  }

  onAudioSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.store.dispatch(AudioReplacerActions.loadAudio({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(AudioReplacerActions.loadMetaSuccess({
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

  onSetMode(mode: 'replace' | 'mix'): void { this.store.dispatch(AudioReplacerActions.setMode({ mode })); }
  onSetOriginalVolume(e: Event): void { this.store.dispatch(AudioReplacerActions.setOriginalVolume({ volume: parseFloat((e.target as HTMLInputElement).value) })); }
  onSetNewAudioVolume(e: Event): void { this.store.dispatch(AudioReplacerActions.setNewAudioVolume({ volume: parseFloat((e.target as HTMLInputElement).value) })); }
  onToggleLoop(): void { this.store.dispatch(AudioReplacerActions.toggleLoopAudio()); }

  onSync(state: AudioReplacerState): void {
    if (!state.videoFile || !state.audioFile) return;
    
    this.store.dispatch(AudioReplacerActions.startProcessing());
    
    this.subscription.add(
      this.syncService.process({
        videoFile: state.videoFile,
        audioFile: state.audioFile,
        mode: state.mode,
        originalVolume: state.originalVolume,
        newAudioVolume: state.newAudioVolume,
        loopAudio: state.loopAudio,
        videoMeta: state.videoMeta!
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(AudioReplacerActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(AudioReplacerActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(AudioReplacerActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Stream alignment failed.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: AudioReplacerState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.syncService.getOutputFilename(state.videoFile?.name || 'video');
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
    this.store.dispatch(AudioReplacerActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}