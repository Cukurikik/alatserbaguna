import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ReverserActions, selectReverserState, ReverserState } from './reverser.store';
import { ReverserService } from './reverser.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reverser',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-rose-400 via-pink-500 to-red-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Video Reverser
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Chronos Engine: Time Inversion</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-rose-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-rose-950/30 transition-colors">
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
               <div class="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Temporal Inversion</h4>
                    <p class="text-xs text-gray-500 mt-1">Flip every frame in reverse sequence for a perfect rewind effect. Leverages lossless spatial data.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-pink-500/5 border border-pink-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464L19 12m0 0l-3.464 3.536M19 12H5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Audio Retrograde</h4>
                    <p class="text-xs text-gray-500 mt-1">Optional phase-accurate audio reversal to match the inverted visual timeline.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Warning -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'INVERTING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2">
                         <p class="text-rose-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Rewinding Timeline</p>
                         @if (vm.durationWarning) {
                            <p class="text-amber-400/80 font-mono text-[8px] uppercase">Segmented Processing Active (High RAM usage)</p>
                         }
                      </div>
                   </div>
                }
              </div>

              <!-- Metadata Grid -->
              <div class="grid grid-cols-3 gap-4">
                 <div class="bg-gray-900/40 p-5 rounded-2xl border border-gray-800 shadow-lg">
                    <span class="block text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Source Stream</span>
                    <span class="text-white font-mono text-xs tracking-tighter truncate block">{{ vm.inputFile.name }}</span>
                 </div>
                 <div class="bg-gray-900/40 p-5 rounded-2xl border border-gray-800 shadow-lg">
                    <span class="block text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Frame Count</span>
                    <span class="text-white font-mono text-xs tracking-tighter">{{ ((vm.videoMeta?.duration || 0) * (vm.videoMeta?.fps || 30)).toFixed(0) }} F</span>
                 </div>
                 <div class="bg-gray-900/40 p-5 rounded-2xl border border-gray-800 shadow-lg font-mono flex flex-col gap-1">
                    <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Status</span>
                    <span [class]="vm.status === 'success' ? 'text-emerald-400' : 'text-rose-400'" class="text-[10px] uppercase font-black tracking-tighter">
                       {{ vm.status }}
                    </span>
                 </div>
              </div>
            </div>

            <!-- Right: Settings Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Logic Panel -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                 
                 <!-- Option Toggle -->
                 <div class="p-6 bg-black/30 rounded-2xl border border-gray-800/50">
                    <div class="flex items-center justify-between mb-2">
                       <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Reverse Audio Stream</label>
                       <button (click)="onToggleAudio(!vm.reverseAudio)" 
                         [class]="vm.reverseAudio ? 'bg-rose-500' : 'bg-gray-800'"
                         class="w-12 h-6 rounded-full relative transition-colors duration-200">
                         <div [class]="vm.reverseAudio ? 'translate-x-7' : 'translate-x-1'"
                           class="absolute top-1 left-0 w-4 h-4 rounded-full bg-white transition-transform duration-200"></div>
                       </button>
                    </div>
                    <p class="text-[8px] text-gray-600 uppercase">If disabled, the original audio will be muted.</p>
                 </div>

                 <!-- Duration Warning Card -->
                 @if (vm.durationWarning) {
                    <div class="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/20 flex items-start gap-4" [@slideUp]>
                       <div class="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                       </div>
                       <div>
                          <h4 class="text-[10px] font-black text-amber-500 uppercase">Long Duration Detected</h4>
                          <p class="text-[9px] text-gray-500 mt-1 leading-relaxed">Videos over 120s require segmented processing to prevent memory overflows. Export may take longer.</p>
                       </div>
                    </div>
                 }

                 <!-- Technical Command Visualizer -->
                 <div class="bg-black/40 rounded-2xl border border-gray-800 p-4 font-mono">
                    <p class="text-[9px] text-gray-700 uppercase mb-2">Internal Command Buffer</p>
                    <div class="text-[10px] text-rose-400 group relative">
                       <span class="opacity-40 tracking-tighter">ffmpeg -i src.mp4 -vf</span> 
                       <span class="font-black tracking-widest px-1 bg-rose-500/10 rounded">reverse</span>
                       @if (vm.reverseAudio) {
                          <span class="opacity-40"> -af</span> <span class="font-black tracking-widest px-1 bg-pink-500/10 rounded">areverse</span>
                       }
                    </div>
                 </div>

                 <!-- Action Button Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onStartReverse(vm)"
                         class="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
                         Start Time Inversion
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Download Asset
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Final Data Volume: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Allocating WASM Heap...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase tracking-tight">Chronos Core Failure</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Temporal stream corrupted' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onStartReverse(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Re-sync Pipeline</button>
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
export class ReverserComponent implements OnDestroy {
  private store = inject(Store);
  private reverserService = inject(ReverserService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectReverserState);
  videoUrl: string | null = null;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(ReverserActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(ReverserActions.loadMetaSuccess({
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

  onToggleAudio(reverseAudio: boolean): void {
    this.store.dispatch(ReverserActions.setReverseAudio({ reverseAudio }));
  }

  onStartReverse(state: ReverserState): void {
    if (!state.inputFile || !state.videoMeta) return;
    
    this.store.dispatch(ReverserActions.startProcessing());
    
    this.subscription.add(
      this.reverserService.process({
        file: state.inputFile,
        reverseAudio: state.reverseAudio,
        videoMeta: state.videoMeta
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(ReverserActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: 'video/mp4' });
            this.store.dispatch(ReverserActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024)
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(ReverserActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Inversion thread crashed. Segmented process might be required.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: ReverserState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.reverserService.getOutputFilename(state.inputFile?.name || 'video');
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
    this.store.dispatch(ReverserActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}