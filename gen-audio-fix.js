/**
 * FIX SCRIPT: Align store exports to match audio.routes.ts expected import names
 * AND fix audio.routes.ts titles from 'undefined' to proper titles
 */
const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, 'src/app/modules/audio');

// Fix 1: Add missing aliases to each store file so audio.routes.ts imports work
const storeAliases = {
  '01-recorder/recorder.store.ts': 'recorderReducer|recorderProcessingEffect',
  '02-trimmer/trimmer.store.ts': 'trimmerReducer|trimmerProcessingEffect',
  '03-merger/merger.store.ts': 'mergerReducer|mergerProcessingEffect',
  '04-converter/converter.store.ts': 'converterReducer|converterProcessingEffect',
  '05-compressor/compressor.store.ts': 'compressorReducer|compressorProcessingEffect',
  '06-equalizer/equalizer.store.ts': 'equalizerReducer|equalizerProcessingEffect',
  '07-pitch-shifter/pitch-shifter.store.ts': 'pitchshifterReducer|pitchshifterProcessingEffect',
  '08-time-stretch/time-stretch.store.ts': 'timestretchReducer|timestretchProcessingEffect',
  '09-normalizer/normalizer.store.ts': 'normalizerReducer|normalizerProcessingEffect',
  '10-reverb/reverb.store.ts': 'reverbReducer|reverbProcessingEffect',
  '11-noise-remover/noise-remover.store.ts': 'noiseremoverReducer|noiseremoverProcessingEffect',
  '12-splitter/splitter.store.ts': 'splitterReducer|splitterProcessingEffect',
  '13-metadata/metadata.store.ts': 'metadataReducer|metadataProcessingEffect',
  '14-batch/batch.store.ts': 'batchReducer|batchProcessingEffect',
  '15-analyser/analyser.store.ts': 'analyserReducer|analyserProcessingEffect',
  '16-reverser/reverser.store.ts': 'reverserReducer|reverserProcessingEffect',
  '17-mixer/mixer.store.ts': 'mixerReducer|mixerProcessingEffect',
  '18-fade/fade.store.ts': 'fadeReducer|fadeProcessingEffect',
  '19-looper/looper.store.ts': 'looperReducer|looperProcessingEffect',
  '20-channel-mixer/channel-mixer.store.ts': 'channelmixerReducer|channelmixerProcessingEffect',
  '21-silence-remover/silence-remover.store.ts': 'silenceremoverReducer|silenceremoverProcessingEffect',
  '22-speed/speed.store.ts': 'speedReducer|speedProcessingEffect',
  '23-limiter/limiter.store.ts': 'limiterReducer|limiterProcessingEffect',
  '24-stereo-widener/stereo-widener.store.ts': 'stereowidenerReducer|stereowidenerProcessingEffect',
  '25-voice-changer/voice-changer.store.ts': 'voicechangerReducer|voicechangerProcessingEffect',
  '26-karaoke/karaoke.store.ts': 'karaokeReducer|karaokeProcessingEffect',
  '27-visualizer/visualizer.store.ts': 'visualizerReducer|visualizerProcessingEffect',
  '28-transcriber/transcriber.store.ts': 'transcriberReducer|transcriberProcessingEffect',
  '29-watermark/watermark.store.ts': 'watermarkReducer|watermarkProcessingEffect',
  '30-stem-splitter/stem-splitter.store.ts': 'stemsplitterReducer|stemsplitterProcessingEffect',
};

// The generated store uses [name]Reducer and [name]ProcessingEffect patterns
// We need to add the aliased exports at the end of each store file
for (const [relPath, aliases] of Object.entries(storeAliases)) {
  const fullPath = path.join(BASE, relPath);
  if (!fs.existsSync(fullPath)) { console.log('MISSING:', relPath); continue; }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const [aliasReducer, aliasEffect] = aliases.split('|');
  
  // Figure the actual generated names from the file content
  const reducerMatch = content.match(/export const (\w+Reducer) = createReducer/);
  const effectMatch = content.match(/export const (\w+ProcessingEffect) = createEffect/);
  
  if (!reducerMatch || !effectMatch) {
    console.log('WARN: Could not find reducer/effect in', relPath);
    continue;
  }
  
  const actualReducer = reducerMatch[1];
  const actualEffect = effectMatch[1];
  
  // Add alias exports if they differ
  const appendLines = [];
  if (actualReducer !== aliasReducer) {
    appendLines.push(`\nexport const ${aliasReducer} = ${actualReducer};`);
  }
  if (actualEffect !== aliasEffect) {
    appendLines.push(`\nexport const ${aliasEffect} = ${actualEffect};`);
  }
  
  if (appendLines.length > 0) {
    content += appendLines.join('');
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('✅ Fixed aliases in:', relPath);
  } else {
    console.log('✓ OK (names match):', relPath);
  }
}

// Fix 2: Update audio.routes.ts titles from 'undefined' to proper titles
const routesTitles = {
  'recorder': 'Audio Recorder',
  'trimmer': 'Audio Trimmer',
  'merger': 'Audio Merger',
  'converter': 'Format Converter',
  'compressor': 'Dynamics Compressor',
  'equalizer': 'Equalizer',
  'pitch-shifter': 'Pitch Shifter',
  'time-stretch': 'Time Stretcher',
  'normalizer': 'Audio Normalizer',
  'reverb': 'Reverb & Room Sim',
  'noise-remover': 'Noise Remover',
  'splitter': 'Audio Splitter',
  'metadata': 'Metadata Editor',
  'batch': 'Batch Processor',
  'analyser': 'Audio Analyser',
  'reverser': 'Audio Reverser',
  'mixer': 'Multi-Track Mixer',
  'fade': 'Fade In/Out',
  'looper': 'Loop Creator',
  'channel-mixer': 'Channel Mixer',
  'silence-remover': 'Silence Remover',
  'speed': 'Speed Changer',
  'limiter': 'Limiter & Maximizer',
  'stereo-widener': 'Stereo Widener',
  'voice-changer': 'Voice Changer',
  'karaoke': 'Karaoke Maker',
  'visualizer': 'Spectrum Visualizer',
  'transcriber': 'Audio Transcriber',
  'watermark': 'Audio Watermark',
  'stem-splitter': 'AI Stem Splitter',
};

const routesPath = path.join(BASE, 'audio.routes.ts');
let routesContent = fs.readFileSync(routesPath, 'utf8');

for (const [slug, title] of Object.entries(routesTitles)) {
  // Replace 'undefined — Omni-Tool' with proper titles for each path
  const regex = new RegExp(
    `(path: '${slug}'[^}]+title: )'undefined — Omni-Tool'`,
    'g'
  );
  routesContent = routesContent.replace(regex, `$1'${title} — Omni-Tool'`);
}

fs.writeFileSync(routesPath, routesContent, 'utf8');
console.log('\n✅ Fixed audio.routes.ts titles');
console.log('\n🎯 ALL FIXES COMPLETE!');
