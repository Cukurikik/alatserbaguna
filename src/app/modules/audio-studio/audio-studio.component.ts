import { ChangeDetectionStrategy, Component } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ToolCardComponent, Tool } from '../../shared/components/tool-card/tool-card.component';
import { LucideAngularModule, Search, Filter } from 'lucide-angular';

export const AUDIO_TOOLS: Tool[] = [
  { id: 'trim',       label: 'Audio Trimmer',    icon: '✂️',  category: 'basic',    status: 'stable' },
  { id: 'merge',      label: 'Audio Merger',     icon: '🔗',  category: 'basic',    status: 'stable' },
  { id: 'convert',    label: 'Format Converter', icon: '🔄',  category: 'basic',    status: 'stable' },
  { id: 'compress',   label: 'Compressor',       icon: '📦',  category: 'basic',    status: 'stable' },
  { id: 'eq',         label: 'Parametric EQ',    icon: '🎛️',  category: 'pro',      status: 'stable' },
  { id: 'normalize',  label: 'Normalizer',       icon: '🔊',  category: 'advanced', status: 'stable' },
  { id: 'pitch',      label: 'Pitch Shifter',    icon: '🎵',  category: 'advanced', status: 'stable' },
  { id: 'speed',      label: 'Time Stretch',     icon: '⏱️',  category: 'advanced', status: 'stable' },
  { id: 'noise',      label: 'Noise Reduction',  icon: '🔇',  category: 'ai',       status: 'beta' },
  { id: 'stem',       label: 'Stem Splitter',    icon: '🎼',  category: 'ai',       status: 'experimental' },
];

@Component({
  selector: 'app-audio-studio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToolCardComponent, LucideAngularModule],
  template: `
    <div class="flex flex-col gap-8 pb-12" @fadeSlideIn>
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 class="text-3xl md:text-4xl font-sans font-bold text-white tracking-tight mb-2">Audio Studio</h1>
          <p class="text-text-secondary text-lg">20+ tools for mastering, editing, and enhancing audio files locally.</p>
        </div>
        
        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="relative flex-1 md:w-72 group">
            <lucide-icon [img]="SearchIcon" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-purple transition-colors"></lucide-icon>
            <input type="text" placeholder="Search tools..." 
                   class="w-full bg-white/5 border border-white/5 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple/30 focus:ring-1 focus:ring-accent-purple/20 transition-all">
          </div>
          <button class="bg-white/5 border border-white/5 rounded-2xl p-2.5 hover:bg-white/10 hover:border-accent-purple/30 transition-all hover:scale-105 active:scale-95">
            <lucide-icon [img]="FilterIcon" class="w-5 h-5 text-text-secondary"></lucide-icon>
          </button>
        </div>
      </div>

      <div class="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        <button class="px-5 py-2 rounded-xl bg-accent-purple/10 text-accent-purple border border-accent-purple/20 text-sm font-bold whitespace-nowrap hover:bg-accent-purple/20 transition-all">All Tools</button>
        <button class="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white hover:bg-white/10 text-sm font-medium whitespace-nowrap transition-all">Basic</button>
        <button class="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white hover:bg-white/10 text-sm font-medium whitespace-nowrap transition-all">Pro Mastering</button>
        <button class="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white hover:bg-white/10 text-sm font-medium whitespace-nowrap transition-all">Advanced</button>
        <button class="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white hover:bg-white/10 text-sm font-medium whitespace-nowrap transition-all">AI Splitter</button>
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
export class AudioStudioComponent {
  tools = AUDIO_TOOLS;
  
  SearchIcon = Search;
  FilterIcon = Filter;
}
