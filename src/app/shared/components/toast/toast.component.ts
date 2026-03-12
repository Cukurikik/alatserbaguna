import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { LucideAngularModule, CheckCircle, AlertCircle, Info } from 'lucide-angular';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-card backdrop-blur-md"
         [class.bg-status-success/10]="type === 'success'"
         [class.border-status-success/30]="type === 'success'"
         [class.bg-status-error/10]="type === 'error'"
         [class.border-status-error/30]="type === 'error'"
         [class.bg-status-info/10]="type === 'info'"
         [class.border-status-info/30]="type === 'info'"
         @slideIn>
      
      @if (type === 'success') {
        <lucide-icon [img]="CheckCircleIcon" class="w-5 h-5 text-status-success"></lucide-icon>
      } @else if (type === 'error') {
        <lucide-icon [img]="AlertCircleIcon" class="w-5 h-5 text-status-error"></lucide-icon>
      } @else {
        <lucide-icon [img]="InfoIcon" class="w-5 h-5 text-status-info"></lucide-icon>
      }
      
      <span class="text-sm font-medium text-white">{{ message }}</span>
    </div>
  `,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(100%)' }),
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(100%)' }))
      ])
    ])
  ]
})
export class ToastComponent {
  @Input({ required: true }) message!: string;
  @Input() type: 'success' | 'error' | 'info' = 'info';

  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  InfoIcon = Info;
}
