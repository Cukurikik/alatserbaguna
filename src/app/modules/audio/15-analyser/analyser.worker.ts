/// <reference lib="webworker" />
import { AnalysisResult, WaveformPeak } from './analyser.schema';

self.onmessage = async (event: MessageEvent) => {
  const { file } = event.data;
  try {
    self.postMessage({ type: 'progress', value: 5 });

    // Decode audio using OfflineAudioContext
    const arrayBuffer = await file.arrayBuffer();
    self.postMessage({ type: 'progress', value: 15 });

    // Use a temporary AudioContext to decode
    const ctx = new OfflineAudioContext(2, 44100, 44100);
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    } catch {
      throw new Error('Failed to decode audio data. File may be corrupt or unsupported.');
    }

    self.postMessage({ type: 'progress', value: 35 });

    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const fileSizeMB = file.size / 1024 / 1024;

    // --- Waveform peaks (2000 buckets across all channels, L channel for display) ---
    const peakCount = 2000;
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerBucket = Math.max(1, Math.floor(channelData.length / peakCount));
    const peaks: WaveformPeak[] = [];

    for (let i = 0; i < peakCount; i++) {
      let min = 0;
      let max = 0;
      const start = i * samplesPerBucket;
      const end = Math.min(start + samplesPerBucket, channelData.length);
      for (let j = start; j < end; j++) {
        const s = channelData[j];
        if (s < min) min = s;
        if (s > max) max = s;
      }
      peaks.push({ min, max });
    }

    self.postMessage({ type: 'progress', value: 55 });

    let rmsChannelSamples = 0;
    let sumSquaresVal = 0;
    let truePeakVal = 0;
    for (let c = 0; c < channels; c++) {
      const cd = audioBuffer.getChannelData(c);
      for (const sample of Array.from(cd)) {
        const abs = Math.abs(sample);
        sumSquaresVal += sample * sample;
        if (abs > truePeakVal) truePeakVal = abs;
        rmsChannelSamples++;
      }
    }
    const sumSquares = sumSquaresVal;
    const truePeak = truePeakVal;
    const rmsLinear = Math.sqrt(sumSquares / (channelData.length * channels));
    const rmsDb = rmsLinear > 0 ? 20 * Math.log10(rmsLinear) : -Infinity;
    const peakDb = truePeak > 0 ? 20 * Math.log10(truePeak) : -Infinity;
    const dynamicRange = isFinite(rmsDb) && isFinite(peakDb) ? peakDb - rmsDb : 0;

    self.postMessage({ type: 'progress', value: 75 });

    // --- Frequency Spectrum (128 bins from FFT of first 4096 samples) ---
    // Simple DFT magnitude for the first fftSize samples
    const fftSize = 4096;
    const fftInput = audioBuffer.getChannelData(0).slice(0, fftSize);
    const spectrumBins: number[] = new Array(128).fill(0);
    const binsPerBucket = Math.floor(fftSize / 2 / 128);

    // Apply Hann window
    const windowed = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      windowed[i] = fftInput[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / fftSize));
    }

    // Simple DFT magnitude — just compute the real magnitude for display
    let maxMag = 0;
    const magnitudes = new Float32Array(fftSize / 2);
    for (let k = 0; k < fftSize / 2; k++) {
      let real = 0;
      let imag = 0;
      // Using only a subset for performance: step by 4 (approximate)
      for (let n = 0; n < fftSize; n += 4) {
        const angle = (2 * Math.PI * k * n) / fftSize;
        real += windowed[n] * Math.cos(angle);
        imag -= windowed[n] * Math.sin(angle);
      }
      const mag = Math.sqrt(real * real + imag * imag);
      magnitudes[k] = mag;
      if (mag > maxMag) maxMag = mag;
    }

    for (let i = 0; i < 128; i++) {
      let sum = 0;
      const start = i * binsPerBucket;
      for (let j = 0; j < binsPerBucket && start + j < magnitudes.length; j++) {
        sum += magnitudes[start + j];
      }
      spectrumBins[i] = maxMag > 0 ? (sum / binsPerBucket) / maxMag : 0;
    }

    self.postMessage({ type: 'progress', value: 95 });

    const result: AnalysisResult = {
      duration, sampleRate, channels, fileSizeMB,
      peaks, rmsDb, peakDb, dynamicRange, spectrumBins
    };

    self.postMessage({ type: 'complete', data: result });

  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Analysis failed', errorCode: 'DECODE_FAILED' });
  }
};
