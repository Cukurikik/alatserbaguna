const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, 'src/app/modules/audio');
function write(relPath, content) {
  const full = path.join(BASE, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trimStart(), 'utf8');
  console.log('✅', relPath);
}

// ─── Shared Components ────────────────────────────────────────────────────────
write('shared/components/audio-drop-zone/audio-drop-zone.component.ts', `
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, signal } from '@angular/core';
import { AudioErrorCode } from '../../types/audio.types';

@Component({
  selector: 'app-audio-drop-zone',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div
      class="relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 min-h-[200px]"
      [class]="isDragging() ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]' : 'border-gray-700 bg-gray-900/30 hover:border-gray-600 hover:bg-gray-900/50'"
      (dragover)="onDragOver($event)" (dragleave)="onDragLeave()" (drop)="onDrop($event)"
      (click)="fileInput.click()">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-transform duration-300"
           [class]="isDragging() ? 'scale-110 bg-cyan-500/20' : 'bg-gray-800'">🎵</div>
      <div class="text-center">
        <p class="text-white font-black text-sm tracking-wide">Drop audio file here</p>
        <p class="text-gray-500 text-xs mt-1">or <span class="text-cyan-400 underline">browse files</span></p>
        <p class="text-gray-600 text-xs mt-2">Supports: MP3, WAV, FLAC, OGG, M4A, OPUS, AAC • Max {{ maxSizeMB }} MB</p>
      </div>
      @if (errorMsg()) {
        <p class="absolute bottom-3 text-xs text-red-400 font-medium">⚠ {{ errorMsg() }}</p>
      }
      <input #fileInput type="file" class="hidden" [accept]="accept" [multiple]="multiple"
             (change)="onFileChange($event)">
    </div>
  \`
})
export class AudioDropZoneComponent {
  @Input() accept = 'audio/*,video/*';
  @Input() multiple = false;
  @Input() maxSizeMB = 500;
  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() validationError = new EventEmitter<AudioErrorCode>();
  isDragging = signal(false);
  errorMsg = signal<string | null>(null);

  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging.set(true); }
  onDragLeave() { this.isDragging.set(false); }
  onDrop(e: DragEvent) {
    e.preventDefault(); this.isDragging.set(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    this.validate(files);
  }
  onFileChange(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    this.validate(files);
    (e.target as HTMLInputElement).value = '';
  }
  private validate(files: File[]) {
    this.errorMsg.set(null);
    const valid = files.filter(f => {
      if (f.size > this.maxSizeMB * 1024 * 1024) {
        this.errorMsg.set(\`\${f.name} exceeds \${this.maxSizeMB} MB limit\`);
        this.validationError.emit('FILE_TOO_LARGE');
        return false;
      }
      return true;
    });
    if (valid.length) this.filesSelected.emit(valid);
  }
}
`);

write('shared/components/audio-player/audio-player.component.ts', `
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, OnDestroy, signal, SimpleChanges } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @if (audioBlob) {
      <div class="bg-gray-900/60 rounded-2xl p-4 border border-gray-800">
        <audio #audioEl [src]="blobUrl" [loop]="loop" (timeupdate)="onTimeUpdate(audioEl)"
               (loadedmetadata)="onMeta(audioEl)" (ended)="playing.set(false)" class="hidden"></audio>
        <div class="flex items-center gap-4">
          <button (click)="toggle(audioEl)"
            class="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 transition-colors shrink-0">
            {{ playing() ? '⏸' : '▶' }}
          </button>
          <div class="flex-1">
            <input type="range" min="0" [max]="duration()" step="0.01" [value]="currentTime()"
                   (input)="seek(audioEl, $event)"
                   class="w-full h-1 bg-gray-700 rounded appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer">
          </div>
          <span class="text-xs text-gray-400 font-mono shrink-0">{{ fmt(currentTime()) }} / {{ fmt(duration()) }}</span>
        </div>
      </div>
    }
  \`
})
export class AudioPlayerComponent implements OnChanges, OnDestroy {
  @Input() audioBlob: Blob | null = null;
  @Input() loop = false;
  blobUrl: string | null = null;
  playing = signal(false);
  currentTime = signal(0);
  duration = signal(0);

  ngOnChanges(c: SimpleChanges) {
    if (c['audioBlob']) {
      if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = this.audioBlob ? URL.createObjectURL(this.audioBlob) : null;
      this.playing.set(false); this.currentTime.set(0); this.duration.set(0);
    }
  }
  ngOnDestroy() { if (this.blobUrl) URL.revokeObjectURL(this.blobUrl); }
  toggle(el: HTMLAudioElement) { el.paused ? (el.play(), this.playing.set(true)) : (el.pause(), this.playing.set(false)); }
  onTimeUpdate(el: HTMLAudioElement) { this.currentTime.set(el.currentTime); }
  onMeta(el: HTMLAudioElement) { this.duration.set(el.duration); }
  seek(el: HTMLAudioElement, e: Event) { el.currentTime = Number((e.target as HTMLInputElement).value); }
  fmt(s: number): string {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return \`\${m}:\${sec.toString().padStart(2, '0')}\`;
  }
}
`);

