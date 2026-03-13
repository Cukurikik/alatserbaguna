/// <reference lib="webworker" />

interface TrackMixConfig { file: File; volume: number; pan: number; muted: boolean; soloed: boolean; }

self.onmessage = async (event: MessageEvent) => {
  const { tracks, masterVolume, outputMode, format } = event.data as {
    tracks: TrackMixConfig[]; masterVolume: number; outputMode: 'stereo' | 'mono'; format: string;
  };

  try {
    self.postMessage({ type: 'progress', value: 5 });

    // Decode all files
    const buffers: AudioBuffer[] = [];
    for (let i = 0; i < tracks.length; i++) {
      const ab = await tracks[i].file.arrayBuffer();
      const ctx = new OfflineAudioContext(2, 44100, 44100);
      const decoded = await ctx.decodeAudioData(ab.slice(0));
      buffers.push(decoded);
      self.postMessage({ type: 'progress', value: 5 + Math.round(((i + 1) / tracks.length) * 40) });
      self.postMessage({ type: 'log', message: `Decoded: ${tracks[i].file.name} (${decoded.duration.toFixed(2)}s)` });
    }

    // Find max duration and sample rate
    const maxDuration = Math.max(...buffers.map(b => b.duration));
    const sampleRate = Math.max(...buffers.map(b => b.sampleRate));
    const totalSamples = Math.ceil(maxDuration * sampleRate);
    const outputChannels = outputMode === 'mono' ? 1 : 2;

    self.postMessage({ type: 'log', message: `Mixing ${tracks.length} tracks → ${maxDuration.toFixed(2)}s at ${sampleRate}Hz` });
    self.postMessage({ type: 'progress', value: 50 });

    // Accumulate using Float64 to avoid float errors on many tracks
    const accL = new Float64Array(totalSamples);
    const accR = new Float64Array(totalSamples);

    for (let t = 0; t < tracks.length; t++) {
      const track = tracks[t];
      const buf = buffers[t];
      const trackGain = track.volume;
      const panAngle = ((track.pan + 1) / 2) * (Math.PI / 2); // 0..PI/2
      const leftGain = Math.cos(panAngle) * trackGain;
      const rightGain = Math.sin(panAngle) * trackGain;

      const chL = buf.getChannelData(0);
      const chR = buf.numberOfChannels > 1 ? buf.getChannelData(1) : chL;
      const len = Math.min(chL.length, totalSamples);

      for (let s = 0; s < len; s++) {
        accL[s] += chL[s] * leftGain;
        accR[s] += chR[s] * rightGain;
      }
    }

    // Apply master volume + soft clip (tanh)
    const softClip = (x: number) => Math.tanh(x * masterVolume);

    const finalCtx = new OfflineAudioContext(outputChannels, totalSamples, sampleRate);
    const finalBuf = finalCtx.createBuffer(outputChannels, totalSamples, sampleRate);

    const finalL = finalBuf.getChannelData(0);
    for (let s = 0; s < totalSamples; s++) finalL[s] = softClip(accL[s]);

    if (outputChannels === 2) {
      const finalR = finalBuf.getChannelData(1);
      for (let s = 0; s < totalSamples; s++) finalR[s] = softClip(accR[s]);
    }

    self.postMessage({ type: 'progress', value: 80 });
    self.postMessage({ type: 'log', message: 'Encoding final mix...' });

    // Encode to WAV using PCM directly (always safe for mixed output)
    const numCh = finalBuf.numberOfChannels;
    const numSamples = finalBuf.length;
    const wavBuffer = new ArrayBuffer(44 + numSamples * numCh * 2);
    const view = new DataView(wavBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * numCh * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);       // PCM
    view.setUint16(22, numCh, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numCh * 2, true);
    view.setUint16(32, numCh * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * numCh * 2, true);

    let offset = 44;
    for (let s = 0; s < numSamples; s++) {
      for (let c = 0; c < numCh; c++) {
        const sample = Math.max(-1, Math.min(1, finalBuf.getChannelData(c)[s]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    self.postMessage({ type: 'progress', value: 98 });
    self.postMessage({ type: 'complete', data: { blob, sizeMB: blob.size / 1024 / 1024 } });

  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Mix failed', errorCode: 'DECODE_FAILED' });
  }
};
