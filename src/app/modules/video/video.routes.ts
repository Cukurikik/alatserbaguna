import { Routes } from '@angular/router';

export const VIDEO_ROUTES: Routes = [
  {
    path: 'trimmer',
    loadComponent: () => import('./01-trimmer/trimmer.component').then(m => m.TrimmerComponent),
    title: 'Video Trimmer — Omni-Tool'
  },
  {
    path: 'merger',
    loadComponent: () => import('./02-merger/merger.component').then(m => m.MergerComponent),
    title: 'Video Merger — Omni-Tool'
  },
  {
    path: 'converter',
    loadComponent: () => import('./03-converter/converter.component').then(m => m.ConverterComponent),
    title: 'Format Converter — Omni-Tool'
  },
  {
    path: 'compressor',
    loadComponent: () => import('./04-compressor/compressor.component').then(m => m.CompressorComponent),
    title: 'Video Compressor — Omni-Tool'
  },
  {
    path: 'stabilizer',
    loadComponent: () => import('./05-stabilizer/stabilizer.component').then(m => m.StabilizerComponent),
    title: 'Video Stabilizer — Omni-Tool'
  },
  {
    path: 'reverser',
    loadComponent: () => import('./06-reverser/reverser.component').then(m => m.ReverserComponent),
    title: 'Video Reverser — Omni-Tool'
  },
  {
    path: 'speed',
    loadComponent: () => import('./07-speed-controller/speed-controller.component').then(m => m.SpeedControllerComponent),
    title: 'Speed Controller — Omni-Tool'
  },
  {
    path: 'looper',
    loadComponent: () => import('./08-looper/looper.component').then(m => m.LooperComponent),
    title: 'Video Looper — Omni-Tool'
  },
  {
    path: 'flip-rotate',
    loadComponent: () => import('./09-flip-rotate/flip-rotate.component').then(m => m.FlipRotateComponent),
    title: 'Flip & Rotate — Omni-Tool'
  },
  {
    path: 'crop-resize',
    loadComponent: () => import('./10-crop-resize/crop-resize.component').then(m => m.CropResizeComponent),
    title: 'Crop & Resize — Omni-Tool'
  },
  {
    path: 'color-grading',
    loadComponent: () => import('./11-color-grading/color-grading.component').then(m => m.ColorGradingComponent),
    title: 'Color Grading — Omni-Tool'
  },
  {
    path: 'subtitles',
    loadComponent: () => import('./12-subtitle-burner/subtitle-burner.component').then(m => m.SubtitleBurnerComponent),
    title: 'Subtitle Burner — Omni-Tool'
  },
  {
    path: 'thumbnail',
    loadComponent: () => import('./13-thumbnail-generator/thumbnail-generator.component').then(m => m.ThumbnailGeneratorComponent),
    title: 'Thumbnail Generator — Omni-Tool'
  },
  {
    path: 'watermark',
    loadComponent: () => import('./14-watermark/watermark.component').then(m => m.WatermarkComponent),
    title: 'Add Watermark — Omni-Tool'
  },
  {
    path: 'extract-audio',
    loadComponent: () => import('./15-audio-extractor/audio-extractor.component').then(m => m.AudioExtractorComponent),
    title: 'Extract Audio — Omni-Tool'
  },
  {
    path: 'replace-audio',
    loadComponent: () => import('./16-audio-replacer/audio-replacer.component').then(m => m.AudioReplacerComponent),
    title: 'Replace Audio — Omni-Tool'
  },
  {
    path: 'denoiser',
    loadComponent: () => import('./17-denoiser/denoiser.component').then(m => m.DenoiserComponent),
    title: 'Video Denoiser — Omni-Tool'
  },
  {
    path: 'interpolate',
    loadComponent: () => import('./18-interpolator/interpolator.component').then(m => m.InterpolatorComponent),
    title: 'Video Interpolator — Omni-Tool'
  },
  {
    path: 'metadata',
    loadComponent: () => import('./19-metadata-editor/metadata-editor.component').then(m => m.MetadataEditorComponent),
    title: 'Metadata Editor — Omni-Tool'
  },
  {
    path: 'splitter',
    loadComponent: () => import('./20-splitter/splitter.component').then(m => m.SplitterComponent),
    title: 'Video Splitter — Omni-Tool'
  },
  {
    path: 'screen-recorder',
    loadComponent: () => import('./21-screen-recorder/screen-recorder.component').then(m => m.ScreenRecorderComponent),
    title: 'Screen Recorder — Omni-Tool'
  },
  {
    path: 'to-gif',
    loadComponent: () => import('./22-video-to-gif/video-to-gif.component').then(m => m.VideoToGifComponent),
    title: 'Video to GIF — Omni-Tool'
  },
  {
    path: 'pip',
    loadComponent: () => import('./23-pip/pip.component').then(m => m.PipComponent),
    title: 'Picture-in-Picture — Omni-Tool'
  },
  {
    path: 'blur',
    loadComponent: () => import('./24-blur/blur.component').then(m => m.BlurComponent),
    title: 'Video Blur — Omni-Tool'
  },
  {
    path: 'transitions',
    loadComponent: () => import('./25-transitions/transitions.component').then(m => m.TransitionsComponent),
    title: 'Video Transitions — Omni-Tool'
  },
  {
    path: 'compare',
    loadComponent: () => import('./26-compare/compare.component').then(m => m.CompareComponent),
    title: 'Snapshot Compare — Omni-Tool'
  },
  {
    path: 'slideshow',
    loadComponent: () => import('./27-slideshow/slideshow.component').then(m => m.SlideshowComponent),
    title: 'Slideshow Maker — Omni-Tool'
  },
  {
    path: 'batch',
    loadComponent: () => import('./28-batch/batch.component').then(m => m.BatchComponent),
    title: 'Batch Processor — Omni-Tool'
  },
  {
    path: 'analyser',
    loadComponent: () => import('./29-analyser/analyser.component').then(m => m.AnalyserComponent),
    title: 'Video Analyser — Omni-Tool'
  },
  {
    path: 'upscaler',
    loadComponent: () => import('./30-upscaler/upscaler.component').then(m => m.UpscalerComponent),
    title: 'AI Video Upscaler — Omni-Tool'
  },
  {
    path: '',
    redirectTo: 'trimmer',
    pathMatch: 'full'
  }
];
