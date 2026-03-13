import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { WaveformData } from '../../types/audio.types';

@Component({
  selector: 'app-waveform-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full h-24 bg-gray-950 rounded-xl overflow-hidden cursor-crosshair"
         (click)="onCanvasClick($event)">
      <canvas #canvas class="w-full h-full" (mousedown)="onMouseDown($event)"></canvas>
      @if (!waveformData) {
        <div class="absolute inset-0 flex items-center justify-center text-gray-700 text-xs">No waveform data</div>
      }
    </div>
  `
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
