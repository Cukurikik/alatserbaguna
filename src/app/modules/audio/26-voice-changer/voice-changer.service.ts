import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkerMessage, ExportFormat } from '../shared/types/audio.types';
import { VoicePreset } from './voice-changer.schema';

export interface VoiceEffectParams {
  pitchSemitones: number;
  speed: number;
  robotMode: boolean;
  robotFrequency: number;
  echoDelay: number;
  echoDecay: number;
}

export const VOICE_PRESETS: Record<VoicePreset, VoiceEffectParams> = {
  original:        { pitchSemitones: 0,   speed: 1.0,  robotMode: false, robotFrequency: 100, echoDelay: 0,   echoDecay: 0 },
  'male-to-female':{ pitchSemitones: 5,   speed: 1.05, robotMode: false, robotFrequency: 100, echoDelay: 0,   echoDecay: 0 },
  'female-to-male':{ pitchSemitones: -5,  speed: 0.97, robotMode: false, robotFrequency: 100, echoDelay: 0,   echoDecay: 0 },
  chipmunk:        { pitchSemitones: 7,   speed: 1.3,  robotMode: false, robotFrequency: 100, echoDelay: 0,   echoDecay: 0 },
  giant:           { pitchSemitones: -7,  speed: 0.85, robotMode: false, robotFrequency: 100, echoDelay: 0,   echoDecay: 0 },
  robot:           { pitchSemitones: 0,   speed: 1.0,  robotMode: true,  robotFrequency: 100, echoDelay: 0,   echoDecay: 0 },
  echo:            { pitchSemitones: 0,   speed: 1.0,  robotMode: false, robotFrequency: 100, echoDelay: 400, echoDecay: 0.5 },
};

@Injectable({ providedIn: 'root' })
export class VoiceChangerService {
  applyEffect(file: File, format: ExportFormat, params: VoiceEffectParams): Observable<WorkerMessage<{ blob: Blob, sizeMB: number }>> {
    return new Observable(observer => {
      let isCancelled = false;
      const worker = new Worker(new URL('./voice-changer.worker', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }: MessageEvent<WorkerMessage<any>>) => {
        if (isCancelled) return;
        switch (data.type) {
          case 'progress': observer.next({ type: 'progress', value: data.value }); break;
          case 'complete': observer.next({ type: 'complete', data: data.data }); observer.complete(); worker.terminate(); break;
          case 'log': observer.next({ type: 'log', message: data.message }); break;
          case 'error': observer.error(data); worker.terminate(); break;
        }
      };
      worker.onerror = (err) => { if (!isCancelled) observer.error({ type: 'error', message: err.message, errorCode: 'WORKER_CRASHED' }); worker.terminate(); };
      worker.postMessage({ file, format, params });
      return () => { isCancelled = true; worker.terminate(); };
    });
  }
}
