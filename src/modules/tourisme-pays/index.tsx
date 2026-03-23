import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AutoSizedChart } from '../../components/AutoSizedChart';
import { ChartPanel } from '../../components/ChartPanel';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatCard } from '../../components/StatCard';
import { useJsonData } from '../../hooks/useJsonData';
import type { TourismePaysRecord } from '../../types/data';
import { formatDecimalFR, formatNumberFR } from '../../utils/formatters';

export default function TourismePaysModule() {
  const { data, error, isLoading } = useJsonData<TourismePaysRecord[]>('data/11207.json');
  const years = useMemo(
    () =>
      [...new Set((data ?? []).map((record) => record.annee))]
        .filter((year): year is number => Number.isFinite(year))
        .sort((left, right) => right - left),
    [data],
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    if (selectedYear === null && years.length > 0) {
      setSelectedYear(years[0]);
    }
  }, [selectedYear, years]);

  const derived = useMemo(() => {
    const records = data ?? [];
    const activeYear = selectedYear ?? years[0];
    const selectedRows = records.filter((record) => record.annee === activeYear);
    const countryRows = selectedRows.filter((record) => record.iso3);
    const regionalRows = selectedRows.filter((record) => !record.iso3);

    const top10 = [...countryRows]
      .sort((left, right) => right.nombreTouristes - left.nombreTouristes)
      .slice(0, 10);

    const averageStayLeaders = [...countryRows]
      .filter((record) => record.nombreTouristes >= 100)
      .sort((left, right) => right.dureeSejourMoyenne - left.dureeSejourMoyenne)
      .slice(0, 8);

    const totalTourists = countryRows.reduce((sum, record) => sum + record.nombreTouristes, 0);
    const totalCruisers = countryRows.reduce((sum, record) => sum + record.nombreCroisieristes, 0);

    return {
      activeYear,
      selectedRows,
      countryRows,
      regionalRows,
      top10,
      averageStayLeaders,
      totalTourists,
      totalCruisers,
      leader: top10[0] ?? null,
    };
  }, [data, selectedYear, years]);

  if (isLoading) {
    return <LoadingSpinner message="Chargement du module Tourisme par pays…" />;
  }

  if (error) {
    return (
      <section className="panel error-state">
        <h3>Impossible de charger les données annuelles par pays</h3>
        <p>{error}</p>
      </section>
    );
  }

  if (!data?.length || !derived.activeYear) {
    return <div className="empty-state panel">Aucune observation annuelle n’a été trouvée.</div>;
  }

  return (
    <article className="module-article">
      <header className="module-header">
        <h2>Tourisme annuel par pays d’origine</h2>
        <p>
          Vue annuelle pour identifier les principaux pays émetteurs, comparer touristes et
          croisiéristes et repérer les marchés à durée de séjour élevée.
        </p>
        <div className="module-select-row">
          <span className="info-tag">Source : 11207.xlsx</span>
          <span className="info-tag">48 pays / 8 régions</span>
          <label>
            <span className="muted">Année analysée</span>
            <br />
            <select
              className="select-input"
              value={derived.activeYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard
          label="Touristes observés"
          value={formatNumberFR(derived.totalTourists)}
          hint={`Pays avec code ISO3 renseigné en ${derived.activeYear}.`}
          accent="blue"
        />
        <StatCard
          label="Croisiéristes observés"
          value={formatNumberFR(derived.totalCruisers)}
          hint="Sous-ensemble utile pour comparer la composition des flux."
          accent="teal"
        />
        <StatCard
          label="Premier marché"
          value={derived.leader?.pays ?? '—'}
          hint={
            derived.leader
              ? `${formatNumberFR(derived.leader.nombreTouristes)} touristes`
              : '—'
          }
          accent="purple"
        />
        <StatCard
          label="Durée moyenne des séjours"
          value={formatDecimalFR(
            derived.countryRows.reduce((sum, record) => sum + record.dureeSejourMoyenne, 0) /
              Math.max(derived.countryRows.length, 1),
            1,
          )}
          hint="Moyenne simple sur les pays renseignés."
          accent="amber"
        />
      </section>

      <div className="insight-grid">
        <ChartPanel
          title={`Top 10 des pays en ${derived.activeYear}`}
          description="Classement des marchés les plus contributeurs en nombre de touristes."
          footer="Les lignes agrégées sans code ISO3 sont volontairement exclues de ce classement pays."
        >
          <AutoSizedChart height={420}>
            {({ width, height }) => (
              <BarChart
                width={width}
                height={height}
                data={[...derived.top10].reverse()}
                layout="vertical"
                margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
                <XAxis type="number" tickFormatter={(value) => formatNumberFR(value)} stroke="#526476" />
                <YAxis
                  type="category"
                  dataKey="pays"
                  width={140}
                  tick={{ fill: '#102132', fontSize: 12 }}
                />
                <Tooltip formatter={(value) => formatNumberFR(value)} />
                <Bar dataKey="nombreTouristes" fill="#1f4ba9" radius={[0, 12, 12, 0]} />
              </BarChart>
            )}
          </AutoSizedChart>
        </ChartPanel>

        <ChartPanel
          title="Touristes versus croisiéristes"
          description="Comparaison sur les 10 premiers marchés afin de distinguer les pays plutôt terrestres ou croisière."
        >
          <AutoSizedChart height={420}>
            {({ width, height }) => (
              <ComposedChart width={width} height={height} data={derived.top10} margin={{ top: 12, right: 24, bottom: 48, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
                <XAxis
                  dataKey="pays"
                  angle={-25}
                  height={80}
                  interval={0}
                  textAnchor="end"
                  tick={{ fill: '#526476', fontSize: 12 }}
                />
                <YAxis yAxisId="volume" tickFormatter={(value) => formatNumberFR(value)} stroke="#526476" />
                <YAxis
                  yAxisId="duree"
                  orientation="right"
                  tickFormatter={(value) => `${formatDecimalFR(value, 1)} j`}
                  stroke="#7b51d9"
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'dureeSejourMoyenne'
                      ? `${formatDecimalFR(value, 1)} jours`
                      : formatNumberFR(value)
                  }
                />
                <Bar yAxisId="volume" dataKey="nombreTouristes" fill="#69a3ff" radius={[10, 10, 0, 0]} />
                <Bar yAxisId="volume" dataKey="nombreCroisieristes" fill="#0f9b8e" radius={[10, 10, 0, 0]} />
                <Line
                  yAxisId="duree"
                  type="monotone"
                  dataKey="dureeSejourMoyenne"
                  stroke="#7b51d9"
                  strokeWidth={3}
                />
              </ComposedChart>
            )}
          </AutoSizedChart>
        </ChartPanel>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Marchés à durée de séjour élevée</h3>
            <p>
              Pays avec au moins 100 touristes observés, triés par durée moyenne décroissante.
            </p>
          </div>
        </div>
        <div className="table-like-list">
          {derived.averageStayLeaders.map((record) => (
            <div key={record.iso3 ?? `${record.pays}-${record.region}`} className="table-row">
              <div>
                <strong>{record.pays}</strong>
                <span className="muted">{record.region}</span>
              </div>
              <span>{formatNumberFR(record.nombreTouristes)} touristes</span>
              <span>{formatDecimalFR(record.dureeSejourMoyenne, 1)} jours</span>
            </div>
          ))}
        </div>
        <p className="list-note">
          Les agrégats régionaux sans code ISO3 restent disponibles pour le contexte mais ne sont
          pas utilisés comme « pays » dans les classements.
        </p>
      </section>

      <section className="details-grid">
        <div className="detail-card panel">
          <h4>Transformations appliquées</h4>
          <ul>
            <li>Filtrage des agrégats régionaux (`ISO3 = null`) pour les classements pays.</li>
            <li>Sélecteur d’année pilotant l’ensemble des graphiques.</li>
            <li>Liste complémentaire des marchés à séjour long pour enrichir la lecture du top volume.</li>
          </ul>
        </div>
        <div className="detail-card panel">
          <h4>Limites connues</h4>
          <ul>
            <li>Le module privilégie la lecture par volume et ne détaille pas encore les nuitées par pays.</li>
            <li>La courbe de durée moyenne partage l’échelle des effectifs ; elle sert surtout de repère visuel.</li>
          </ul>
        </div>
      </section>
    </article>
  );
}
