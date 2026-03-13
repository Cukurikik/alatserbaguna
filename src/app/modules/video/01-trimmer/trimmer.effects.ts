import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { TrimmerActions, selectTrimmerState } from './trimmer.store';
import { FfmpegService } from '../shared/engine/ffmpeg.service';
import { TrimmerService } from './trimmer.service';
import { VideoFileSchema } from '../shared/schemas/video.schemas';
import { TrimmerInputSchema } from './trimmer.schema';
import { VideoErrorMessages, VideoErrorCode } from '../shared/errors/video.errors';

@Injectable()
export class TrimmerEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private ffmpegService = inject(FfmpegService);
  private trimmerService = inject(TrimmerService);

  loadFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrimmerActions.loadFile),
      switchMap(({ file }) => {
        const result = VideoFileSchema.safeParse(file);
        if (!result.success) {
          return of(TrimmerActions.processingFailure({
            errorCode: 'INVALID_FILE_TYPE',
            message: result.error.issues[0].message
          }));
        }

        return this.ffmpegService.getMetadata(file).then(
          meta => TrimmerActions.loadMetaSuccess({ meta }),
          () => TrimmerActions.loadMetaFailure({ errorCode: 'FILE_CORRUPTED' })
        );
      })
    )
  );

  startProcessing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrimmerActions.startProcessing),
      withLatestFrom(this.store.select(selectTrimmerState)),
      exhaustMap(([, state]) => {
        const config = {
          inputFile: state.inputFile,
          startTime: state.startTime,
          endTime: state.endTime,
          outputFormat: state.outputFormat
        };

        const result = TrimmerInputSchema.safeParse(config);
        if (!result.success) {
          return of(TrimmerActions.processingFailure({
            errorCode: 'INVALID_TIME_RANGE',
            message: result.error.issues[0].message
          }));
        }

        return this.trimmerService.process(result.data).pipe(
          map(msg => {
            if (msg.type === 'progress') {
              return TrimmerActions.updateProgress({ progress: msg.value || 0 });
            } else if (msg.type === 'complete') {
              const blob = new Blob([msg.data as BlobPart], { type: `video/${state.outputFormat}` });
              return TrimmerActions.processingSuccess({
                outputBlob: blob,
                outputSizeMB: blob.size / (1024 * 1024)
              });
            } else {
              return TrimmerActions.processingFailure({
                errorCode: (msg.errorCode as VideoErrorCode) || 'WORKER_CRASHED',
                message: msg.message || VideoErrorMessages['WORKER_CRASHED']
              });
            }
          }),
          catchError(error => of(TrimmerActions.processingFailure({
            errorCode: error.code || 'UNKNOWN_ERROR',
            message: error.message || VideoErrorMessages['UNKNOWN_ERROR']
          })))
        );
      })
    )
  );

  downloadOutput$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrimmerActions.downloadOutput),
      withLatestFrom(this.store.select(selectTrimmerState)),
      tap(([, state]) => {
        if (state.outputBlob) {
          const url = URL.createObjectURL(state.outputBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `omni_trimmed_${state.inputFile?.name.split('.')[0] || 'video'}.${state.outputFormat}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 150);
        }
      })
    ),
    { dispatch: false }
  );

  resetState$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrimmerActions.resetState),
      withLatestFrom(this.store.select(selectTrimmerState)),
      tap(([, state]) => {
        if (state.outputBlob) {
          // In a real app we might track the URL and revoke it here
        }
      })
    ),
    { dispatch: false }
  );
}