write('shared/components/audio-progress-ring/audio-progress-ring.component.ts', `
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-audio-progress-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="relative w-20 h-20 flex items-center justify-center">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" class="text-gray-800" stroke-width="6"/>
        <circle cx="40" cy="40" r="34" fill="none" [attr.stroke]="strokeColor" stroke-width="6"
                stroke-linecap="round" [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="offset" class="transition-all duration-300"/>
      </svg>
      <span class="absolute text-xs font-mono font-black" [style.color]="strokeColor">{{ progress }}%</span>
    </div>
  \`
})
export class AudioProgressRingComponent {
  @Input() progress = 0;
  @Input() color = 'cyan';
  circumference = 2 * Math.PI * 34;
  get offset() { return this.circumference - (this.progress / 100) * this.circumference; }
  get strokeColor() {
    const map: Record<string, string> = { cyan: '#22d3ee', emerald: '#34d399', red: '#f87171', purple: '#a78bfa' };
    return map[this.color] ?? '#22d3ee';
  }
}
`);

write('shared/components/waveform-display/waveform-display.component.ts', `
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { WaveformData } from '../../types/audio.types';

@Component({
  selector: 'app-waveform-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="relative w-full h-24 bg-gray-950 rounded-xl overflow-hidden cursor-crosshair"
         (click)="onCanvasClick($event)">
      <canvas #canvas class="w-full h-full" (mousedown)="onMouseDown($event)"></canvas>
      @if (!waveformData) {
        <div class="absolute inset-0 flex items-center justify-center text-gray-700 text-xs">No waveform data</div>
      }
    </div>
  \`
})
export class WaveformDisplayComponent implements OnChanges {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() waveformData: WaveformData | null = null;
  @Input() selectionStart: number | null = null;
  @Input() selectionEnd: number | null = null;
  @Input() markers: number[] = [];
  @Input() currentTime = 0;
  @Output() seek = new EventEmitter<number>();
  @Output() selectionChange = new EventEmitter<{ start: number; end: number }>();

  ngOnChanges(c: SimpleChanges) { this.draw(); }

  draw() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 600; canvas.height = rect.height || 96;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!this.waveformData) return;
    const peaks = this.waveformData.peaks;
    const w = canvas.width, h = canvas.height, mid = h / 2;
    const selStart = this.selectionStart, selEnd = this.selectionEnd;
    const dur = this.waveformData.duration;
    if (selStart !== null && selEnd !== null) {
      ctx.fillStyle = 'rgba(34,211,238,0.12)';
      ctx.fillRect(selStart / dur * w, 0, (selEnd - selStart) / dur * w, h);
    }
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < peaks.length; i++) {
      const x = (i / peaks.length) * w;
      const y = peaks[i] * mid * 0.9;
      ctx.moveTo(x, mid - y); ctx.lineTo(x, mid + y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
    const cx = (this.currentTime / dur) * w;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    for (const m of this.markers) {
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5;
      const mx = (m / dur) * w;
      ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, h); ctx.stroke();
    }
  }

  onCanvasClick(e: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const dur = this.waveformData?.duration ?? 0;
    this.seek.emit(ratio * dur);
  }

  onMouseDown(_e: MouseEvent) {}
}
`);

write('shared/components/spectrum-analyzer/spectrum-analyzer.component.ts', `
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ElementRef, ViewChild, OnDestroy, OnChanges } from '@angular/core';

@Component({
  selector: 'app-spectrum-analyzer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<canvas #canvas class="w-full h-full rounded-xl bg-gray-950"></canvas>\`
})
export class SpectrumAnalyzerComponent implements OnDestroy, OnChanges {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() analyserNode: AnalyserNode | null = null;
  private rafId = 0;

  ngOnChanges() {
    cancelAnimationFrame(this.rafId);
    if (this.analyserNode) this.draw();
  }
  ngOnDestroy() { cancelAnimationFrame(this.rafId); }

  private draw() {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 400; canvas.height = rect.height || 80;
    const ctx = canvas.getContext('2d')!;
    const node = this.analyserNode!;
    const data = new Uint8Array(node.frequencyBinCount);
    const loop = () => {
      this.rafId = requestAnimationFrame(loop);
      node.getByteFrequencyData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barW = canvas.width / data.length * 2.5;
      for (let i = 0; i < data.length; i++) {
        const h = (data[i] / 255) * canvas.height;
        const hue = 180 + (i / data.length) * 80;
        ctx.fillStyle = \`hsl(\${hue},80%,55%)\`;
        ctx.fillRect(i * barW, canvas.height - h, barW - 1, h);
      }
    };
    loop();
  }
}
`);

console.log('\n✅ PART 2 COMPLETE: Shared components written.\n');
