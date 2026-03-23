import { Suspense, useEffect, useMemo, useState } from 'react';

import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { TabBar } from './components/TabBar';
import { getModules } from './registry';

import './modules/imports/meta';
import './modules/tourisme-mensuel/meta';
import './modules/tourisme-pays/meta';
import './modules/trafic-aerien/meta';
import './modules/entreprises/meta';

export default function App() {
  const modules = useMemo(() => getModules(), []);
  const [activeId, setActiveId] = useState(modules[0]?.id ?? '');

  useEffect(() => {
    if (!modules.some((module) => module.id === activeId) && modules[0]) {
      setActiveId(modules[0].id);
    }
  }, [activeId, modules]);

  const activeModule = modules.find((module) => module.id === activeId) ?? modules[0];
  const ActiveComponent = activeModule?.component;

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-card">
          <h1>Explorateur de données de la Polynésie française</h1>
          <p>
            Prototype React monopage pour explorer les jeux statistiques ISPF sans backend :
            imports, tourisme mensuel, tourisme par pays, trafic aérien et registre des
            entreprises.
          </p>
          <div className="hero-pill-row">
            <span className="hero-pill">Interface 100 % en français</span>
            <span className="hero-pill">Architecture modulaire par onglets</span>
            <span className="hero-pill">Agrégats RNTE pré-calculés</span>
            <span className="hero-pill">Sources Excel converties à l’étape build</span>
          </div>
        </div>
      </section>

      <TabBar modules={modules} activeId={activeModule?.id ?? ''} onSelect={setActiveId} />

      {activeModule ? (
        <section className="module-container">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Module actif : {activeModule.label}</h3>
                <p>{activeModule.description}</p>
              </div>
              <span className="info-tag">Source principale : {activeModule.source}</span>
            </div>
          </div>

          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner message={`Chargement de l’onglet ${activeModule.label}…`} />}>
              <div
                role="tabpanel"
                id={`panel-${activeModule.id}`}
                aria-labelledby={`tab-${activeModule.id}`}
              >
                {ActiveComponent ? <ActiveComponent /> : null}
              </div>
            </Suspense>
          </ErrorBoundary>
        </section>
      ) : (
        <section className="panel empty-state">
          Aucun module n’est enregistré. Ajoutez un dossier de module puis enregistrez-le dans le
          registre central.
        </section>
      )}
    </main>
  );
}
