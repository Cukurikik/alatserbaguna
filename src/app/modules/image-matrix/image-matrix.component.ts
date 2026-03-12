import { ChangeDetectionStrategy, Component } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ToolCardComponent, Tool } from '../../shared/components/tool-card/tool-card.component';
import { LucideAngularModule, Search, Filter } from 'lucide-angular';

export const IMAGE_TOOLS: Tool[] = [
  { id: 'crop',       label: 'Image Cropper',    icon: '✂️',  category: 'basic',    status: 'stable' },
  { id: 'resize',     label: 'Resizer',          icon: '📏',  category: 'basic',    status: 'stable' },
  { id: 'convert',    label: 'Format Converter', icon: '🔄',  category: 'basic',    status: 'stable' },
  { id: 'compress',   label: 'Compressor',       icon: '📦',  category: 'basic',    status: 'stable' },
  { id: 'filter',     label: 'Color Filters',    icon: '🎨',  category: 'advanced', status: 'stable' },
  { id: 'watermark',  label: 'Watermark',        icon: '©️',  category: 'advanced', status: 'stable' },
  { id: 'remove-bg',  label: 'BG Remover',       icon: '🪄',  category: 'ai',       status: 'beta' },
  { id: 'upscale',    label: 'AI Upscaler',      icon: '🚀',  category: 'ai',       status: 'experimental' },
];

@Component({
  selector: 'app-image-matrix',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToolCardComponent, LucideAngularModule],
  template: `
    <div class="flex flex-col gap-8 pb-12" @fadeSlideIn>
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-sans font-bold text-white tracking-tight mb-2">Image Matrix</h1>
          <p class="text-text-secondary">10+ tools for editing, converting, and enhancing images locally.</p>
        </div>
        
        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="relative flex-1 md:w-64">
            <lucide-icon [img]="SearchIcon" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"></lucide-icon>
            <input type="text" placeholder="Search tools..." 
                   class="w-full bg-bg-elevated border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent-pink/50 focus:ring-1 focus:ring-accent-pink/50 transition-all">
          </div>
          <button class="bg-bg-elevated border border-white/5 rounded-xl p-2 hover:bg-white/5 hover:border-accent-pink/30 transition-colors">
            <lucide-icon [img]="FilterIcon" class="w-5 h-5 text-text-secondary"></lucide-icon>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" @staggerCards>
        @for (tool of tools; track tool.id) {
          <app-tool-card [tool]="tool" />
        }
      </div>
    </div>
  `,
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('400ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'scale(0.92)' }),
          stagger(40, animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class ImageMatrixComponent {
  tools = IMAGE_TOOLS;
  
  SearchIcon = Search;
  FilterIcon = Filter;
}
