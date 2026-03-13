import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet, ChildrenOutletContexts } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';
import { trigger, transition, style, query, animate } from '@angular/animations';

export const routeTransition = trigger('routeAnimations', [
  transition('* <=> *', [
    // Initial state of new route
    query(':enter', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        opacity: 0,
        transform: 'scale(0.98) translateY(20px)'
      })
    ], { optional: true }),
    
    // Leaving route fades out and scales down
    query(':leave', [
      animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({
        opacity: 0,
        transform: 'scale(0.95) translateY(-10px)'
      }))
    ], { optional: true }),
    
    // Entering route fades in and settles
    query(':enter', [
      animate('400ms 50ms cubic-bezier(0.16, 1, 0.3, 1)', style({
        opacity: 1,
        transform: 'scale(1) translateY(0)'
      }))
    ], { optional: true })
  ])
]);

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Navbar, Sidebar],
  animations: [routeTransition],
  template: `
    <div class="min-h-screen bg-zinc-950 text-zinc-50 flex overflow-hidden">
      <!-- Fixed Sidebar -->
      <app-sidebar class="shrink-0 transition-all duration-300 z-40 hidden md:block" />
      
      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <!-- Floating Navbar -->
        <app-navbar class="sticky top-0 z-30 flex-shrink-0" />
        
        <!-- Page View (Scrollable) -->
        <main class="flex-1 overflow-x-hidden overflow-y-auto w-full relative z-10 p-4 md:p-6 lg:p-8" [@routeAnimations]="getRouteAnimationData()">
          <router-outlet #outlet="outlet" />
        </main>
      </div>
    </div>
  `,
  styles: [`
    main {
       /* Ensure parent establishes positioning context for absolute entering element */
       position: relative;
    }
  `],
})
export class Shell {
  private contexts = inject(ChildrenOutletContexts);

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.url?.join('/') || 'dashboard';
  }
}
