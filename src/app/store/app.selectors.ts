import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AppState } from './app.state';

export const selectAppState = createFeatureSelector<AppState>('app');

export const selectSidebar = createSelector(
  selectAppState,
  (state) => state.sidebar
);

export const selectSidebarCollapsed = createSelector(
  selectSidebar,
  (sidebar) => sidebar.collapsed
);

export const selectActiveRoute = createSelector(
  selectSidebar,
  (sidebar) => sidebar.activeRoute
);

export const selectSystem = createSelector(
  selectAppState,
  (state) => state.system
);

export const selectTasks = createSelector(
  selectAppState,
  (state) => state.tasks
);
