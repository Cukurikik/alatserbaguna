import { Component, ChangeDetectionStrategy, inject, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone, signal, ChangeDetectorRef } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger } from '@angular/animations';
import { RecorderActions, selectRecorderState } from './recorder.store';
import { RecorderService } from './recorder.service';
import { ExportFormat } from '../shared/types/audio.types';

@Component({
  selector: 'app-recorder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DecimalPipe, NgClass],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('400ms ease-out', style({ opacity: 1 }))])]),
    trigger('recordPulse', [
      transition('* => recording', [
        style({ transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' }),
        animate('1.5s infinite cubic-bezier(0.66, 0, 0, 1)', style({ transform: 'scale(1)', boxShadow: '0 0 0 20px rgba(239, 68, 68, 0)' }))
      ])
    ])
  ],
  template: `
    <div class="h-full w-full bg-[#0a0a0f] text-white p-6 flex flex-col overflow-y-auto" [@fadeIn]>
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-4xl font-black bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent drop-shadow-md tracking-tight">
            🎙️ Audio Recorder
          </h2>
          <p class="text-gray-400 text-sm mt-1 uppercase tracking-widest">Studio-grade multi-source capture</p>
        </div>
        @if ((state$ | async)?.status === 'recording') {
          <div class="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full animate-pulse">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <span class="text-red-400 font-bold text-xs uppercase tracking-widest">REC</span>
          </div>
        }
      </div>

      @if (state$ | async; as state) {
        
        <!-- Main Recorder Interface -->
        <div class="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          
          <!-- Left Panel: Controls & Visualizer -->
          <div class="flex-1 flex flex-col gap-6">
            
            <!-- Source & Format Config -->
            <div class="bg-[#12121a] p-6 rounded-2xl border border-gray-800 flex flex-wrap gap-6 items-center">
              <div>
                <label class="block text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold">Input Source</label>
                <div class="flex rounded-lg overflow-hidden border border-gray-700">
                  <button (click)="audioSource.set('mic')" [ngClass]="{'bg-gray-700 text-white': audioSource() === 'mic', 'bg-gray-900 text-gray-500': audioSource() !== 'mic'}" class="px-4 py-2 text-sm font-bold transition-colors">Microphone</button>
                  <button (click)="audioSource.set('system')" [ngClass]="{'bg-gray-700 text-white': audioSource() === 'system', 'bg-gray-900 text-gray-500': audioSource() !== 'system'}" class="px-4 py-2 text-sm font-bold transition-colors border-l border-gray-700">System Audio</button>
                </div>
              </div>
              
              <div>
                <label class="block text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold">Output Format</label>
                <select [value]="outputFormat()" (change)="onFormatChange($event)" class="bg-gray-900 border border-gray-700 text-white text-sm font-bold rounded-lg px-4 py-2 outline-none focus:border-red-500 transition-colors">
                  <option value="wav">WAV (Lossless)</option>
                  <option value="mp3">MP3</option>
                  <option value="m4a">AAC (m4a)</option>
                  <option value="flac">FLAC</option>
                </select>
              </div>
            </div>

            <!-- Visualization & Timer -->
            <div class="flex-1 bg-[#12121a] rounded-2xl border border-gray-800 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
              
              <!-- Timer -->
              <div class="absolute top-6 left-1/2 -translate-x-1/2 flex items-baseline gap-1 z-10">
                <span class="font-mono text-6xl font-light tracking-tighter">{{ formatTime(durationMs()) }}</span>
                <span class="font-mono text-xl text-gray-500">.{{ formatMs(durationMs()) }}</span>
              </div>

              <!-- Canvas Waveform -->
              <div class="w-full absolute inset-0 bottom-1/4 pt-24">
                 <canvas #waveformCanvas class="w-full h-full opacity-80 mix-blend-screen"></canvas>
              </div>
              
              <!-- VU Meter (Vertical) -->
              <div class="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-48 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                <div class="w-full bg-gradient-to-t from-green-500 via-yellow-400 to-red-500 transition-all duration-75"
                     [style.height.%]="vuLevel() * 100" [style.transform]="'translateY(' + (100 - vuLevel()*100) + '%)'"></div>
              </div>

            </div>

            <!-- Transport Controls -->
            <div class="bg-[#12121a] p-6 rounded-2xl border border-gray-800 flex justify-center items-center gap-8">
              
              <!-- Pause/Resume -->
              <button 
                [disabled]="state.status === 'idle' || state.status === 'done'"
                (click)="onPauseResume(state)"
                class="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-30 disabled:cursor-not-allowed">
                @if(state.status === 'paused') {
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                } @else {
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                }
              </button>

              <!-- Main Record Button -->
              <div class="relative w-24 h-24 flex items-center justify-center">
                @if(state.status === 'idle' || state.status === 'done') {
                  <button (click)="onStart()" aria-label="Start Recording" class="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 border-[6px] border-[#12121a] outline outline-2 outline-gray-700 shadow-xl transition-all hover:scale-105 active:scale-95"></button>
                } @else {
                  <button (click)="onStop()" [@recordPulse]="state.status" class="w-20 h-20 rounded-xl bg-red-600 border-[6px] border-[#12121a] outline outline-2 outline-red-900 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center">
                    <div class="w-6 h-6 bg-white rounded-sm"></div>
                  </button>
                }
              </div>

              <!-- Stop / Reset -->
              <button 
                [disabled]="state.status === 'idle'"
                (click)="onReset()"
                class="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-gray-800 hover:bg-red-900/50 hover:text-red-400 text-white disabled:opacity-30 disabled:cursor-not-allowed">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              
            </div>

          </div>

          <!-- Right Panel: Results & History -->
          <div class="w-full lg:w-96 flex flex-col gap-6">
            
            <div class="flex-1 bg-[#12121a] rounded-2xl border border-gray-800 p-6 flex flex-col">
              <h3 class="text-sm font-black text-gray-500 uppercase tracking-widest mb-6 pb-4 border-b border-gray-800">Session Result</h3>
              
              @if (state.status === 'processing') {
                <div class="flex flex-col items-center justify-center flex-1 text-center">
                  <div class="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p class="text-white font-bold">Encoding Audio...</p>
                  <p class="text-gray-500 text-xs mt-2">Merging chunks to {{ outputFormat().toUpperCase() }}</p>
                </div>
              } @else if (state.status === 'done' && state.outputBlob) {
                <div class="flex flex-col flex-1 gap-6">
                  <div class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p class="text-emerald-400 font-bold text-lg mb-1">Recording Successfully Saved</p>
                    <div class="flex gap-4 text-xs text-emerald-500/70 font-mono">
                      <span>{{ state.outputSizeMB | number:'1.2-2' }} MB</span>
                      <span>{{ outputFormat().toUpperCase() }}</span>
                    </div>
                  </div>
                  
                  <!-- Simple native audio player for playback -->
                  <audio [src]="getBlobUrl(state.outputBlob)" controls class="w-full outline-none"></audio>
                  
                  <div class="mt-auto pt-6 border-t border-gray-800">
                    <button (click)="onDownload(state)" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Download File
                    </button>
                  </div>
                </div>
              } @else if (state.status === 'error') {
                <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <p class="text-rose-400 font-bold mb-2">Error</p>
                  <p class="text-rose-300/80 text-sm">{{ state.errorMessage }}</p>
                </div>
                <button (click)="onReset()" class="mt-4 py-2 px-4 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Clear</button>
              } @else {
                <div class="flex flex-col items-center justify-center flex-1 text-center opacity-50">
                  <svg class="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                  <p class="text-sm font-medium">Ready to record.</p>
                  <p class="text-xs text-gray-500 mt-2">Press the red button when ready.</p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`:host { display:block; height:100% }`]
})
export class RecorderComponent implements AfterViewInit, OnDestroy {
  private store = inject(Store);
  private recorderService = inject(RecorderService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  
  readonly state$ = this.store.select(selectRecorderState);
  
  @ViewChild('waveformCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  audioSource = signal<'mic' | 'system' | 'both'>('mic');
  outputFormat = signal<ExportFormat>('wav');
  
  durationMs = signal(0);
  vuLevel = signal(0);
  
  private timerInterval: any;
  private animFrameId: number | null = null;
  private cachedBlobUrls = new Map<Blob, string>();

  onFormatChange(e: Event) {
    const format = (e.target as HTMLSelectElement).value as ExportFormat;
    this.outputFormat.set(format);
    this.store.dispatch(RecorderActions.setOutputFormat({ format }));
  }

  onStart() {
    this.store.dispatch(RecorderActions.startRecording({ source: this.audioSource(), deviceId: null }));
    this.durationMs.set(0);
    this.startTimer();
    this.startVisualizer();
  }

  onStop() {
    this.store.dispatch(RecorderActions.stopRecording());
    this.stopTimer();
  }

  onPauseResume(state: any) {
    if (state.status === 'recording') {
      this.store.dispatch(RecorderActions.pauseRecording());
      this.stopTimer();
    } else if (state.status === 'paused') {
      this.store.dispatch(RecorderActions.resumeRecording());
      this.startTimer();
    }
  }

  onReset() {
    this.stopTimer();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.durationMs.set(0);
    this.vuLevel.set(0);
    
    // Clear canvas
    if (this.canvasRef && this.canvasRef.nativeElement) {
      const ctx = this.canvasRef.nativeElement.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    }

    this.store.dispatch(RecorderActions.resetState());
    
    // Revoke all cached blob urls
    this.cachedBlobUrls.forEach(url => URL.revokeObjectURL(url));
    this.cachedBlobUrls.clear();
  }

  onDownload(state: any) {
    if (!state.outputBlob) return;
    const url = this.getBlobUrl(state.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_recording_${new Date().getTime()}.${this.outputFormat()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  getBlobUrl(blob: Blob): string {
    if (this.cachedBlobUrls.has(blob)) {
      return this.cachedBlobUrls.get(blob)!;
    }
    const url = URL.createObjectURL(blob);
    this.cachedBlobUrls.set(blob, url);
    return url;
  }

  formatTime(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `\${m}:\${s}`;
  }

  formatMs(ms: number): string {
    return Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  }

  private startTimer() {
    this.stopTimer();
    const startTime = Date.now() - this.durationMs();
    this.timerInterval = setInterval(() => {
      this.durationMs.set(Date.now() - startTime);
      // periodically dispatch to store so state is somewhat in sync
      if (this.durationMs() % 1000 < 50) { 
        this.store.dispatch(RecorderActions.updateDuration({ seconds: Math.floor(this.durationMs()/1000) }));
      }
      this.cdr.detectChanges(); // forces UI update for the timer
    }, 50);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  ngAfterViewInit() {
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  private resizeCanvas() {
    if (!this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  }

  private startVisualizer() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    
    // Run visualizer outside Angular zone to prevent excessive ChangeDetection triggers
    this.ngZone.runOutsideAngular(() => {
      const draw = () => {
        this.animFrameId = requestAnimationFrame(draw);
        
        const analyser = this.recorderService.getAnalyserNode();
        const canvas = this.canvasRef?.nativeElement;
        if (!analyser || !canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        analyser.getByteTimeDomainData(dataArray);

        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ef4444'; // Tailwind red-500
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';

        ctx.beginPath();
        const sliceWidth = width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * height / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        
        // Update VU outside zone, but manually update signal
        const vu = this.recorderService.calculateVULevel();
        if (Math.abs(this.vuLevel() - vu) > 0.05) {
          this.ngZone.run(() => this.vuLevel.set(vu));
        }
      };
      
      draw();
    });
  }

  ngOnDestroy() {
    this.onReset();
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }
}
