
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-audio-progress-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-24 h-24 flex items-center justify-center">
      <svg class="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="6"/>
        <circle cx="48" cy="48" r="40" fill="none" [attr.stroke]="strokeColor" stroke-width="6"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
          style="transition: stroke-dashoffset 0.3s ease"/>
      </svg>
      <span class="absolute text-white font-black text-sm">{{ progress }}%</span>
    </div>
  `,
})
export class AudioProgressRingComponent {
  @Input() progress = 0;
  @Input() color = 'cyan';
  readonly circumference = 2 * Math.PI * 40;
  get dashOffset() { return this.circumference * (1 - this.progress / 100); }
  get strokeColor() {
    const map: Record<string, string> = { cyan: '#22d3ee', blue: '#3b82f6', purple: '#a855f7', green: '#22c55e', red: '#ef4444', amber: '#f59e0b', orange: '#f97316', pink: '#ec4899', indigo: '#6366f1', violet: '#8b5cf6', emerald: '#10b981', sky: '#0ea5e9', teal: '#14b8a6', lime: '#84cc16', rose: '#f43f5e', yellow: '#eab308' };
    return map[this.color] ?? '#22d3ee';
  }
}
