import { Component, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { AnalyserActions, selectAnalyserState, AnalyserState } from './analyser.store';
import { AnalyserService } from './analyser.service';
import { FileDropZoneComponent } from '../shared/components/file-drop-zone/file-drop-zone.component';
import { ProgressRingComponent } from '../shared/components/progress-ring/progress-ring.component';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-analyser',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, FileDropZoneComponent, ProgressRingComponent],
  template: `
    <div class="h-full w-full bg-gray-950/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar" [@fadeIn]>
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg pb-1 tracking-tight">
            Sentry Engine
          </h2>
          <p class="text-gray-400 text-sm mt-1 font-medium italic opacity-80 uppercase tracking-widest">Stream Forensics: Packet Inspect v1.0</p>
        </div>
        @if (vm$ | async; as vm) {
          @if (vm.inputFile) {
            <button (click)="onReset()" class="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-emerald-400 transition-all uppercase tracking-tighter">
              <span class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-emerald-950/30 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </span>
              Eject Stream
            </button>
          }
        }
      </div>

      @if (vm$ | async; as vm) {
        
        <div class="flex-1 flex flex-col gap-8" [@fadeIn]>
            
            @if (vm.status === 'idle') {
               <div class="flex-1 flex flex-col items-center justify-center py-20 gap-8 animate-in fade-in zoom-in-95 duration-700">
                  <div class="relative group">
                     <div class="absolute -inset-4 bg-emerald-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <app-file-drop-zone (fileDropped)="onFileSelected($event)" class="w-full max-w-sm"></app-file-drop-zone>
                  </div>
                  <div class="text-center space-y-2 max-w-xs">
                     <p class="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] font-mono leading-relaxed italic">Awaiting_Bitstream_Ingress</p>
                     <p class="text-[8px] font-mono text-gray-600 uppercase tracking-widest leading-relaxed">Inject any video container to initialize deep packet forensics and metadata sniffing.</p>
                  </div>
               </div>
            }

            @if (vm.status === 'processing') {
               <div class="flex-1 flex flex-col items-center justify-center gap-8 py-20">
                  <app-progress-ring [progress]="vm.progress" [status]="'SCANNING'"></app-progress-ring>
                  <div class="flex flex-col items-center text-center gap-3">
                     <div class="flex gap-1.5 items-center">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                        <p class="text-emerald-400 font-mono text-[10px] uppercase tracking-[0.4em] font-black">Decrypting Container Header</p>
                     </div>
                     <p class="text-gray-600 font-mono text-[8px] uppercase tracking-widest animate-pulse italic">Traversing Atom Structure...</p>
                  </div>
               </div>
            }

            @if (vm.status === 'success') {
               <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0" [@slideUp]>
                  
                  <!-- Left: Core Forensics -->
                  <div class="lg:col-span-4 flex flex-col gap-6">
                     <div class="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden shadow-2xl">
                        <div class="flex items-center justify-between border-b border-gray-800 pb-4">
                           <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono italic opacity-60">Global_Metadata_Root</span>
                           <span class="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase">Verified</span>
                        </div>

                        <div class="space-y-6">
                           <div class="flex flex-col gap-1">
                              <span class="text-[8px] font-black text-gray-600 uppercase tracking-widest">Filename</span>
                              <p class="text-xs font-black text-white uppercase tracking-tight truncate">{{ vm.inputFile?.name }}</p>
                           </div>
                           <div class="grid grid-cols-2 gap-4">
                              <div class="flex flex-col gap-1">
                                 <span class="text-[8px] font-black text-gray-600 uppercase tracking-widest">Container</span>
                                 <p class="text-[10px] font-black text-emerald-400 font-mono uppercase">{{ vm.videoMeta?.codec || 'Unknown' }}</p>
                              </div>
                              <div class="flex flex-col gap-1">
                                 <span class="text-[8px] font-black text-gray-600 uppercase tracking-widest">Duration</span>
                                 <p class="text-[10px] font-black text-emerald-400 font-mono uppercase">{{ vm.videoMeta?.duration || 0 | number:'1.2-2' }}s</p>
                              </div>
                           </div>
                           <div class="flex flex-col gap-1 pt-4 border-t border-gray-800/50">
                              <span class="text-[8px] font-black text-gray-600 uppercase tracking-widest">Bitrate_Aggregate</span>
                              <div class="flex items-center gap-2">
                                 <span class="text-xl font-black text-white font-mono">{{ (vm.videoMeta?.videoBitrate || 0) / 1000 | number:'1.0-0' }}</span>
                                 <span class="text-[10px] font-black text-gray-500 uppercase font-mono italic">Kbps</span>
                              </div>
                           </div>
                        </div>
                        <div class="absolute -bottom-4 -right-4 text-emerald-500/5 w-32 h-32 rotate-12">
                           <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                        </div>
                     </div>

                     <!-- Stream Stats -->
                     <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-4 flex flex-col items-center">
                           <span class="text-[8px] font-black text-gray-600 uppercase mb-1">Visual_Tracks</span>
                           <span class="text-xl font-black text-white font-mono leading-none">{{ vm.videoStreams.length }}</span>
                        </div>
                        <div class="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-4 flex flex-col items-center">
                           <span class="text-[8px] font-black text-gray-600 uppercase mb-1">Acoustic_Tracks</span>
                           <span class="text-xl font-black text-white font-mono leading-none">{{ vm.audioStreams.length }}</span>
                        </div>
                     </div>
                  </div>

                  <!-- Right: Stream Topology -->
                  <div class="lg:col-span-8 flex flex-col gap-6 h-full min-h-0">
                     <div class="flex-1 bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 flex flex-col gap-6 min-h-0 relative shadow-2xl overflow-hidden">
                        <div class="flex justify-between items-center px-2">
                           <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono italic">Stream_Topology_Nodes</span>
                           <div class="flex gap-4">
                              <span class="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-tighter">Live Monitor</span>
                           </div>
                        </div>

                        <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4" [@listAnimation]>
                           <!-- Video Streams -->
                           @for (vs of vm.videoStreams; track vs.index) {
                              <div class="p-6 rounded-2xl bg-black/40 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center gap-6 group relative overflow-hidden">
                                 <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                 </div>
                                 <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-3">
                                       <span class="text-[10px] font-black text-white uppercase tracking-tight">VIDEO_NODE_#{{ vs.index }}</span>
                                       <span class="text-[8px] font-mono text-emerald-500/60 uppercase">{{ vs.codec }} &#64; {{ vs.profile }}</span>
                                    </div>
                                    <div class="grid grid-cols-4 gap-4 mt-3">
                                       <div class="flex flex-col">
                                          <span class="text-[7px] font-black text-gray-600 uppercase tracking-widest">Resolution</span>
                                          <span class="text-[10px] font-mono text-white">{{ vs.width }}x{{ vs.height }}</span>
                                       </div>
                                       <div class="flex flex-col">
                                          <span class="text-[7px] font-black text-gray-600 uppercase tracking-widest">Framerate</span>
                                          <span class="text-[10px] font-mono text-white">{{ vs.fps }} FPS</span>
                                       </div>
                                       <div class="flex flex-col">
                                          <span class="text-[7px] font-black text-gray-600 uppercase tracking-widest">Bitrate</span>
                                          <span class="text-[10px] font-mono text-white">{{ vs.bitrate }} Kbps</span>
                                       </div>
                                       <div class="flex flex-col">
                                          <span class="text-[7px] font-black text-gray-600 uppercase tracking-widest">Pix_Fmt</span>
                                          <span class="text-[10px] font-mono text-white uppercase">{{ vs.pixelFormat }}</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div class="absolute top-0 right-0 p-3">
                                    <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                 </div>
                              </div>
                           }

                           <!-- Audio Streams -->
                           @for (astream of vm.audioStreams; track astream.index) {
                              <div class="p-6 rounded-2xl bg-black/40 border border-teal-500/20 hover:border-teal-500/40 transition-all flex items-center gap-6 group relative overflow-hidden text-teal-400">
                                 <div class="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                                 </div>
                                 <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-3">
                                       <span class="text-[10px] font-black text-white uppercase tracking-tight">AUDIO_NODE_#{{ astream.index }}</span>
                                       <span class="text-[8px] font-mono text-teal-500/60 uppercase">{{ astream.codec }} • {{ astream.language || 'UND' }}</span>
                                    </div>
                                    <div class="grid grid-cols-3 gap-4 mt-3 text-white">
                                       <div class="flex flex-col">
                                          <span class="text-[7px] font-black text-gray-600 uppercase tracking-widest">Topology</span>
                                          <span class="text-[10px] font-mono">{{ astream.channels }} CH</span>
                                       </div>
                                       <div class="flex flex-col">
                                          <span class="text-[7px] font-black text-gray-600 uppercase tracking-widest">Sample_Rate</span>
                                          <span class="text-[10px] font-mono">{{ astream.sampleRate / 1000 }} kHz</span>
                                       </div>
                                       <div class="flex flex-col">
                                          <span class="text-[7px] font-black text-gray-600 uppercase tracking-widest">Bitrate</span>
                                          <span class="text-[10px] font-mono">{{ astream.bitrate }} Kbps</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           }
                        </div>
                        <div class="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
                     </div>
                  </div>
               </div>
            }
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
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyserComponent implements OnDestroy {
  private store = inject(Store);
  private sentryService = inject(AnalyserService);
  private subscription = new Subscription();
  
  readonly vm$ = this.store.select(selectAnalyserState);

  onFileSelected(file: File): void {
     this.store.dispatch(AnalyserActions.loadFile({ file }));
     
     this.subscription.add(
        this.sentryService.analyse(file).subscribe({
           next: (msg) => {
              if (msg.type === 'complete') {
                 try {
                    const rawJson = msg.data as string;
                    const parsed = JSON.parse(rawJson);
                    const streams = this.sentryService.parseFFprobeStreams(rawJson);
                    
                    // Construct VideoMeta from parsed FFprobe output
                    const format = parsed.format || {};
                    const vStream = streams.videoStreams[0] || {};
                    const aStream = streams.audioStreams[0] || {};
                    const meta = {
                       filename: file.name,
                       fileSizeMB: file.size / (1024 * 1024),
                       duration: parseFloat(format.duration || '0'),
                       width: vStream.width || 0,
                       height: vStream.height || 0,
                       fps: vStream.fps || 0,
                       codec: format.format_name || 'unknown',
                       audioCodec: aStream.codec || null,
                       audioBitrate: aStream.bitrate || 0,
                       videoBitrate: parseInt(format.bit_rate || '0', 10),
                       hasAudio: streams.audioStreams.length > 0,
                       aspectRatio: '16:9'
                    };

                    this.store.dispatch(AnalyserActions.analysisSuccess({
                       meta,
                       ...streams,
                       rawJson
                    }));
                 } catch (e) {
                    this.store.dispatch(AnalyserActions.analysisFailure({
                       errorCode: 'FFMPEG_COMMAND_FAILED',
                       message: 'Failed to reconstruct bitstream topology from forensic dump.',
                       retryable: true
                    }));
                 }
              }
           },
           error: (err) => {
              this.store.dispatch(AnalyserActions.analysisFailure({
                 errorCode: 'FFMPEG_COMMAND_FAILED',
                 message: err.message ?? 'Forensic probe aborted by kernel.',
                 retryable: true
              }));
           }
        })
     );
  }

  onReset(): void {
    this.store.dispatch(AnalyserActions.resetState());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}