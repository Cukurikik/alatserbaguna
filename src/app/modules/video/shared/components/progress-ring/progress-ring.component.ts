import { fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState } from '../../../../../shared/animations';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="relative flex items-center justify-center w-32 h-32" [@fadeIn]>
      <svg class="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
        <!-- Background circle -->
        <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" fill="none" class="text-gray-700" />
        
        <!-- Foreground circle -->
        <circle 
          cx="50" cy="50" r="40" 
          stroke="url(#gradient)" 
          stroke-width="8" 
          fill="none" 
          stroke-linecap="round"
          [style.stroke-dasharray]="circumference"
          [style.stroke-dashoffset]="circumference - (progress / 100 * circumference)"
          class="transition-all duration-300 ease-out" />
          
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00f5ff" />
            <stop offset="100%" stop-color="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div class="absolute flex flex-col items-center justify-center">
        <span class="text-2xl font-bold text-white">{{ progress | number:'1.0-0' }}%</span>
        @if (status) {
          <span class="text-xs text-gray-400 capitalize">{{ status }}</span>
        }
      </div>
    </div>
  `,
  animations: [fadeIn, slideUp, slideInRight, popIn, staggerFade, buttonState],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressRingComponent {
  @Input() progress = 0;
  @Input() status = '';
  circumference = 2 * Math.PI * 40;
}
