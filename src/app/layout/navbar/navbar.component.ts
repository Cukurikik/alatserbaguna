import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectSystem } from '../../store/app.selectors';
import { LucideAngularModule, Search, Bell, User } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, LucideAngularModule],
  template: `
    <header class="h-16 bg-bg-surface/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-50 transition-all duration-300"
            [@slideDown]>
      <div class="flex items-center flex-1">
        <div class="relative w-full max-w-md hidden md:block group">
          <lucide-icon [img]="SearchIcon" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-cyan transition-colors"></lucide-icon>
          <input type="text" placeholder="Search tools, files, or settings..." 
                 class="w-full bg-white/5 border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/30 focus:bg-white/10 focus:ring-1 focus:ring-accent-cyan/20 transition-all">
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Status Indicator -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
          <div class="relative flex items-center justify-center">
            <div class="w-2 h-2 rounded-full" 
                 [class.bg-status-success]="(system$ | async)?.networkStatus === 'online'" 
                 [class.bg-status-error]="(system$ | async)?.networkStatus === 'offline'"></div>
            @if ((system$ | async)?.networkStatus === 'online') {
              <div class="absolute inset-0 w-2 h-2 rounded-full bg-status-success animate-ping opacity-75"></div>
            }
          </div>
          <span class="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-widest">
            {{ (system$ | async)?.networkStatus }}
          </span>
        </div>

        <button class="relative w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-text-secondary hover:text-white transition-all hover:scale-105 active:scale-95 group">
          <lucide-icon [img]="BellIcon" class="w-5 h-5 group-hover:rotate-12 transition-transform"></lucide-icon>
          <span class="absolute top-2.5 right-2.5 w-2 h-2 bg-accent-pink rounded-full border-2 border-bg-surface shadow-[0_0_8px_rgba(255,51,102,0.5)]"></span>
        </button>

        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-purple to-accent-cyan p-[1px] hover:shadow-glow transition-shadow cursor-pointer">
          <div class="w-full h-full rounded-xl bg-bg-surface flex items-center justify-center overflow-hidden">
            <lucide-icon [img]="UserIcon" class="w-4 h-4 text-white"></lucide-icon>
          </div>
        </div>
      </div>
    </header>
  `,
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-100%)' }),
        animate('500ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class NavbarComponent {
  private store = inject(Store);

  system$ = this.store.select(selectSystem);
  
  SearchIcon = Search;
  BellIcon = Bell;
  UserIcon = User;
}
