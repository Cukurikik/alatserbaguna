import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { Routes } from '@angular/router';
import { recorderReducer, recorderProcessingEffect } from './01-recorder/recorder.store';
import { trimmerReducer, trimmerProcessingEffect } from './02-trimmer/trimmer.store';
import { mergerReducer, mergerProcessingEffect } from './03-merger/merger.store';
import { converterReducer, converterProcessingEffect } from './04-converter/converter.store';
import { compressorReducer, compressorProcessingEffect } from './05-compressor/compressor.store';
import { equalizerReducer, equalizerProcessingEffect } from './06-equalizer/equalizer.store';
import { pitchshifterReducer, pitchshifterProcessingEffect } from './07-pitch-shifter/pitch-shifter.store';
import { timestretchReducer, timestretchProcessingEffect } from './08-time-stretch/time-stretch.store';
import { normalizerReducer, normalizerProcessingEffect } from './09-normalizer/normalizer.store';
import { reverbReducer, reverbProcessingEffect } from './10-reverb/reverb.store';
import { noiseremoverReducer, noiseremoverProcessingEffect } from './11-noise-remover/noise-remover.store';
import { splitterReducer, splitterProcessingEffect } from './12-splitter/splitter.store';
import { metadataReducer, metadataProcessingEffect } from './13-metadata/metadata.store';
import { batchReducer, batchProcessingEffect } from './14-batch/batch.store';
import { analyserReducer, analyserProcessingEffect } from './15-analyser/analyser.store';
import { reverserReducer, reverserProcessingEffect } from './16-reverser/reverser.store';
import { mixerReducer, mixerProcessingEffect } from './17-mixer/mixer.store';
import { fadeReducer, fadeProcessingEffect } from './18-fade/fade.store';
import { looperReducer, looperProcessingEffect } from './19-looper/looper.store';
import { channelmixerReducer, channelmixerProcessingEffect } from './20-channel-mixer/channel-mixer.store';
import { silenceremoverReducer, silenceremoverProcessingEffect } from './21-silence-remover/silence-remover.store';
import { speedReducer, speedProcessingEffect } from './22-speed/speed.store';
import { limiterReducer, limiterProcessingEffect } from './23-limiter/limiter.store';
import { stereowidenerReducer, stereowidenerProcessingEffect } from './24-stereo-widener/stereo-widener.store';
import { voicechangerReducer, voicechangerProcessingEffect } from './25-voice-changer/voice-changer.store';
import { karaokeReducer, karaokeProcessingEffect } from './26-karaoke/karaoke.store';
import { visualizerReducer, visualizerProcessingEffect } from './27-visualizer/visualizer.store';
import { transcriberReducer, transcriberProcessingEffect } from './28-transcriber/transcriber.store';
import { watermarkReducer, watermarkProcessingEffect } from './29-watermark/watermark.store';
import { stemsplitterReducer, stemsplitterProcessingEffect } from './30-stem-splitter/stem-splitter.store';

