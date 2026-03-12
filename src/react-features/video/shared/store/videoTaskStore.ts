import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Dummy storage for SSR
const dummyStorage: Storage = {
  getItem: () => null,
  setItem: () => { /* noop */ },
  removeItem: () => { /* noop */ },
  clear: () => { /* noop */ },
  key: () => null,
  length: 0,
};

export interface VideoTask {
// ... (rest of the interface)
  id: string;
  name: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  toolId: string;
  inputFiles: { name: string; size: number; type: string }[];
  createdAt: number;
  outputUrl?: string;
  outputFile?: File;
  error?: string;
}

interface VideoTaskState {
  tasks: Record<string, VideoTask>;
  history: VideoTask[];
  currentTask: VideoTask | null;
  ffmpegReady: boolean;
  setFFmpegReady: (ready: boolean) => void;
  addTask: (task: VideoTask) => void;
  startTask: (task: VideoTask) => void;
  updateProgress: (id: string, progress: number) => void;
  completeTask: (id: string, outputUrl: string, outputFile?: File) => void;
  failTask: (id: string, error: string) => void;
  updateTask: (id: string, updates: Partial<VideoTask>) => void;
  removeTask: (id: string) => void;
  clearHistory: () => void;
}

export const useVideoTaskStore = create<VideoTaskState>()(
  persist(
    (set) => ({
      tasks: {},
      history: [],
      currentTask: null,
      ffmpegReady: false,
      setFFmpegReady: (ready) => set({ ffmpegReady: ready }),
      addTask: (task) => set((state) => ({
        tasks: { ...state.tasks, [task.id]: task },
        history: [task, ...state.history].slice(0, 50)
      })),
      startTask: (task) => set((state) => ({
        currentTask: task,
        tasks: { ...state.tasks, [task.id]: { ...task, status: 'processing' } },
        history: [task, ...state.history].slice(0, 50)
      })),
      updateProgress: (id, progress) => set((state) => {
        const task = state.tasks[id];
        if (!task) return state;
        const updatedTask = { ...task, progress };
        return {
          tasks: { ...state.tasks, [id]: updatedTask },
          history: state.history.map(t => t.id === id ? updatedTask : t),
          currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask
        };
      }),
      completeTask: (id, outputUrl, outputFile) => set((state) => {
        const task = state.tasks[id];
        if (!task) return state;
        const updatedTask: VideoTask = { ...task, status: 'success', progress: 100, outputUrl, outputFile };
        return {
          tasks: { ...state.tasks, [id]: updatedTask },
          history: state.history.map(t => t.id === id ? updatedTask : t),
          currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask
        };
      }),
      failTask: (id, error) => set((state) => {
        const task = state.tasks[id];
        if (!task) return state;
        const updatedTask: VideoTask = { ...task, status: 'error', error };
        return {
          tasks: { ...state.tasks, [id]: updatedTask },
          history: state.history.map(t => t.id === id ? updatedTask : t),
          currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask
        };
      }),
      updateTask: (id, updates) => set((state) => {
        const task = state.tasks[id];
        if (!task) return state;
        const updatedTask = { ...task, ...updates };
        return {
          tasks: { ...state.tasks, [id]: updatedTask },
          history: state.history.map(t => t.id === id ? updatedTask : t),
          currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask
        };
      }),
      removeTask: (id) => set((state) => {
        const remainingTasks = { ...state.tasks };
        delete remainingTasks[id];
        return {
          tasks: remainingTasks,
          history: state.history.filter(t => t.id !== id)
        };
      }),
      clearHistory: () => set({ history: [], tasks: {} })
    }),
    {
      name: 'video-task-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : dummyStorage)),
    }
  )
);
