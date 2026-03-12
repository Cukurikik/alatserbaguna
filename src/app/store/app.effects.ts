import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import { toggleSidebar } from './app.state';

@Injectable()
export class AppEffects {
  private actions$ = inject(Actions);

  logSidebarToggle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(toggleSidebar),
      tap(() => console.log('Sidebar toggled'))
    ),
    { dispatch: false }
  );
}
