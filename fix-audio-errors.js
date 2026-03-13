/**
 * fix-audio-errors.js
 * Batch-fixes IDE errors across all audio components.
 * Run: node fix-audio-errors.js
 */
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, 'src/app/modules/audio');

// === PATTERN 1: Replace TypeScript casts in Angular templates ===
// Angular templates don't support `as HTMLInputElement` / `as HTMLSelectElement` / `as any`
// Replace with $any() or remove cast
function fixTemplateCasts(content) {
  // +($event.target as HTMLInputElement).value  →  +$any($event.target).value
  content = content.replace(/\+\(\$event\.target as HTMLInputElement\)\.value/g, '+$any($event.target).value');
  // ($event.target as HTMLSelectElement).value as any  →  $any($event.target).value
  content = content.replace(/\(\$event\.target as HTMLSelectElement\)\.value as any/g, '$any($event.target).value');
  // .set(r as any)  →  .set(r)  (used in button click handlers)
  content = content.replace(/\.set\(r as any\)/g, '.set($any(r))');
  // .set(f as any)  →  .set(f)
  content = content.replace(/\.set\(f as any\)/g, '.set($any(f))');
  // (m[0] as any)  →  $any(m[0])
  content = content.replace(/\(m\[0\] as any\)/g, '$any(m[0])');
  // .set(m[0] as any)  →  .set($any(m[0]))
  content = content.replace(/\.set\(m\[0\] as any\)/g, '.set($any(m[0]))');
  return content;
}

// === PATTERN 2: Fix Math.max/Math.min in templates ===
// Templates can't access Math directly - these need to be accessed via $any(Math) or refactored
// The simplest fix: replace in-template usage with pre-bound version
// e.g. equalParts.update(v => Math.max(2, v - 1)) → just call a method
// We handle this per-file below

