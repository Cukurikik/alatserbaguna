import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-elevated border border-white/5">
      <div class="w-2 h-2 rounded-full" 
           [class.bg-status-success]="status === 'online'" 
           [class.bg-status-error]="status === 'offline'" 
           [class.animate-pulse-slow]="status === 'online'"></div>
      <span class="text-xs font-mono font-medium text-text-secondary uppercase tracking-wider">
        {{ status }}
      </span>
    </div>
  `
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: 'online' | 'offline';
}
