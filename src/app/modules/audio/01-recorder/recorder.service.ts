import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private stream: MediaStream | null = null;

  async requestStream(source: 'mic' | 'system' | 'both', deviceId: string | null): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: source === 'mic' ? { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: true, noiseSuppression: true } : true,
      video: source === 'system'
    };

    if (source === 'system') {
      this.stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
    } else {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    }

    this.audioContext = new AudioContext({ sampleRate: 48000 });
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;

    const sourceNode = this.audioContext.createMediaStreamSource(this.stream);
    sourceNode.connect(this.analyserNode);

    return this.stream;
  }

  startRecording(onDataAvailable: (blob: Blob) => void): void {
    if (!this.stream) throw new Error("Stream not initialized");
    
    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/webm'; 
    }

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        onDataAvailable(event.data);
      }
    };
    this.mediaRecorder.start(250);
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  pauseRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  calculateVULevel(): number {
    if (!this.analyserNode) return 0;
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const val = (data[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / data.length);
    return Math.min(1, rms * 5); // Scale up for visibility
  }

  cleanup(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.stream = null;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.analyserNode = null;
  }
}
