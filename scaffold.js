const fs = require('fs');
const path = require('path');

const features = [
  { dir: '01-trimmer', cmp: 'Trimmer' },
  { dir: '02-merger', cmp: 'Merger' },
  { dir: '03-converter', cmp: 'Converter' },
  { dir: '04-compressor', cmp: 'Compressor' },
  { dir: '05-stabilizer', cmp: 'Stabilizer' },
  { dir: '06-reverser', cmp: 'Reverser' },
  { dir: '07-speed-controller', cmp: 'SpeedController' },
  { dir: '08-looper', cmp: 'Looper' },
  { dir: '09-flip-rotate', cmp: 'FlipRotate' },
  { dir: '10-crop-resize', cmp: 'CropResize' },
  { dir: '11-color-grading', cmp: 'ColorGrading' },
  { dir: '12-subtitle-burner', cmp: 'SubtitleBurner' },
  { dir: '13-thumbnail-generator', cmp: 'ThumbnailGenerator' },
  { dir: '14-watermark', cmp: 'Watermark' },
  { dir: '15-audio-extractor', cmp: 'AudioExtractor' },
  { dir: '16-audio-replacer', cmp: 'AudioReplacer' },
  { dir: '17-denoiser', cmp: 'Denoiser' },
  { dir: '18-interpolator', cmp: 'Interpolator' },
  { dir: '19-metadata-editor', cmp: 'MetadataEditor' },
  { dir: '20-splitter', cmp: 'Splitter' },
  { dir: '21-screen-recorder', cmp: 'ScreenRecorder' },
  { dir: '22-video-to-gif', cmp: 'VideoToGif' },
  { dir: '23-pip', cmp: 'Pip' },
  { dir: '24-blur', cmp: 'Blur' },
  { dir: '25-transitions', cmp: 'Transitions' },
  { dir: '26-compare', cmp: 'Compare' },
  { dir: '27-slideshow', cmp: 'Slideshow' },
  { dir: '28-batch', cmp: 'Batch' },
  { dir: '29-analyser', cmp: 'Analyser' },
  { dir: '30-upscaler', cmp: 'Upscaler' }
];

const basePath = path.join('c:', 'Users', 'IKYY', 'Downloads', 'generated', 'src', 'app', 'modules', 'video');

features.forEach(f => {
  const dirPath = path.join(basePath, f.dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const baseName = f.dir.substring(3);

  const cmpFile = path.join(dirPath, baseName + '.component.ts');
  const codeCmp = [
    "import { Component, ChangeDetectionStrategy } from '@angular/core';",
    "",
    "@Component({",
    "  selector: 'app-" + baseName + "',",
    "  standalone: true,",
    "  imports: [],",
    "  template: `",
    "    <div class='p-6 text-white min-h-screen bg-gray-900 border border-gray-800 rounded-xl backdrop-blur-md bg-opacity-80'>",
    "      <h2 class='text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent'>" + f.cmp + " Tool</h2>",
    "    </div>",
    "  `,",
    "  changeDetection: ChangeDetectionStrategy.OnPush",
    "})",
    "export class " + f.cmp + "Component {",
    "}"
  ].join("\n");
  fs.writeFileSync(cmpFile, codeCmp);

  const srvFile = path.join(dirPath, baseName + '.service.ts');
  const codeSrv = [
    "import { Injectable } from '@angular/core';",
    "@Injectable({ providedIn: 'root' })",
    "export class " + f.cmp + "Service {",
    "}"
  ].join("\n");
  fs.writeFileSync(srvFile, codeSrv);

  const storeFile = path.join(dirPath, baseName + '.store.ts');
  const codeStore = [
    "export interface " + f.cmp + "State {",
    "  status: 'idle' | 'processing' | 'done' | 'error';",
    "}"
  ].join("\n");
  fs.writeFileSync(storeFile, codeStore);

  const workerFile = path.join(dirPath, baseName + '.worker.ts');
  const codeWorker = [
    "/// <reference lib='webworker' />",
    "addEventListener('message', ({ data }) => {",
    "  postMessage({ type: 'done', data });",
    "});"
  ].join("\n");
  fs.writeFileSync(workerFile, codeWorker);

  const indexFile = path.join(dirPath, 'index.ts');
  const codeIndex = [
    "export * from './" + baseName + ".component';",
    "export * from './" + baseName + ".service';",
    "export * from './" + baseName + ".store';"
  ].join("\n");
  fs.writeFileSync(indexFile, codeIndex);

  console.log('Scaffolded ' + f.dir);
});
