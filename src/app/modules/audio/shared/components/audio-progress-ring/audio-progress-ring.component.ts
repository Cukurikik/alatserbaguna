import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-audio-progress-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-20 h-20 flex items-center justify-center">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" class="text-gray-800" stroke-width="6"/>
        <circle cx="40" cy="40" r="34" fill="none" [attr.stroke]="strokeColor" stroke-width="6"
                stroke-linecap="round" [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="offset" class="transition-all duration-300"/>
      </svg>
      <span class="absolute text-xs font-mono font-black" [style.color]="strokeColor">{{ progress }}%</span>
    </div>
  `
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
