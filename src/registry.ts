import type { AnalysisModule } from './types/modules';

const moduleRegistry = new Map<string, AnalysisModule>();

export function registerModule(module: AnalysisModule) {
  if (moduleRegistry.has(module.id)) {
    throw new Error(
      `Module en double : l’identifiant « ${module.id} » est déjà enregistré. Chaque onglet doit avoir un id unique.`,
    );
  }
  moduleRegistry.set(module.id, module);
}

export function getModules() {
  return [...moduleRegistry.values()].sort((left, right) => left.order - right.order);
}
