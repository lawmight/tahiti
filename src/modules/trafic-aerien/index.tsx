import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AutoSizedChart } from '../../components/AutoSizedChart';
import { ChartPanel } from '../../components/ChartPanel';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatCard } from '../../components/StatCard';
import { useJsonData } from '../../hooks/useJsonData';
import type { TraficAerienRecord } from '../../types/data';
import { formatDateFR, isoDateToDate } from '../../utils/dateUtils';
import { formatNumberFR, formatPercentFR } from '../../utils/formatters';

export default function TraficAerienModule() {
  const { data, error, isLoading } = useJsonData<TraficAerienRecord[]>('data/11801.json');

  const derived = useMemo(() => {
    const records = (data ?? [])
      .map((record) => ({
        ...record,
        date: isoDateToDate(record.mois),
        label: formatDateFR(isoDateToDate(record.mois), 'month-year'),
      }))
      .filter((record) => record.date)
      .sort((left, right) => left.date!.getTime() - right.date!.getTime());

    const lastPoint = records[records.length - 1];
    const peakPassengers = [...records].sort((left, right) => right.passagersTotal - left.passagersTotal)[0];
    const covidTrough = records
      .filter((record) => {
        const year = record.date!.getUTCFullYear();
        return year >= 2020 && year <= 2022;
      })
      .sort((left, right) => left.passagersTotal - right.passagersTotal)[0];

    return {
      records,
      lastPoint,
      peakPassengers,
      covidTrough,
    };
  }, [data]);

  if (isLoading) {
    return <LoadingSpinner message="Chargement du module Trafic aérien…" />;
  }

  if (error) {
    return (
      <section className="panel error-state">
        <h3>Impossible de charger le trafic aérien</h3>
        <p>{error}</p>
      </section>
    );
  }

  if (!data?.length) {
    return <div className="empty-state panel">Aucune observation de trafic aérien n’a été trouvée.</div>;
  }

  return (
    <article className="module-article">
      <header className="module-header">
        <h2>Trafic aérien international mensuel</h2>
        <p>
          Série longue couvrant près de quarante ans pour visualiser l’essor du trafic, la rupture
          COVID, la reprise récente et l’équilibre entre fret, sièges offerts et remplissage.
        </p>
        <div className="tag-row">
          <span className="info-tag">Source : 11801.xlsx</span>
          <span className="info-tag">1987 → 2025</span>
          <span className="info-tag">468 observations mensuelles</span>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard
          label="Dernier mois observé"
          value={derived.lastPoint?.label ?? '—'}
          hint={
            derived.lastPoint
              ? `${formatNumberFR(derived.lastPoint.passagersTotal)} passagers`
              : '—'
          }
          accent="blue"
        />
        <StatCard
          label="Pic historique"
          value={derived.peakPassengers?.label ?? '—'}
          hint={
            derived.peakPassengers
              ? `${formatNumberFR(derived.peakPassengers.passagersTotal)} passagers`
              : '—'
          }
          accent="teal"
        />
        <StatCard
          label="Creux COVID"
          value={derived.covidTrough?.label ?? '—'}
          hint={
            derived.covidTrough
              ? `${formatNumberFR(derived.covidTrough.passagersTotal)} passagers`
              : '—'
          }
          accent="purple"
        />
        <StatCard
          label="Taux de remplissage récent"
          value={formatPercentFR(derived.lastPoint?.coefficientRemplissage ?? 0)}
          hint="Coefficient moyen de remplissage international."
          accent="amber"
        />
      </section>

      <ChartPanel
        title="Passagers internationaux sur longue période"
        description="Lecture de la dynamique structurelle du trafic, avec rupture COVID visible à l’œil nu."
        footer="La série couvre l’ensemble des arrivées et départs internationaux mensuels."
      >
        <AutoSizedChart height={420}>
          {({ width, height }) => (
            <LineChart width={width} height={height} data={derived.records} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
              <XAxis dataKey="label" minTickGap={30} stroke="#526476" />
              <YAxis tickFormatter={(value) => formatNumberFR(value)} stroke="#526476" />
              <Tooltip formatter={(value) => formatNumberFR(value)} />
              <Line type="monotone" dataKey="passagersTotal" stroke="#1f4ba9" strokeWidth={2.5} dot={false} />
            </LineChart>
          )}
        </AutoSizedChart>
      </ChartPanel>

      <div className="insight-grid">
        <ChartPanel
          title="Remplissage vs sièges offerts"
          description="Double lecture : capacité mise sur le marché et efficacité d’occupation."
        >
          <AutoSizedChart height={420}>
            {({ width, height }) => (
              <ComposedChart width={width} height={height} data={derived.records} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
                <XAxis dataKey="label" minTickGap={30} stroke="#526476" />
                <YAxis
                  yAxisId="volume"
                  tickFormatter={(value) => formatNumberFR(value)}
                  stroke="#526476"
                />
                <YAxis
                  yAxisId="ratio"
                  orientation="right"
                  domain={[0, 1]}
                  tickFormatter={(value) => formatPercentFR(value)}
                  stroke="#7b51d9"
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'coefficientRemplissage'
                      ? formatPercentFR(value)
                      : formatNumberFR(value)
                  }
                />
                <Area
                  yAxisId="volume"
                  type="monotone"
                  dataKey="siegesOfferts"
                  fill="#d9e2f5"
                  stroke="#69a3ff"
                  fillOpacity={0.8}
                />
                <Line
                  yAxisId="ratio"
                  type="monotone"
                  dataKey="coefficientRemplissage"
                  stroke="#7b51d9"
                  strokeWidth={3}
                  dot={false}
                />
              </ComposedChart>
            )}
          </AutoSizedChart>
        </ChartPanel>

        <ChartPanel
          title="Fret embarqué vs débarqué"
          description="Comparaison des volumes mensuels de fret pour repérer les déséquilibres logistiques."
          footer="Les chiffres sont exprimés en tonnes."
        >
          <AutoSizedChart height={420}>
            {({ width, height }) => (
              <AreaChart width={width} height={height} data={derived.records} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
                <XAxis dataKey="label" minTickGap={30} stroke="#526476" />
                <YAxis tickFormatter={(value) => formatNumberFR(value)} stroke="#526476" />
                <Tooltip formatter={(value) => `${formatNumberFR(value)} t`} />
                <Area
                  type="monotone"
                  dataKey="fretDebarque"
                  stackId="fret"
                  stroke="#0f9b8e"
                  fill="#0f9b8e"
                  fillOpacity={0.75}
                />
                <Area
                  type="monotone"
                  dataKey="fretEmbarque"
                  stackId="fret"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.75}
                />
              </AreaChart>
            )}
          </AutoSizedChart>
        </ChartPanel>
      </div>

      <section className="details-grid">
        <div className="detail-card panel">
          <h4>Transformations appliquées</h4>
          <ul>
            <li>Reconstruction d’une série temporelle mensuelle triée à partir des dates converties.</li>
            <li>Repérage d’un creux COVID sur la fenêtre 2020–2022.</li>
            <li>Lecture croisée de la capacité offerte et du taux de remplissage.</li>
          </ul>
        </div>
        <div className="detail-card panel">
          <h4>Limites connues</h4>
          <ul>
            <li>Le module ne sépare pas encore les compagnies ou les lignes aériennes.</li>
            <li>Le fret est lu en niveau ; aucune correction saisonnière n’est appliquée.</li>
          </ul>
        </div>
      </section>
    </article>
  );
}
