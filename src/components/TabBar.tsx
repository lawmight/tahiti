import type { AnalysisModule } from '../types/modules';

type TabBarProps = {
  modules: AnalysisModule[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function TabBar({ modules, activeId, onSelect }: TabBarProps) {
  return (
    <div className="tab-bar" role="tablist" aria-label="Onglets d'analyse">
      {modules.map((module) => {
        const isActive = module.id === activeId;
        return (
          <button
            key={module.id}
            className={`tab-button ${isActive ? 'is-active' : ''}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${module.id}`}
            id={`tab-${module.id}`}
            onClick={() => onSelect(module.id)}
            type="button"
          >
            <span className="tab-label">{module.label}</span>
            <span className="tab-source">{module.source}</span>
          </button>
        );
      })}
    </div>
  );
}
