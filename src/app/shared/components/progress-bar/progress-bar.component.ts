import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full bg-bg-elevated rounded-full h-2.5 border border-white/5 overflow-hidden">
      <div class="bg-gradient-to-r from-accent-cyan to-accent-purple h-2.5 rounded-full transition-all duration-300 ease-out"
           [style.width.%]="progress"></div>
    </div>
  `
})
export class ProgressBarComponent {
  @Input({ required: true }) progress!: number;
}
