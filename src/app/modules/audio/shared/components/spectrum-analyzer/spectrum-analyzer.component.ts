import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ElementRef, ViewChild, OnDestroy, OnChanges } from '@angular/core';

@Component({
  selector: 'app-spectrum-analyzer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas class="w-full h-full rounded-xl bg-gray-950"></canvas>`
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
        ctx.fillStyle = `hsl(${hue},80%,55%)`;
        ctx.fillRect(i * barW, canvas.height - h, barW - 1, h);
      }
    };
    loop();
  }
}
