import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { AudioExtractorActions, selectAudioExtractorState, AudioExtractorState } from './audio-extractor.store';
import { AudioExtractorService } from './audio-extractor.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { VideoPreviewComponent } from '../shared/components/video-preview/video-preview.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

const FORMATS = ['mp3', 'aac', 'wav', 'ogg', 'flac'];
const BITRATES = [128, 192, 256, 320];

@Component({
  selector: 'app-audio-extractor',
  standalone: true,
  imports: [AsyncPipe, FileDropZoneComponent, VideoPreviewComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-emerald-400 via-teal-500 to-green-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Acoustic Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Stream Demuxer: Lossless Extraction v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-emerald-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-emerald-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Dispose
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
               <div class="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Track Isolation</h4>
                    <p class="text-xs text-gray-500 mt-1">Surgically extract audio component from multiplexed containers. Zero-copy transfer optimization.</p>
                  </div>
               </div>
               <div class="p-6 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-start gap-4">
                  <div class="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                  </div>
                  <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wide">Multi-Codec Support</h4>
                    <p class="text-xs text-gray-500 mt-1">Transcode to MP3, AAC, FLAC, or Lossless WAV. Configurable bitrates up to 320kbps.</p>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- Pillar 4: Component Logic Area -->
        @if (vm.inputFile) {
          <div class="flex-1 flex flex-col lg:flex-row gap-8" [@fadeIn]>
            
            <!-- Left: Preview & Waveform Simulation -->
            <div class="flex-1 flex flex-col gap-6">
              <div class="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-black/40 aspect-video flex-col flex items-center justify-center">
                <app-video-preview [videoUrl]="videoUrl" (durationLoaded)="onDurationLoaded($event)"></app-video-preview>
                
                @if (vm.status === 'processing') {
                   <div class="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-10" [@fadeIn]>
                      <app-progress-ring [progress]="vm.progress" [status]="'EXTRACTING'"></app-progress-ring>
                      <div class="mt-6 flex flex-col items-center gap-2 text-center px-6">
                         <p class="text-emerald-400 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-black">Demuxing Atomic Streams</p>
                         <p class="text-gray-500 font-mono text-[8px] uppercase">Integrating PCM Buffer Transcoder</p>
                      </div>
                   </div>
                }

                <div class="absolute top-4 right-4 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-lg backdrop-blur-md flex items-center gap-2">
                   <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                   <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Acoustic-Input v1.0</span>
                </div>
              </div>

              <!-- Stream Dashboard -->
              <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Source Buffer</span>
                       <span class="text-white font-mono text-xs truncate">{{ vm.inputFile.name }}</span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest leading-none mb-1">Transcode Format</span>
                       <span class="text-emerald-400 text-xs font-black truncate uppercase">
                          {{ vm.outputFormat }} / {{ vm.outputFormat === 'wav' || vm.outputFormat === 'flac' ? 'Lossless' : vm.bitrate + 'k' }}
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pr-4 pl-4 font-mono">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Sampling Matrix</span>
                       <span class="text-white text-[10px] uppercase font-black">
                          44.1 kHz / 16-bit
                       </span>
                    </div>
                    <div class="flex flex-col gap-1 border-r border-gray-800 last:border-0 pl-4">
                       <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Pipeline State</span>
                       <span class="text-gray-400 font-mono text-[10px] tracking-tighter">stream_isolate_v0.2</span>
                    </div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent"></div>
              </div>
            </div>

            <!-- Right: Parameters Panel -->
            <div class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Parameters Card -->
              <div class="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                 
                 <!-- Format Matrix -->
                 <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Output format Buffer</label>
                    <div class="grid grid-cols-3 gap-2">
                       @for (fmt of formats; track fmt) {
                          <button (click)="onSetFormat(fmt)" [class]="vm.outputFormat === fmt ? 'bg-emerald-500 text-emerald-950 font-black border-emerald-400' : 'bg-black/40 text-gray-500 hover:text-white border-gray-800'"
                            class="py-3 rounded-xl text-[9px] uppercase font-black transition-all border">
                             {{ fmt }}
                          </button>
                       }
                    </div>
                 </div>

                 <!-- Bitrate Control (Contextual) -->
                 @if (vm.outputFormat !== 'wav' && vm.outputFormat !== 'flac') {
                    <div [@fadeIn]>
                       <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 leading-none italic opacity-60">Magnitude (kbps)</label>
                       <div class="grid grid-cols-4 gap-2">
                          @for (br of bitrates; track br) {
                             <button (click)="onSetBitrate(br)" [class]="vm.bitrate === br ? 'bg-emerald-500 text-emerald-950 font-black' : 'bg-black/40 text-gray-500 hover:text-white'"
                               class="py-3 rounded-xl text-[9px] uppercase font-black transition-all border border-gray-800">
                                {{ br }}
                             </button>
                          }
                       </div>
                    </div>
                 } @else {
                    <div class="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4" [@fadeIn]>
                       <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                       </div>
                       <p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Lossless PCM Encoding Mode Active</p>
                    </div>
                 }

                 <!-- Action Area -->
                 <div class="pt-4 border-t border-gray-800/50">
                    @if (vm.status === 'idle' || vm.status === 'error') {
                       <button (click)="onExtract(vm)"
                         class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                         Start Demux
                       </button>
                    } @else if (vm.status === 'success') {
                       <div class="space-y-3" [@slideUp]>
                          <button (click)="onDownload(vm)" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Save Audio
                          </button>
                          @if (vm.outputSizeMB) {
                            <p class="text-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">Extracted Magnitude: {{ vm.outputSizeMB.toFixed(2) }} MB</p>
                          }
                       </div>
                    } @else {
                       <div class="h-14 w-full bg-gray-800/20 rounded-2xl flex items-center justify-center border border-dashed border-gray-800 opacity-50">
                          <span class="text-[10px] font-mono text-gray-600 uppercase tracking-widest animate-pulse">Scanning Stream Headers...</span>
                       </div>
                    }

                    @if (vm.status === 'error') {
                       <div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4" [@fadeIn]>
                          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                          <div class="flex-1">
                            <p class="text-white font-black text-xs uppercase tracking-tight">Stream Fault</p>
                            <p class="text-rose-400 font-mono text-[9px] mt-1 pr-2 leading-relaxed opacity-80">{{ vm.errorMessage || 'Unknown demux rejection' }}</p>
                            @if (vm.retryable) {
                               <button (click)="onExtract(vm)" class="mt-4 text-[10px] font-black uppercase text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/10 transition-all">Restart Demux</button>
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
export class AudioExtractorComponent implements OnDestroy {
  private store = inject(Store);
  private extractorService = inject(AudioExtractorService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectAudioExtractorState);
  videoUrl: string | null = null;
  readonly formats = FORMATS;
  readonly bitrates = BITRATES;

  onFileSelected(file: File): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.store.dispatch(AudioExtractorActions.loadFile({ file }));
  }

  onDurationLoaded(duration: number): void {
    this.store.dispatch(AudioExtractorActions.loadMetaSuccess({
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

  onSetFormat(outputFormat: any): void { this.store.dispatch(AudioExtractorActions.setOutputFormat({ outputFormat })); }
  onSetBitrate(bitrate: any): void { this.store.dispatch(AudioExtractorActions.setBitrate({ bitrate })); }

  onExtract(state: AudioExtractorState): void {
    if (!state.inputFile) return;
    
    this.store.dispatch(AudioExtractorActions.startProcessing());
    
    this.subscription.add(
      this.extractorService.process({
        file: state.inputFile,
        outputFormat: state.outputFormat,
        bitrate: state.bitrate,
        videoDuration: state.videoMeta?.duration || 0
      }).subscribe({
        next: (msg) => {
          if (msg.type === 'progress') {
            this.store.dispatch(AudioExtractorActions.updateProgress({ progress: msg.value ?? 0 }));
          } else if (msg.type === 'complete') {
            const blob = new Blob([msg.data as BlobPart], { type: `audio/${state.outputFormat}` });
            this.store.dispatch(AudioExtractorActions.processingSuccess({ 
              outputBlob: blob,
              outputSizeMB: blob.size / (1024 * 1024),
              waveformData: new Float32Array(0) // Logic for waveform can be added if needed
            }));
          }
        },
        error: (err) => {
          this.store.dispatch(AudioExtractorActions.processingFailure({ 
            errorCode: 'FFMPEG_COMMAND_FAILED', 
            message: err.message ?? 'Demux integration rejected.',
            retryable: true
          }));
        }
      })
    );
  }

  onDownload(state: AudioExtractorState): void {
    if (state.outputBlob) {
      const url = URL.createObjectURL(state.outputBlob);
      const filename = this.extractorService.getOutputFilename(state.inputFile?.name || 'video', state.outputFormat);
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 150);
    }
  }

  onReset(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
    this.store.dispatch(AudioExtractorActions.resetState());
  }

  ngOnDestroy(): void {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.subscription.unsubscribe();
  }
}