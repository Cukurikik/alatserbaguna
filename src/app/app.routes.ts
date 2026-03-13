import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then(m => m.Shell),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./modules/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'video',
        loadChildren: () => import('./modules/video/video.routes').then(m => m.VIDEO_ROUTES)
      },
      {
        path: 'audio',
        loadChildren: () => import('./modules/audio/audio.routes').then(m => m.AUDIO_ROUTES)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
