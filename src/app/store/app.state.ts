import { createAction, createReducer, on, props } from '@ngrx/store';

export interface Task {
  id: string;
  name: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  toolId: string;
  inputFiles: { name: string; size: number; type: string }[];
  createdAt: Date;
}

export interface AppState {
  sidebar: {
    collapsed: boolean;
    activeRoute: string;
  };
  system: {
    ffmpegLoaded: boolean;
    onnxLoaded: boolean;
    opfsAvailable: boolean;
    networkStatus: 'online' | 'offline';
    memoryUsage: number;
  };
  tasks: {
    active: Task[];
    history: Task[];
    totalCompleted: number;
  };
}

export const initialAppState: AppState = {
  sidebar: {
    collapsed: false,
    activeRoute: '/',
  },
  system: {
    ffmpegLoaded: false,
    onnxLoaded: false,
    opfsAvailable: true,
    networkStatus: 'online',
    memoryUsage: 0,
  },
  tasks: {
    active: [] as Task[],
    history: [] as Task[],
    totalCompleted: 0,
  },
};

export const toggleSidebar = createAction('[Sidebar] Toggle Collapse');
export const setSidebarCollapsed = createAction('[Sidebar] Set Collapsed', props<{ collapsed: boolean }>());
export const setActiveRoute = createAction('[Sidebar] Set Active Route', props<{ route: string }>());

export const setSystemStatus = createAction('[System] Set Status', props<{ 
  ffmpegLoaded?: boolean;
  onnxLoaded?: boolean;
  opfsAvailable?: boolean;
  networkStatus?: 'online' | 'offline';
  memoryUsage?: number;
}>());

export const appReducer = createReducer(
  initialAppState,
  on(toggleSidebar, (state) => ({
    ...state,
    sidebar: { ...state.sidebar, collapsed: !state.sidebar.collapsed }
  })),
  on(setSidebarCollapsed, (state, { collapsed }) => ({
    ...state,
    sidebar: { ...state.sidebar, collapsed }
  })),
  on(setActiveRoute, (state, { route }) => ({
    ...state,
    sidebar: { ...state.sidebar, activeRoute: route }
  })),
  on(setSystemStatus, (state, updates) => ({
    ...state,
    system: { ...state.system, ...updates }
  }))
);