export const AUDIO_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideState('recorder', recorderReducer),
      provideState('trimmer', trimmerReducer),
      provideState('merger', mergerReducer),
      provideState('converter', converterReducer),
      provideState('compressor', compressorReducer),
      provideState('equalizer', equalizerReducer),
      provideState('pitch-shifter', pitchshifterReducer),
      provideState('time-stretch', timestretchReducer),
      provideState('normalizer', normalizerReducer),
      provideState('reverb', reverbReducer),
      provideState('noise-remover', noiseremoverReducer),
      provideState('splitter', splitterReducer),
      provideState('metadata', metadataReducer),
      provideState('batch', batchReducer),
      provideState('analyser', analyserReducer),
      provideState('reverser', reverserReducer),
      provideState('mixer', mixerReducer),
      provideState('fade', fadeReducer),
      provideState('looper', looperReducer),
      provideState('channel-mixer', channelmixerReducer),
      provideState('silence-remover', silenceremoverReducer),
      provideState('speed', speedReducer),
      provideState('limiter', limiterReducer),
      provideState('stereo-widener', stereowidenerReducer),
      provideState('voice-changer', voicechangerReducer),
      provideState('karaoke', karaokeReducer),
      provideState('visualizer', visualizerReducer),
      provideState('transcriber', transcriberReducer),
      provideState('watermark', watermarkReducer),
      provideState('stem-splitter', stemsplitterReducer),
      provideEffects({
        recorderProcessingEffect,
        trimmerProcessingEffect,
        mergerProcessingEffect,
        converterProcessingEffect,
        compressorProcessingEffect,
        equalizerProcessingEffect,
        pitchshifterProcessingEffect,
        timestretchProcessingEffect,
        normalizerProcessingEffect,
        reverbProcessingEffect,
        noiseremoverProcessingEffect,
        splitterProcessingEffect,
        metadataProcessingEffect,
        batchProcessingEffect,
        analyserProcessingEffect,
        reverserProcessingEffect,
        mixerProcessingEffect,
        fadeProcessingEffect,
        looperProcessingEffect,
        channelmixerProcessingEffect,
        silenceremoverProcessingEffect,
        speedProcessingEffect,
        limiterProcessingEffect,
        stereowidenerProcessingEffect,
        voicechangerProcessingEffect,
        karaokeProcessingEffect,
        visualizerProcessingEffect,
        transcriberProcessingEffect,
        watermarkProcessingEffect,
        stemsplitterProcessingEffect,
      })
    ],
    children: [
      { path: 'recorder', loadComponent: () => import('./01-recorder/recorder.component').then(m => m.RecorderComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'trimmer', loadComponent: () => import('./02-trimmer/trimmer.component').then(m => m.TrimmerComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'merger', loadComponent: () => import('./03-merger/merger.component').then(m => m.MergerComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'converter', loadComponent: () => import('./04-converter/converter.component').then(m => m.ConverterComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'compressor', loadComponent: () => import('./05-compressor/compressor.component').then(m => m.CompressorComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'equalizer', loadComponent: () => import('./06-equalizer/equalizer.component').then(m => m.EqualizerComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'pitch-shifter', loadComponent: () => import('./07-pitch-shifter/pitch-shifter.component').then(m => m.PitchShifterComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'time-stretch', loadComponent: () => import('./08-time-stretch/time-stretch.component').then(m => m.TimeStretchComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'normalizer', loadComponent: () => import('./09-normalizer/normalizer.component').then(m => m.NormalizerComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'reverb', loadComponent: () => import('./10-reverb/reverb.component').then(m => m.ReverbComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'noise-remover', loadComponent: () => import('./11-noise-remover/noise-remover.component').then(m => m.NoiseRemoverComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'splitter', loadComponent: () => import('./12-splitter/splitter.component').then(m => m.SplitterComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'metadata', loadComponent: () => import('./13-metadata/metadata.component').then(m => m.MetadataComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'batch', loadComponent: () => import('./14-batch/batch.component').then(m => m.BatchComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'analyser', loadComponent: () => import('./15-analyser/analyser.component').then(m => m.AnalyserComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'reverser', loadComponent: () => import('./16-reverser/reverser.component').then(m => m.ReverserComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'mixer', loadComponent: () => import('./17-mixer/mixer.component').then(m => m.MixerComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'fade', loadComponent: () => import('./18-fade/fade.component').then(m => m.FadeComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'looper', loadComponent: () => import('./19-looper/looper.component').then(m => m.LooperComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'channel-mixer', loadComponent: () => import('./20-channel-mixer/channel-mixer.component').then(m => m.ChannelMixerComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'silence-remover', loadComponent: () => import('./21-silence-remover/silence-remover.component').then(m => m.SilenceRemoverComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'speed', loadComponent: () => import('./22-speed/speed.component').then(m => m.SpeedComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'limiter', loadComponent: () => import('./23-limiter/limiter.component').then(m => m.LimiterComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'stereo-widener', loadComponent: () => import('./24-stereo-widener/stereo-widener.component').then(m => m.StereoWidenerComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'voice-changer', loadComponent: () => import('./25-voice-changer/voice-changer.component').then(m => m.VoiceChangerComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'karaoke', loadComponent: () => import('./26-karaoke/karaoke.component').then(m => m.KaraokeComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'visualizer', loadComponent: () => import('./27-visualizer/visualizer.component').then(m => m.VisualizerComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'transcriber', loadComponent: () => import('./28-transcriber/transcriber.component').then(m => m.TranscriberComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'watermark', loadComponent: () => import('./29-watermark/watermark.component').then(m => m.WatermarkComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: 'stem-splitter', loadComponent: () => import('./30-stem-splitter/stem-splitter.component').then(m => m.StemSplitterComponent), title: 'undefined — Omni-Tool', data: { category: 'audio' } },
      { path: '', redirectTo: 'recorder', pathMatch: 'full' }
    ]
  }
];
