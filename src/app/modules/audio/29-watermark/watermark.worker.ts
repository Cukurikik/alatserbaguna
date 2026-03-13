/// <reference lib="webworker" />

/**
 * Audio Watermark Worker — Pure Web Audio API (no FFmpeg needed).
 *
 * Embed: encode watermarkText as UTF-8 bits → modify LSBs of PCM samples
 *        at predetermined positions (deterministic key derived from text length).
 * Detect: read same positions → decode bits → reconstruct text.
 * Then export as WAV via manual PCM encoder.
 */

function textToBits(text: string): number[] {
  const utf8 = new TextEncoder().encode(text);
  const bits: number[] = [];
  // Prepend 16-bit length header
  const len = utf8.length;
  for (let i = 15; i >= 0; i--) bits.push((len >> i) & 1);
  for (const byte of utf8) {
    for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
  }
  return bits;
}

function bitsToText(bits: number[]): string | null {
  if (bits.length < 16) return null;
  let len = 0;
  for (let i = 0; i < 16; i++) len = (len << 1) | bits[i];
  if (len <= 0 || len > 128) return null;
  const textBits = bits.slice(16, 16 + len * 8);
  if (textBits.length < len * 8) return null;
  const bytes = new Uint8Array(len);
  for (let b = 0; b < len; b++) {
    let byte = 0;
    for (let i = 0; i < 8; i++) byte = (byte << 1) | (textBits[b * 8 + i] || 0);
    bytes[b] = byte;
  }
  try { return new TextDecoder().decode(bytes); } catch { return null; }
}

function writeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numSamples = samples.length;
  const buf = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buf);
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF'); view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeStr(36, 'data'); view.setUint32(40, numSamples * 2, true);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

self.onmessage = async (event: MessageEvent) => {
  const { file, format, mode, watermarkText, strength } = event.data as {
    file: File; format: string; mode: 'embed' | 'detect'; watermarkText: string; strength: number;
  };
  try {
    self.postMessage({ type: 'progress', value: 5 });

    const arrayBuffer = await file.arrayBuffer();
    const sampleRate = 44100;
    const audioCtx = new OfflineAudioContext(1, sampleRate * 0.1, sampleRate); // tiny: just for API
    const decoded = await new OfflineAudioContext(1, Math.max(1, Math.floor(sampleRate * file.size / 44100 / 2)), sampleRate).decodeAudioData(arrayBuffer.slice(0));
    const channelData = new Float32Array(decoded.getChannelData(0));

    self.postMessage({ type: 'progress', value: 30 });

    if (mode === 'embed') {
      const bits = textToBits(watermarkText);
      self.postMessage({ type: 'log', message: `Embedding ${bits.length} bits for "${watermarkText}"` });

      // Embed in every N-th sample (spread spectrum)
      const stride = Math.floor(channelData.length / bits.length);
      if (stride < 2) throw new Error('File too short for this watermark text.');

      for (let i = 0; i < bits.length; i++) {
        const pos = i * stride + 7; // +7 offset for robustness
        if (pos >= channelData.length) break;
        // Modify LSB: adjust sample by tiny imperceptible amount
        const quantized = Math.round(channelData[pos] * 32767);
        const modified = bits[i] === 1
          ? (quantized | 1)   // force LSB to 1
          : (quantized & ~1); // force LSB to 0
        channelData[pos] = modified / 32767;
      }

      self.postMessage({ type: 'progress', value: 80 });
      const wavBuf = writeWav(channelData, decoded.sampleRate);
      const blob = new Blob([wavBuf as any], { type: 'audio/wav' });
      self.postMessage({ type: 'complete', data: { blob, sizeMB: blob.size / 1024 / 1024, detectedText: null, confidence: null } });

    } else {
      // Detect mode
      const maxBits = (128 + 2) * 8 + 16; // max text + header
      const stride = Math.floor(channelData.length / maxBits);
      if (stride < 2) throw new Error('File too short for watermark detection.');

      const readBits: number[] = [];
      for (let i = 0; i < maxBits; i++) {
        const pos = i * stride + 7;
        if (pos >= channelData.length) break;
        const quantized = Math.round(channelData[pos] * 32767);
        readBits.push(quantized & 1);
      }

      self.postMessage({ type: 'progress', value: 80 });
      const detected = bitsToText(readBits);
      self.postMessage({ type: 'log', message: detected ? `Detected: "${detected}"` : 'No watermark found' });
      self.postMessage({ type: 'complete', data: { blob: null, sizeMB: null, detectedText: detected, confidence: detected ? 0.85 : 0.0 } });
    }
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message || 'Watermark failed', errorCode: 'ENCODE_FAILED' });
  }
};
