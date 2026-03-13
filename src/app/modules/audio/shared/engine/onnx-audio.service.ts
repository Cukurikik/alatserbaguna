import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OnnxAudioService {
  private sessions = new Map<string, any>();
  private downloadProgress = signal<number>(0);

  getDownloadProgress() { return this.downloadProgress.asReadonly(); }
  isModelLoaded(name: string) { return this.sessions.has(name); }

  async loadModel(modelName: string, modelUrl: string): Promise<any> {
    if (this.sessions.has(modelName)) return this.sessions.get(modelName);
    try {
      const ort = (window as any).ort;
      if (!ort) throw new Error('ONNX Runtime not loaded. Add onnxruntime-web to your HTML.');
      const resp = await fetch(modelUrl);
      if (!resp.ok) throw new Error('Model download failed: ' + resp.status);
      const total = Number(resp.headers.get('content-length') || 0);
      const reader = resp.body!.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.byteLength;
        if (total > 0) this.downloadProgress.set(Math.round(loaded / total * 100));
      }
      const modelData = new Uint8Array(loaded);
      let pos = 0;
      for (const chunk of chunks) { modelData.set(chunk, pos); pos += chunk.byteLength; }
      const session = await ort.InferenceSession.create(modelData);
      this.sessions.set(modelName, session);
      return session;
    } catch (e) {
      throw new Error('ONNX_LOAD_FAILED: ' + (e as Error).message);
    }
  }
}
