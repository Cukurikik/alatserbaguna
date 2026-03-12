import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GlowHoverDirective } from '../../directives/glow-hover.directive';

export interface Tool {
  id: string;
  label: string;
  icon: string;
  category: string;
  status: 'stable' | 'beta' | 'experimental';
}

@Component({
  selector: 'app-tool-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, GlowHoverDirective],
  template: `
    <div appGlowHover tabindex="0" class="tool-card relative overflow-hidden bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-500 hover:border-accent-cyan/30 hover:bg-white/10 group hover:-translate-y-1 hover:shadow-glow"
         [@hoverGrow] (click)="$event.stopPropagation(); navigate()" (keydown.enter)="navigate()">
      
      <!-- Glow Effect -->
      <div class="absolute inset-0 bg-gradient-to-br from-accent-cyan/0 to-accent-purple/0 group-hover:from-accent-cyan/10 group-hover:to-accent-purple/10 transition-colors duration-700 rounded-3xl pointer-events-none"></div>
      
      <div class="tool-icon-container relative w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all duration-500 group-hover:scale-110">
        <span class="tool-icon text-4xl group-hover:rotate-6 transition-transform duration-500">{{ tool.icon }}</span>
      </div>
      
      <span class="tool-label text-sm font-bold text-text-primary text-center group-hover:text-white transition-colors tracking-wide">{{ tool.label }}</span>
      
      <span class="tool-badge absolute top-4 right-4 text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg border uppercase tracking-widest"
            [class.bg-status-success/10]="tool.status === 'stable'"
            [class.text-status-success]="tool.status === 'stable'"
            [class.border-status-success/20]="tool.status === 'stable'"
            [class.bg-status-warning/10]="tool.status === 'beta'"
            [class.text-status-warning]="tool.status === 'beta'"
            [class.border-status-warning/20]="tool.status === 'beta'"
            [class.bg-accent-purple/10]="tool.status === 'experimental'"
            [class.text-accent-purple]="tool.status === 'experimental'"
            [class.border-accent-purple/20]="tool.status === 'experimental'">
        {{ tool.status }}
      </span>
    </div>
  `,
  animations: [
    trigger('hoverGrow', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class ToolCardComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @Input({ required: true }) tool!: Tool;

  navigate() {
    this.router.navigate([this.tool.id], { relativeTo: this.route });
  }
}
