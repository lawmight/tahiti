import type { AnalysisModule } from './types/modules';

const moduleRegistry = new Map<string, AnalysisModule>();

export function registerModule(module: AnalysisModule) {
  moduleRegistry.set(module.id, module);
}

export function getModules() {
  return [...moduleRegistry.values()].sort((left, right) => left.order - right.order);
}