// === PATTERN 3: Fix FileData cast in workers ===
// new Blob([data], ...) where data is FileData (Uint8Array<ArrayBufferLike>)
// Fix: new Blob([data as unknown as Uint8Array], ...)  OR  new Blob([new Uint8Array(data as ArrayBuffer)])
function fixFileDataBlob(content) {
  // Pattern: new Blob([data], { type: ...
  content = content.replace(/new Blob\(\[data\], \{/g, 'new Blob([data as unknown as Uint8Array], {');
  // Pattern: new Blob([mp4], { type:
  content = content.replace(/new Blob\(\[mp4\], \{/g, 'new Blob([mp4 as unknown as Uint8Array], {');
  return content;
}

// === PATTERN 4: Fix onFileSelected event type ===
// (fileSelected)="onFileSelected($event)" where $event is File[]
// This is correct - the issue is some OLD components had wrong signatures
// Pattern: (change)="..." passing Event instead of File[]
// These are fixed per-component below

let fixedFiles = [];

function fixFile(filePath, fixFn) {
  if (!fs.existsSync(filePath)) { console.log(`  SKIP (not found): ${filePath}`); return; }
  const original = fs.readFileSync(filePath, 'utf8');
  const fixed = fixFn(original);
  if (fixed !== original) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    fixedFiles.push(path.relative(__dirname, filePath));
    console.log(`  ✓ Fixed: ${path.basename(filePath)}`);
  } else {
    console.log(`  ~ No change: ${path.basename(filePath)}`);
  }
}

// ─── Fix all component files: template casts ────────────────────────────────
const componentDirs = fs.readdirSync(AUDIO_DIR).filter(d => fs.statSync(path.join(AUDIO_DIR, d)).isDirectory());

console.log('\n=== Fixing template AS casts in all components ===');
for (const dir of componentDirs) {
  const dirPath = path.join(AUDIO_DIR, dir);
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (file.endsWith('.component.ts')) {
      fixFile(path.join(dirPath, file), (c) => fixTemplateCasts(c));
    }
    if (file.endsWith('.worker.ts')) {
      fixFile(path.join(dirPath, file), (c) => fixFileDataBlob(c));
    }
  }
}

// ─── Fix visualizer.component.ts: *ngFor → @for, remove NgForOf ─────────────
console.log('\n=== Fix visualizer *ngFor → fix NgFor missing import ===');
const vizPath = path.join(AUDIO_DIR, '28-visualizer/visualizer.component.ts');
fixFile(vizPath, (c) => {
  // Add NgFor to imports array
  c = c.replace(/imports: \[AsyncPipe, DecimalPipe, AudioDropZoneComponent\]/, 
    'imports: [AsyncPipe, DecimalPipe, AudioDropZoneComponent, NgFor]');
  // Add NgFor import to top
  if (!c.includes('NgFor')) {
    c = c.replace("import { AsyncPipe, DecimalPipe } from '@angular/common';", 
      "import { AsyncPipe, DecimalPipe, NgFor } from '@angular/common';");
  }
  return c;
});

// ─── Fix 14-splitter: Math.max in template ─────────────────────────────────
console.log('\n=== Fix splitter Math.max in template ===');
const splitterCompPath = path.join(AUDIO_DIR, '14-splitter/splitter.component.ts');
fixFile(splitterCompPath, (c) => {
  // Replace Math.max/Math.min calls in template with pre-defined methods or clamp()
  c = c.replace(/equalParts\.update\(v => Math\.max\(2, v - 1\)\)/g, 'decEqualParts()');
  c = c.replace(/equalParts\.update\(v => Math\.min\(20, v \+ 1\)\)/g, 'incEqualParts()');
  // Add methods to class if not already there
  if (!c.includes('decEqualParts()')) {
    c = c.replace(/ngOnDestroy\(\)/, `decEqualParts() { this.equalParts.update(v => Math.max(2, v - 1)); }
  incEqualParts() { this.equalParts.update(v => Math.min(20, v + 1)); }
  ngOnDestroy()`);
  }
  return c;
});

// ─── Fix 18-looper: Math.max/min in template ───────────────────────────────
console.log('\n=== Fix looper Math.max/min in template ===');
const looperCompPath = path.join(AUDIO_DIR, '18-looper/looper.component.ts');
fixFile(looperCompPath, (c) => {
  c = c.replace(/loops\.update\(v => Math\.max\(1, v - 1\)\)/g, 'decLoops()');
  c = c.replace(/loops\.update\(v => Math\.min\(20, v \+ 1\)\)/g, 'incLoops()');
  if (!c.includes('decLoops()')) {
    c = c.replace(/ngOnDestroy\(\)/, `decLoops() { this.loops.update(v => Math.max(1, v - 1)); }
  incLoops() { this.loops.update(v => Math.min(20, v + 1)); }
  ngOnDestroy()`);
  }
  return c;
});

// ─── Fix batch.component.ts: arrow function in template ────────────────────
console.log('\n=== Fix batch.component.ts: arrow fn in template ===');
const batchCompPath = path.join(AUDIO_DIR, '20-batch/batch.component.ts');
fixFile(batchCompPath, (c) => {
  // Replace inline arrow fn with method call
  c = c.replace(/state\.files\.every\(f => f\.status !== 'queued'\)/g, "allFilesProcessed(state.files)");
  if (!c.includes('allFilesProcessed(')) {
    c = c.replace(/ngOnDestroy\(\)/, `allFilesProcessed(files: any[]): boolean { return files.every(f => f.status !== 'queued'); }
  ngOnDestroy()`);
  }
  return c;
});

// ─── Fix audio.routes.ts: exported member names ─────────────────────────────
console.log('\n=== Fix audio.routes.ts: exported effect names ===');
const routesPath = path.join(AUDIO_DIR, 'audio.routes.ts');
fixFile(routesPath, (c) => {
  const replacements = [
    ['recorderProcessingEffect', 'processRecorderEffect'],
    ['trimmerProcessingEffect', 'processTrimmerEffect'],
    ['mergerProcessingEffect', 'processMergerEffect'],
    ['converterProcessingEffect', 'processConverterEffect'],
    ['compressorProcessingEffect', 'processCompressorEffect'],
    ['equalizerProcessingEffect', 'processEqualizerEffect'],
    ['analyserProcessingEffect', 'processAnalyserEffect'],
  ];
  for (const [old, neo] of replacements) {
    c = c.replace(new RegExp(old, 'g'), neo);
  }
  return c;
});

// ─── Fix 21-channel-mixer: monoMode type issue ─────────────────────────────
console.log('\n=== Fix channel-mixer monoMode type ===');
const chanMixPath = path.join(AUDIO_DIR, '21-channel-mixer/channel-mixer.component.ts');
fixFile(chanMixPath, (c) => {
  // Replace monoMode.set(m[0] as any) → monoMode.set($any(m[0]))  (already done by template cast fix above)
  // But also fix the TypeScript type: 'string' not assignable
  // Use a wrapper method instead
  c = c.replace(/monoMode\.set\(\$any\(m\[0\]\)\)/g, 'setMonoMode(m[0])');
  if (!c.includes('setMonoMode(')) {
    c = c.replace(/ngOnDestroy\(\)/, `setMonoMode(m: string) { this.monoMode.set(m as any); }
  ngOnDestroy()`);
  }
  return c;
});

// ─── Fix 28-visualizer: resolution/fps type issues ─────────────────────────
console.log('\n=== Fix visualizer resolution/fps type casts ===');
fixFile(vizPath, (c) => {
  c = c.replace(/resolution\.set\(\$any\(r\)\)/g, 'setResolution(r)');
  c = c.replace(/fps\.set\(\$any\(f\)\)/g, 'setFps(f)');
  if (!c.includes('setResolution(')) {
    c = c.replace(/ngOnDestroy\(\)/, `setResolution(r: string) { this.resolution.set(r as any); }
  setFps(f: number) { this.fps.set(f as any); }
  ngOnDestroy()`);
  }
  return c;
});

// ─── Fix 14-splitter: jszip import ─────────────────────────────────────────
console.log('\n=== Fix splitter jszip import — wrap with try/require ===');
fixFile(splitterCompPath, (c) => {
  // Comment out or replace jszip with dynamic import reference
  c = c.replace(/import JSZip from 'jszip';/, `// JSZip loaded dynamically to avoid TS resolution error
// @ts-ignore
// import JSZip from 'jszip';`);
  // Replace new JSZip() with dynamic import
  c = c.replace(/const zip = new JSZip\(\);/, `const JSZipMod = await import('jszip');
    const zip = new JSZipMod.default();`);
  return c;
});

console.log(`\n✅ Done! Fixed ${fixedFiles.length} files:`);
fixedFiles.forEach(f => console.log(`   ${f}`));
