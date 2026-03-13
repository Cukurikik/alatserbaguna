import { Routes } from '@angular/router';

export const VIDEO_ROUTES: Routes = [
  {
    path: 'trimmer',
    loadComponent: () =>
      import('./01-trimmer/trimmer.component').then(m => m.TrimmerComponent),
    title: 'Video Trimmer — Omni-Tool'
  },
  {
    path: 'splitter',
    loadComponent: () =>
      import('./02-splitter/splitter.component').then(m => m.SplitterComponent),
    title: 'Video Splitter — Omni-Tool'
  },
  {
    path: 'format-converter',
    loadComponent: () =>
      import('./03-format-converter/format-converter.component').then(m => m.FormatConverterComponent),
    title: 'Format Converter — Omni-Tool'
  },
  {
    path: 'volume-booster',
    loadComponent: () =>
      import('./04-volume-booster/volume-booster.component').then(m => m.VolumeBoosterComponent),
    title: 'Volume Booster — Omni-Tool'
  },
  {
    path: 'thumbnail',
    loadComponent: () =>
      import('./05-video-thumbnail/video-thumbnail.component').then(m => m.VideoThumbnailComponent),
    title: 'Video Thumbnail — Omni-Tool'
  },
  {
    path: 'reverser',
    loadComponent: () =>
      import('./06-reverser/reverser.component').then(m => m.ReverserComponent),
    title: 'Video Reverser — Omni-Tool'
  },
  {
    path: 'speed',
    loadComponent: () =>
      import('./07-speed-controller/speed-controller.component').then(m => m.SpeedControllerComponent),
    title: 'Speed Controller — Omni-Tool'
  },
  {
    path: 'looper',
    loadComponent: () =>
      import('./08-looper/looper.component').then(m => m.LooperComponent),
    title: 'Video Looper — Omni-Tool'
  },
  {
    path: 'flip-rotate',
    loadComponent: () =>
      import('./09-flip-rotate/flip-rotate.component').then(m => m.FlipRotateComponent),
    title: 'Flip & Rotate — Omni-Tool'
  },
  {
    path: 'crop-resize',
    loadComponent: () =>
      import('./10-crop-resize/crop-resize.component').then(m => m.CropResizeComponent),
    title: 'Crop & Resize — Omni-Tool'
  },
  {
    path: 'to-gif',
    loadComponent: () =>
      import('./11-to-gif/to-gif.component').then(m => m.ToGifComponent),
    title: 'Video to GIF — Omni-Tool'
  },
  {
    path: 'extract-audio',
    loadComponent: () =>
      import('./12-extract-audio/extract-audio.component').then(m => m.ExtractAudioComponent),
    title: 'Extract Audio — Omni-Tool'
  },
  {
    path: 'remove-audio',
    loadComponent: () =>
      import('./13-remove-audio/remove-audio.component').then(m => m.RemoveAudioComponent),
    title: 'Remove Audio — Omni-Tool'
  },
  {
    path: 'add-audio',
    loadComponent: () =>
      import('./14-add-audio/add-audio.component').then(m => m.AddAudioComponent),
    title: 'Add Audio — Omni-Tool'
  },
  {
    path: 'add-subtitles',
    loadComponent: () =>
      import('./15-add-subtitles/add-subtitles.component').then(m => m.AddSubtitlesComponent),
    title: 'Add Subtitles — Omni-Tool'
  },
  {
    path: 'remove-subtitles',
    loadComponent: () =>
      import('./16-remove-subtitles/remove-subtitles.component').then(m => m.RemoveSubtitlesComponent),
    title: 'Remove Subtitles — Omni-Tool'
  },
  {
    path: 'add-watermark',
    loadComponent: () =>
      import('./17-add-watermark/add-watermark.component').then(m => m.AddWatermarkComponent),
    title: 'Add Watermark — Omni-Tool'
  },
  {
    path: 'remove-watermark',
    loadComponent: () =>
      import('./18-remove-watermark/remove-watermark.component').then(m => m.RemoveWatermarkComponent),
    title: 'Remove Watermark — Omni-Tool'
  },
  {
    path: 'to-audio',
    loadComponent: () =>
      import('./19-to-audio/to-audio.component').then(m => m.ToAudioComponent),
    title: 'Video to Audio — Omni-Tool'
  },
  {
    path: 'to-images',
    loadComponent: () =>
      import('./20-to-images/to-images.component').then(m => m.ToImagesComponent),
    title: 'Video to Images — Omni-Tool'
  },
  {
    path: 'change-resolution',
    loadComponent: () =>
      import('./21-change-resolution/change-resolution.component').then(m => m.ChangeResolutionComponent),
    title: 'Change Resolution — Omni-Tool'
  },
  {
    path: 'compressor',
    loadComponent: () =>
      import('./22-compressor/compressor.component').then(m => m.CompressorComponent),
    title: 'Video Compressor — Omni-Tool'
  },
  {
    path: 'merger',
    loadComponent: () =>
      import('./23-merger/merger.component').then(m => m.MergerComponent),
    title: 'Video Merger — Omni-Tool'
  },
  {
    path: 'stabilizer',
    loadComponent: () =>
      import('./24-stabilizer/stabilizer.component').then(m => m.StabilizerComponent),
    title: 'Video Stabilizer — Omni-Tool'
  },
  {
    path: 'color-correction',
    loadComponent: () =>
      import('./25-color-correction/color-correction.component').then(m => m.ColorCorrectionComponent),
    title: 'Color Correction — Omni-Tool'
  },
  {
    path: 'to-hls',
    loadComponent: () =>
      import('./26-video-to-hls/video-to-hls.component').then(m => m.VideoToHlsComponent),
    title: 'Video to HLS — Omni-Tool'
  },
  {
    path: 'to-dash',
    loadComponent: () =>
      import('./27-video-to-dash/video-to-dash.component').then(m => m.VideoToDashComponent),
    title: 'Video to DASH — Omni-Tool'
  },
  {
    path: '',
    redirectTo: 'trimmer',
    pathMatch: 'full'
  }
];
