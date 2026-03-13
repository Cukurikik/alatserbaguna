import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: 'video',
    loadChildren: () => import('./modules/video/video.routes').then(m => m.VIDEO_ROUTES)
  },
  {
    path: '',
    redirectTo: 'video',
    pathMatch: 'full'
  }
];
