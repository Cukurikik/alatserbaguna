export interface SceneDetectorOptions {
  threshold: number; // 0 to 100
}

export interface SceneChange {
  timestamp: number;
  frame: number;
}
