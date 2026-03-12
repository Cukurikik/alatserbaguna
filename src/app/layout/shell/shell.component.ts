import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { Store } from '@ngrx/store';
import { toggleSidebar } from '../../store/app.state';
import { selectSidebarCollapsed } from '../../store/app.selectors';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, AsyncPipe],
  template: `
    <div class="shell-layout h-screen w-screen flex overflow-hidden bg-bg text-text-primary" [class.sidebar-collapsed]="(sidebarCollapsed$ | async)">
      <app-sidebar (toggleCollapse)="toggleSidebar()" />
      <main class="content-area flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <app-navbar />
        <div class="page-content flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    .shell-layout {
      transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1);
    }
  `]
})
export class ShellComponent {
  private store = inject(Store);

  sidebarCollapsed$ = this.store.select(selectSidebarCollapsed);

  toggleSidebar() {
    this.store.dispatch(toggleSidebar());
  }
}
