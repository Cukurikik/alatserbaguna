import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideStore} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';

import {routes} from './app.routes';
import {appReducer} from './store/app.state';
import {AppEffects} from './store/app.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideStore({app: appReducer}),
    provideEffects([AppEffects])
  ],
};
