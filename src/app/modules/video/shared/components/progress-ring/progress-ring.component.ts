import { Component, ChangeDetectionStrategy, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
      <div class="relative flex items-center justify-center" [style.width.px]="size" [style.height.px]="size">
        <!-- Background circle -->
        <svg class="absolute inset-0 transform -rotate-90" [attr.width]="size" [attr.height]="size">
          <circle
            class="text-gray-800"
            stroke="currentColor"
            fill="transparent"
            [attr.stroke-width]="strokeWidth"
            [attr.r]="radius()"
            [attr.cx]="size / 2"
            [attr.cy]="size / 2"
          />
          
          <!-- Progress circle -->
          <circle
            class="transition-all duration-300 ease-out"
            [attr.stroke]="color"
            fill="transparent"
            [attr.stroke-width]="strokeWidth"
            [attr.stroke-dasharray]="circumference()"
            [attr.stroke-dashoffset]="strokeDashoffset()"
            stroke-linecap="round"
            [attr.r]="radius()"
            [attr.cx]="size / 2"
            [attr.cy]="size / 2"
          />
        </svg>
        
        <!-- Center text -->
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-2xl font-bold font-mono text-white" [style.color]="color">
            {{ Math.round(progress) }}%
          </span>
        </div>
      </div>
      
      @if (label) {
        <p class="mt-4 text-sm font-medium text-gray-400 animate-pulse">{{ label }}</p>
      }
    </div>
  `
})
export class ProgressRingComponent {
  @Input() progress = 0;
  @Input() size = 120;
  @Input() strokeWidth = 8;
  @Input() color = '#00f5ff';
  @Input() label = 'Processing...';

  Math = Math;

  radius = computed(() => (this.size / 2) - this.strokeWidth);
  circumference = computed(() => 2 * Math.PI * this.radius());
  strokeDashoffset = computed(() => this.circumference() * (1 - Math.min(Math.max(this.progress, 0), 100) / 100));
}

