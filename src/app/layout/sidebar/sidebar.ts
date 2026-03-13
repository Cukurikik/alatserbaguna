import { ChangeDetectionStrategy, Component, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, NgClass],
  template: `
    <aside 
      class="h-full bg-zinc-950/40 backdrop-blur-2xl border-r border-white/5 flex flex-col transition-all duration-500 relative z-40 overflow-hidden"
      [ngClass]="expanded() ? 'w-72' : 'w-24'"
      (mouseenter)="expanded.set(true)"
      (mouseleave)="expanded.set(false)"
    >
      <!-- Background Glow -->
      <div class="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent"></div>

      <!-- Top Spacer -->
      <div class="h-24 shrink-0 px-8 flex items-center">
         <div class="w-8 h-px bg-white/10" [ngClass]="{'w-full': expanded()}"></div>
      </div>

      <!-- Nav Section -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-5 py-4 space-y-8 min-h-0">
        
        <!-- Section: Infrastructure -->
        <div class="space-y-3">
           <div class="px-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] font-mono flex items-center gap-3" [ngClass]="{'opacity-0': !expanded()}">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500/40 shrink-0"></span>
              CORE_MODULES
           </div>
           
           <div class="space-y-1">
             <a routerLink="/dashboard" routerLinkActive="active-node" [routerLinkActiveOptions]="{exact: true}"
                class="node-link group">
                <div class="node-icon">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                </div>
                <span class="node-label" [ngClass]="{'opacity-100 translate-x-0': expanded(), 'opacity-0 -translate-x-4': !expanded()}">Dashboard</span>
             </a>

             <a routerLink="/video" routerLinkActive="active-node"
                class="node-link group">
                <div class="node-icon text-emerald-400">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                </div>
                <span class="node-label" [ngClass]="{'opacity-100 translate-x-0': expanded(), 'opacity-0 -translate-x-4': !expanded()}">Video_Engine</span>
             </a>
           </div>
        </div>

        <!-- Section: AI Intelligence -->
        <div class="space-y-3">
           <div class="px-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] font-mono flex items-center gap-3" [ngClass]="{'opacity-0': !expanded()}">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-500/40 shrink-0"></span>
              NEURAL_NET
           </div>
           
           <div class="space-y-1">
             <a routerLink="/ai-assistant" routerLinkActive="active-node-ai"
                class="node-link-ai group">
                <div class="node-icon text-indigo-400 group-hover:text-indigo-300">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                </div>
                <span class="node-label" [ngClass]="{'opacity-100 translate-x-0': expanded(), 'opacity-0 -translate-x-4': !expanded()}">AI_Assistant</span>
             </a>
           </div>
        </div>
      </nav>

      <!-- Bottom System Status -->
      <div class="shrink-0 p-6 border-t border-white/5 bg-black/20 backdrop-blur-3xl">
         <div class="flex items-center gap-4 group cursor-help overflow-hidden">
            <div class="w-10 h-10 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:border-emerald-500/40 transition-all">
               <span class="text-[10px] font-black text-emerald-500 font-mono">19</span>
            </div>
            <div class="flex flex-col min-w-0 transition-opacity duration-500" [ngClass]="{'opacity-100': expanded(), 'opacity-0': !expanded()}">
               <span class="text-[9px] font-black text-white uppercase tracking-tighter truncate">Omni_Node_Host</span>
               <span class="text-[8px] font-mono text-gray-600 uppercase tracking-widest leading-none mt-1">v19.0.0_STABLE</span>
            </div>
         </div>
      </div>
    </aside>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
    
    .node-link { @apply flex items-center gap-5 px-4 py-3.5 rounded-2xl text-gray-500 hover:bg-white/[0.03] hover:text-white transition-all active:scale-95 relative; }
    .node-link-ai { @apply flex items-center gap-5 px-4 py-3.5 rounded-2xl text-gray-500 hover:bg-indigo-500/[0.05] hover:text-indigo-400 transition-all active:scale-95 relative; }
    
    .node-icon { @apply w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0 transition-all group-hover:border-current group-hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]; }
    .node-label { @apply text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-500 whitespace-nowrap; }
    
    .active-node { @apply bg-emerald-500/10 text-emerald-400; }
    .active-node .node-icon { @apply border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]; }
    
    .active-node-ai { @apply bg-indigo-500/10 text-indigo-400; }
    .active-node-ai .node-icon { @apply border-indigo-500/40 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]; }
  `],
})
export class Sidebar {
  expanded = signal(false);
}
