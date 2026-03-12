import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectSidebarCollapsed } from '../../store/app.selectors';
import { LucideAngularModule, LucideIconData, Grid, Film, Music, Image, RefreshCw, Settings, ChevronLeft, ChevronRight } from 'lucide-angular';

export interface NavItem {
  label: string;
  icon: LucideIconData;
  route: string;
  badge: string | null;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    icon: Grid,        route: '/',          badge: null },
  { label: 'Video Engine', icon: Film,         route: '/video',     badge: '30+' },
  { label: 'Audio Studio', icon: Music,        route: '/audio',     badge: '20+' },
  { label: 'Image Matrix', icon: Image,        route: '/image',     badge: '10+' },
  { label: 'Converter',    icon: RefreshCw,   route: '/converter', badge: 'NEW' },
  { label: 'Settings',     icon: Settings,     route: '/settings',  badge: null },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, LucideAngularModule],
  template: `
    <aside 
      class="sidebar h-full bg-bg-surface/40 backdrop-blur-3xl border-r border-white/5 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative z-50"
      [class.w-[280px]]="(collapsed$ | async) === false"
      [class.w-[80px]]="(collapsed$ | async)">
      
      <div class="h-20 flex items-center justify-between px-6 border-b border-white/5">
        @if ((collapsed$ | async) === false) {
          <div class="flex items-center gap-4 group cursor-pointer">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center shadow-lg shadow-accent-cyan/20 group-hover:scale-110 transition-transform duration-500">
              <span class="font-black text-white text-xl tracking-tighter">O</span>
            </div>
            <div class="flex flex-col">
              <span class="font-sans font-black text-lg tracking-tighter text-white leading-none">OMNI-TOOL</span>
              <span class="text-[9px] text-accent-cyan font-mono font-bold uppercase tracking-[0.2em] mt-1">Enterprise Suite</span>
            </div>
          </div>
        } @else {
          <div class="w-10 h-10 mx-auto rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center shadow-lg shadow-accent-cyan/20 hover:scale-110 transition-transform duration-500 cursor-pointer">
            <span class="font-black text-white text-xl tracking-tighter">O</span>
          </div>
        }
      </div>

      <nav class="flex-1 py-8 px-4 flex flex-col gap-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        @for (item of navItems; track item.route) {
          <a [routerLink]="item.route" 
             routerLinkActive="active" 
             [routerLinkActiveOptions]="{exact: item.route === '/'}"
             class="nav-item group flex items-center gap-4 px-4 py-3.5 rounded-2xl text-text-secondary hover:text-white hover:bg-white/5 transition-all duration-300 relative overflow-hidden">
            
            <!-- Active Indicator -->
            <div class="active-indicator absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-0 bg-accent-cyan rounded-r-full transition-all duration-500 group-[.active]:h-8 group-[.active]:shadow-glow"></div>
            
            <lucide-icon [img]="item.icon" class="w-6 h-6 flex-shrink-0 group-[.active]:text-accent-cyan group-[.active]:scale-110 transition-all duration-500"></lucide-icon>
            
            @if ((collapsed$ | async) === false) {
              <span class="font-bold text-sm whitespace-nowrap flex-1 tracking-wide transition-all duration-500">{{ item.label }}</span>
              @if (item.badge) {
                <span class="text-[9px] font-mono font-black px-2 py-0.5 rounded-lg bg-white/5 text-accent-cyan border border-accent-cyan/20 group-[.active]:border-accent-cyan/40">
                  {{ item.badge }}
                </span>
              }
            } @else {
              <!-- Tooltip -->
              <div class="absolute left-full ml-4 px-3 py-1.5 bg-bg-elevated border border-white/10 rounded-lg text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl">
                {{ item.label }}
              </div>
            }
          </a>
        }
      </nav>

      <div class="p-6 border-t border-white/5 flex items-center justify-center">
        <button (click)="toggleCollapse.emit()" class="w-full h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-accent-cyan/30 flex items-center justify-center text-text-secondary hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 group">
          @if ((collapsed$ | async) === false) {
            <div class="flex items-center gap-3">
              <lucide-icon [img]="ChevronLeftIcon" class="w-5 h-5 group-hover:-translate-x-1 transition-transform"></lucide-icon>
              <span class="text-sm font-bold tracking-wide">Collapse</span>
            </div>
          } @else {
            <lucide-icon [img]="ChevronRightIcon" class="w-5 h-5 group-hover:translate-x-1 transition-transform"></lucide-icon>
          }
        </button>
      </div>
    </aside>
  `,
  styles: [`
    :host { display: block; }
    .active {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }
  `]
})
export class SidebarComponent {
  @Output() toggleCollapse = new EventEmitter<void>();
  
  private store = inject(Store);

  collapsed$ = this.store.select(selectSidebarCollapsed);
  navItems = NAV_ITEMS;
  
  ChevronLeftIcon = ChevronLeft;
  ChevronRightIcon = ChevronRight;
}
