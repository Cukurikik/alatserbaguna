import { provideState } from '@ngrx/store';
import { Routes } from '@angular/router';
import { recorderReducer } from './01-recorder/recorder.store';
import { trimmerReducer } from './02-trimmer/trimmer.store';
import { mergerReducer } from './03-merger/merger.store';
import { converterReducer } from './04-converter/converter.store';
import { compressorReducer } from './05-compressor/compressor.store';
import { equalizerReducer } from './06-equalizer/equalizer.store';
import { pitchShifterReducer } from './07-pitch-shifter/pitch-shifter.store';
import { timeStretchReducer } from './08-time-stretch/time-stretch.store';
import { normalizerReducer } from './09-normalizer/normalizer.store';
import { reverbReducer } from './10-reverb/reverb.store';
import { noiseRemoverReducer } from './11-noise-remover/noise-remover.store';
import { splitterReducer } from './12-splitter/splitter.store';
import { metadataReducer } from './13-metadata/metadata.store';
import { batchReducer } from './14-batch/batch.store';
import { analyserReducer } from './15-analyser/analyser.store';
import { reverserReducer } from './16-reverser/reverser.store';
import { mixerReducer } from './17-mixer/mixer.store';
import { fadeReducer } from './18-fade/fade.store';
import { looperReducer } from './19-looper/looper.store';
import { channelMixerReducer } from './20-channel-mixer/channel-mixer.store';
import { silenceRemoverReducer } from './21-silence-remover/silence-remover.store';
import { speedReducer } from './22-speed/speed.store';
import { limiterReducer } from './23-limiter/limiter.store';
import { stereoWidenerReducer } from './24-stereo-widener/stereo-widener.store';
import { voiceChangerReducer } from './25-voice-changer/voice-changer.store';
import { karaokeReducer } from './26-karaoke/karaoke.store';
import { visualizerReducer } from './27-visualizer/visualizer.store';
import { transcriberReducer } from './28-transcriber/transcriber.store';
import { watermarkReducer } from './29-watermark/watermark.store';
import { stemSplitterReducer } from './30-stem-splitter/stem-splitter.store';

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
      provideState('pitch-shifter', pitchShifterReducer),
      provideState('time-stretch', timeStretchReducer),
      provideState('normalizer', normalizerReducer),
      provideState('reverb', reverbReducer),
      provideState('noise-remover', noiseRemoverReducer),
      provideState('splitter', splitterReducer),
      provideState('metadata', metadataReducer),
      provideState('batch', batchReducer),
      provideState('analyser', analyserReducer),
      provideState('reverser', reverserReducer),
      provideState('mixer', mixerReducer),
      provideState('fade', fadeReducer),
      provideState('looper', looperReducer),
      provideState('channel-mixer', channelMixerReducer),
      provideState('silence-remover', silenceRemoverReducer),
      provideState('speed', speedReducer),
      provideState('limiter', limiterReducer),
      provideState('stereo-widener', stereoWidenerReducer),
      provideState('voice-changer', voiceChangerReducer),
      provideState('karaoke', karaokeReducer),
      provideState('visualizer', visualizerReducer),
      provideState('transcriber', transcriberReducer),
      provideState('watermark', watermarkReducer),
      provideState('stem-splitter', stemSplitterReducer),
    ],
    children: [
      { path: 'recorder', loadComponent: () => import('./01-recorder/recorder.component').then(m => m.RecorderComponent), title: 'Audio Recorder — Omni-Tool', data: { category: 'audio' } },
      { path: 'trimmer', loadComponent: () => import('./02-trimmer/trimmer.component').then(m => m.TrimmerComponent), title: 'Audio Trimmer — Omni-Tool', data: { category: 'audio' } },
      { path: 'merger', loadComponent: () => import('./03-merger/merger.component').then(m => m.MergerComponent), title: 'Audio Merger — Omni-Tool', data: { category: 'audio' } },
      { path: 'converter', loadComponent: () => import('./04-converter/converter.component').then(m => m.ConverterComponent), title: 'Format Converter — Omni-Tool', data: { category: 'audio' } },
      { path: 'compressor', loadComponent: () => import('./05-compressor/compressor.component').then(m => m.CompressorComponent), title: 'Dynamics Compressor — Omni-Tool', data: { category: 'audio' } },
      { path: 'equalizer', loadComponent: () => import('./06-equalizer/equalizer.component').then(m => m.EqualizerComponent), title: 'Equalizer — Omni-Tool', data: { category: 'audio' } },
      { path: 'pitch-shifter', loadComponent: () => import('./07-pitch-shifter/pitch-shifter.component').then(m => m.PitchShifterComponent), title: 'Pitch Shifter — Omni-Tool', data: { category: 'audio' } },
      { path: 'time-stretch', loadComponent: () => import('./08-time-stretch/time-stretch.component').then(m => m.TimeStretchComponent), title: 'Time Stretcher — Omni-Tool', data: { category: 'audio' } },
      { path: 'normalizer', loadComponent: () => import('./09-normalizer/normalizer.component').then(m => m.NormalizerComponent), title: 'Audio Normalizer — Omni-Tool', data: { category: 'audio' } },
      { path: 'reverb', loadComponent: () => import('./10-reverb/reverb.component').then(m => m.ReverbComponent), title: 'Reverb & Room Sim — Omni-Tool', data: { category: 'audio' } },
      { path: 'noise-remover', loadComponent: () => import('./11-noise-remover/noise-remover.component').then(m => m.NoiseRemoverComponent), title: 'Noise Remover — Omni-Tool', data: { category: 'audio' } },
      { path: 'splitter', loadComponent: () => import('./12-splitter/splitter.component').then(m => m.SplitterComponent), title: 'Audio Splitter — Omni-Tool', data: { category: 'audio' } },
      { path: 'metadata', loadComponent: () => import('./13-metadata/metadata.component').then(m => m.MetadataComponent), title: 'Metadata Editor — Omni-Tool', data: { category: 'audio' } },
      { path: 'batch', loadComponent: () => import('./14-batch/batch.component').then(m => m.BatchComponent), title: 'Batch Processor — Omni-Tool', data: { category: 'audio' } },
      { path: 'analyser', loadComponent: () => import('./15-analyser/analyser.component').then(m => m.AnalyserComponent), title: 'Audio Analyser — Omni-Tool', data: { category: 'audio' } },
      { path: 'reverser', loadComponent: () => import('./16-reverser/reverser.component').then(m => m.ReverserComponent), title: 'Audio Reverser — Omni-Tool', data: { category: 'audio' } },
      { path: 'mixer', loadComponent: () => import('./17-mixer/mixer.component').then(m => m.MixerComponent), title: 'Multi-track Mixer — Omni-Tool', data: { category: 'audio' } },
      { path: 'fade', loadComponent: () => import('./18-fade/fade.component').then(m => m.FadeComponent), title: 'Fade In/Out — Omni-Tool', data: { category: 'audio' } },
      { path: 'looper', loadComponent: () => import('./19-looper/looper.component').then(m => m.LooperComponent), title: 'Loop Creator — Omni-Tool', data: { category: 'audio' } },
      { path: 'channel-mixer', loadComponent: () => import('./20-channel-mixer/channel-mixer.component').then(m => m.ChannelMixerComponent), title: 'Channel Mixer — Omni-Tool', data: { category: 'audio' } },
      { path: 'silence-remover', loadComponent: () => import('./21-silence-remover/silence-remover.component').then(m => m.SilenceRemoverComponent), title: 'Silence Remover — Omni-Tool', data: { category: 'audio' } },
      { path: 'speed', loadComponent: () => import('./22-speed/speed.component').then(m => m.SpeedComponent), title: 'Speed Changer — Omni-Tool', data: { category: 'audio' } },
      { path: 'limiter', loadComponent: () => import('./23-limiter/limiter.component').then(m => m.LimiterComponent), title: 'Limiter & Maximizer — Omni-Tool', data: { category: 'audio' } },
      { path: 'stereo-widener', loadComponent: () => import('./24-stereo-widener/stereo-widener.component').then(m => m.StereoWidenerComponent), title: 'Stereo Widener — Omni-Tool', data: { category: 'audio' } },
      { path: 'voice-changer', loadComponent: () => import('./25-voice-changer/voice-changer.component').then(m => m.VoiceChangerComponent), title: 'Voice Changer — Omni-Tool', data: { category: 'audio' } },
      { path: 'karaoke', loadComponent: () => import('./26-karaoke/karaoke.component').then(m => m.KaraokeComponent), title: 'Karaoke/Vocal Remover — Omni-Tool', data: { category: 'audio' } },
      { path: 'visualizer', loadComponent: () => import('./27-visualizer/visualizer.component').then(m => m.VisualizerComponent), title: 'Spectrum Visualizer — Omni-Tool', data: { category: 'audio' } },
      { path: 'transcriber', loadComponent: () => import('./28-transcriber/transcriber.component').then(m => m.TranscriberComponent), title: 'Audio Transcriber — Omni-Tool', data: { category: 'audio' } },
      { path: 'watermark', loadComponent: () => import('./29-watermark/watermark.component').then(m => m.WatermarkComponent), title: 'Audio Watermark — Omni-Tool', data: { category: 'audio' } },
      { path: 'stem-splitter', loadComponent: () => import('./30-stem-splitter/stem-splitter.component').then(m => m.StemSplitterComponent), title: 'AI Stem Splitter — Omni-Tool', data: { category: 'audio' } },
      { path: '', redirectTo: 'recorder', pathMatch: 'full' }
    ]
  }
];
