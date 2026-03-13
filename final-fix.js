const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join('src', 'app', 'modules', 'audio');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(AUDIO_DIR);

files.forEach(f => {
  if (f.endsWith('.component.ts')) {
    let content = fs.readFileSync(f, 'utf8');
    
    // Fix templates
    content = content.replace(/\(change\)="outputFormat\.set\(\(e\.target as any\)\.value as any\)"/g, '(change)="outputFormat.set($any($event.target).value)"');
    // For anything like `<select [value]="outputFormat()" (change)="outputFormat.set((e.target as HTMLSelectElement).value as any)"`
    content = content.replace(/\(\(e\.target\s*as\s*HTMLSelectElement\)\.value\s*as\s*any\)/g, '($any($event.target).value)');
    
    // Let's just blindly fix (e.target as any) inside bindings
    content = content.replace(/\(change\)="([a-zA-Z0-9_\.]+)\.set\(\(e\.target as any\)\.value\)"/g, '(change)="$1.set($any($event.target).value)"');
    content = content.replace(/\(input\)="([a-zA-Z0-9_\.]+)\.set\(\+\(e\.target as any\)\.value\)"/g, '(input)="$1.set(+$any($event.target).value)"');
    
    // Also if there's any remaining `(e.target as HTMLInputElement).value` inside quotes "..."
    content = content.replace(/\(input\)="([a-zA-Z0-9_\.]+)\.set\(\+\(e\.target as HTMLInputElement\)\.value\)"/g, '(input)="$1.set(+$any($event.target).value)"');
    
    // Fix remaining TS methods that were corrupted into `(e.target as any)`
    content = content.replace(/parseInt\(\(e\.target as any\)\.value,\s*10\)/g, 'parseInt((e.target as HTMLInputElement).value, 10)');
    content = content.replace(/parseFloat\(\(e\.target as any\)\.value\)/g, 'parseFloat((e.target as HTMLInputElement).value)');
    content = content.replace(/Number\(\(e\.target as any\)\.value\)/g, 'Number((e.target as HTMLInputElement).value)');
    
    content = content.replace(/\.set\(\(e\.target as any\)\.value as ExportFormat\)/g, '.set((e.target as HTMLSelectElement).value as ExportFormat)');
    content = content.replace(/\.value:\s*\(e\.target as any\)\.value/g, 'value: (e.target as HTMLInputElement).value');
    content = content.replace(/\=\s*\(e\.target as any\)\.value as ExportFormat/g, '= (e.target as HTMLSelectElement).value as ExportFormat');
    
    // Drop zone typing
    content = content.replace(/Array\.from\(\(e\.target as any\)\.files \?\? \[\]\)/g, '(Array.from((e.target as HTMLInputElement).files ?? []) as File[])');
    content = content.replace(/const file = \(e\.target as any\)\.files\?\.\[0\]/g, 'const file = (e.target as HTMLInputElement).files?.[0]');
    content = content.replace(/\(e\.target as any\)\.value = ''/g, '(e.target as HTMLInputElement).value = \'\'');

    fs.writeFileSync(f, content);
  } else if (f.endsWith('index.ts')) {
    let content = fs.readFileSync(f, 'utf8');
    
    // Fix schemas
    // export { RecorderSchema } from './recorder.schema'; -> expected RecorderConfigSchema
    const toRename = ['Recorder', 'Trimmer', 'Merger', 'Converter', 'Compressor', 'PitchShifter', 'Echo', 'TimeStretch', 'Normalizer', 'Reverser', 'NoiseRemover', 'Mixer', 'Fade', 'Looper', 'Metadata', 'Batch', 'ChannelMixer', 'SilenceRemover', 'Speed', 'Limiter', 'StereoWidener'];
    
    let changed = false;
    toRename.forEach(name => {
      const regex = new RegExp(`export \\{ (.*?)Schema \\}`);
      const m = content.match(regex);
      if (m && !m[1].includes('Config')) {
        content = content.replace(regex, `export { $1ConfigSchema }`);
        changed = true;
      }
    });

    if (changed) fs.writeFileSync(f, content);
  }
});
console.log('Templates and schemas safely patched.');
