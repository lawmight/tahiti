import type { ComponentType, LazyExoticComponent } from 'react';

export interface AnalysisModule {
  id: string;
  label: string;
  source: string;
  description: string;
  order: number;
  component: LazyExoticComponent<ComponentType>;
}
