import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  isDevMode
} from '@angular/core';
import {provideRouter, withPreloading, PreloadAllModules} from '@angular/router';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideStore} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {provideStoreDevtools} from '@ngrx/store-devtools';
import {provideHttpClient} from '@angular/common/http';

import {routes} from './app.routes';
import {trimmerFeature} from './modules/video/01-trimmer/trimmer.store';
import {TrimmerEffects} from './modules/video/01-trimmer/trimmer.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideStore({
      [trimmerFeature.name]: trimmerFeature.reducer
    }),
    provideEffects([TrimmerEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode()
    }),
    provideHttpClient()
  ],
};
