import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AutoSizedChart } from '../../components/AutoSizedChart';
import { ChartPanel } from '../../components/ChartPanel';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatCard } from '../../components/StatCard';
import { useJsonData } from '../../hooks/useJsonData';
import type { ImportsRecord } from '../../types/data';
import { formatDecimalFR, formatNumberFR, formatPercentFR, formatXPF } from '../../utils/formatters';

function renderError(message: string) {
  return (
    <section className="panel error-state">
      <h3>Impossible de charger les imports commerciaux</h3>
      <p>{message}</p>
    </section>
  );
}

export default function ImportsModule() {
  const { data, error, isLoading } = useJsonData<ImportsRecord[]>('data/10202.json');

  const metrics = useMemo(() => {
    const records = data ?? [];
    const sorted = [...records].sort((left, right) => right.valeurImports - left.valeurImports);
    const totalValue = sorted.reduce((sum, record) => sum + record.valeurImports, 0);
    const totalWeight = sorted.reduce((sum, record) => sum + record.poidsImports, 0);
    const top15 = sorted.slice(0, 15);
    let cumulative = 0;
    const pareto = top15.map((record) => {
      cumulative += record.valeurImports;
      return {
        ...record,
        cumulativeShare: cumulative / totalValue,
      };
    });

    return {
      totalValue,
      totalWeight,
      top15,
      pareto,
      leader: sorted[0] ?? null,
      records,
    };
  }, [data]);

  if (isLoading) {
    return <LoadingSpinner message="Chargement du module Imports…" />;
  }

  if (error) {
    return renderError(error);
  }

  if (!data?.length) {
    return <div className="empty-state panel">Aucune donnée import n’a été trouvée.</div>;
  }

  return (
    <article className="module-article">
      <header className="module-header">
        <h2>Imports commerciaux par pays</h2>
        <p>
          Lecture concentrée sur la hiérarchie des partenaires commerciaux en 2023, leur poids
          relatif et un proxy de valeur unitaire via le rapport valeur / poids.
        </p>
        <div className="tag-row">
          <span className="info-tag">Source : 10202.xlsx</span>
          <span className="info-tag">131 partenaires</span>
          <span className="info-tag">Année unique : 2023</span>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard
          label="Valeur totale importée"
          value={formatXPF(metrics.totalValue)}
          hint="Somme des importations par pays."
          accent="blue"
        />
        <StatCard
          label="Poids total importé"
          value={`${formatNumberFR(metrics.totalWeight)} kg`}
          hint="Volume physique agrégé déclaré."
          accent="teal"
        />
        <StatCard
          label="Premier partenaire"
          value={metrics.leader?.pays ?? '—'}
          hint={
            metrics.leader
              ? `${formatXPF(metrics.leader.valeurImports)} · ${formatPercentFR(
                  metrics.leader.valeurImports / metrics.totalValue,
                )} du total`
              : '—'
          }
          accent="purple"
        />
        <StatCard
          label="Couverture du top 15"
          value={formatPercentFR(
            metrics.top15.reduce((sum, record) => sum + record.valeurImports, 0) /
              metrics.totalValue,
          )}
          hint="Indique la concentration des imports."
          accent="amber"
        />
      </section>

      <div className="insight-grid">
        <ChartPanel
          title="Top 15 des partenaires par valeur"
          description="Classement des pays selon la valeur importée déclarée en francs CFP."
          footer="Lecture recommandée : les premiers pays captent une large majorité de la valeur totale."
        >
          <AutoSizedChart height={420}>
            {({ width, height }) => (
              <BarChart
                width={width}
                height={height}
                data={[...metrics.top15].reverse()}
                layout="vertical"
                margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatXPF(value)}
                  stroke="#526476"
                />
                <YAxis
                  type="category"
                  dataKey="pays"
                  width={120}
                  tick={{ fill: '#102132', fontSize: 12 }}
                />
                <Tooltip formatter={(value) => formatXPF(value)} />
                <Bar dataKey="valeurImports" fill="#1f4ba9" radius={[0, 12, 12, 0]} />
              </BarChart>
            )}
          </AutoSizedChart>
        </ChartPanel>

        <ChartPanel
          title="Courbe de Pareto"
          description="Barres = valeur importée, ligne = contribution cumulée du top 15."
          footer="Permet d’identifier rapidement combien de partenaires expliquent l’essentiel du montant importé."
        >
          <AutoSizedChart height={420}>
            {({ width, height }) => (
              <ComposedChart
                width={width}
                height={height}
                data={metrics.pareto}
                margin={{ top: 12, right: 24, left: 8, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
                <XAxis
                  dataKey="pays"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={90}
                  tick={{ fill: '#526476', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="value"
                  tickFormatter={(value) => formatXPF(value)}
                  stroke="#526476"
                />
                <YAxis
                  yAxisId="share"
                  orientation="right"
                  domain={[0, 1]}
                  tickFormatter={(value) => formatPercentFR(value)}
                  stroke="#7b51d9"
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'cumulativeShare'
                      ? formatPercentFR(value)
                      : formatXPF(value)
                  }
                />
                <Bar yAxisId="value" dataKey="valeurImports" fill="#69a3ff" radius={[10, 10, 0, 0]} />
                <Line
                  yAxisId="share"
                  type="monotone"
                  dataKey="cumulativeShare"
                  stroke="#7b51d9"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            )}
          </AutoSizedChart>
        </ChartPanel>
      </div>

      <ChartPanel
        title="Poids importé versus valeur déclarée"
        description="Chaque point représente un pays ; la comparaison met en évidence les partenaires à forte valeur unitaire."
        footer="Le ratio valeur / kg ne remplace pas un prix réel : il s’agit d’un proxy utile pour repérer les paniers à forte intensité de valeur."
      >
        <AutoSizedChart height={420}>
          {({ width, height }) => (
            <ScatterChart width={width} height={height} margin={{ top: 16, right: 24, bottom: 16, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
              <XAxis
                type="number"
                dataKey="poidsImports"
                name="Poids"
                tickFormatter={(value) => formatNumberFR(value)}
                stroke="#526476"
              />
              <YAxis
                type="number"
                dataKey="valeurImports"
                name="Valeur"
                tickFormatter={(value) => formatXPF(value)}
                stroke="#526476"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, name) =>
                  name === 'valeurImports'
                    ? formatXPF(value)
                    : name === 'poidsImports'
                      ? `${formatNumberFR(value)} kg`
                      : formatDecimalFR(value)
                }
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.pays ? `Pays : ${payload[0].payload.pays}` : ''
                }
              />
              <Scatter data={metrics.records} fill="#0f9b8e" />
            </ScatterChart>
          )}
        </AutoSizedChart>
      </ChartPanel>

      <section className="details-grid">
        <div className="detail-card panel">
          <h4>Transformations appliquées</h4>
          <ul>
            <li>Tri décroissant par valeur importée.</li>
            <li>Calcul du cumul de Pareto sur le top 15.</li>
            <li>Construction d’un ratio valeur / kilogramme pour comparer les profils pays.</li>
          </ul>
        </div>
        <div className="detail-card panel">
          <h4>Hypothèses et limites</h4>
          <ul>
            <li>Les montants sont exprimés en XPF et non corrigés de l’inflation.</li>
            <li>Le ratio par kg est un indicateur de structure, pas un prix unitaire officiel.</li>
            <li>Le fichier couvre uniquement 2023 : pas de comparaison pluriannuelle ici.</li>
          </ul>
        </div>
      </section>
    </article>
  );
}
