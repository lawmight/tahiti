import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
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
import type { TourismeMensuelRecord } from '../../types/data';
import { formatDateFR, isoDateToDate } from '../../utils/dateUtils';
import { formatDecimalFR, formatNumberFR, formatPercentFR } from '../../utils/formatters';

const REGION_COLORS = ['#1f4ba9', '#0f9b8e', '#7b51d9', '#f59e0b', '#d9485f', '#25a1db', '#2b8a3e', '#6f42c1'];
const MONTH_LABELS = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];

function getHeatmapColor(value: number, maxValue: number) {
  const intensity = maxValue > 0 ? value / maxValue : 0;
  return `rgba(31, 75, 169, ${0.12 + intensity * 0.88})`;
}

export default function TourismeMensuelModule() {
  const { data, error, isLoading } = useJsonData<TourismeMensuelRecord[]>('data/11201.json');

  const derived = useMemo(() => {
    const records = (data ?? [])
      .map((record) => ({
        ...record,
        date: isoDateToDate(record.mois),
      }))
      .filter((record) => record.date)
      .sort((left, right) => left.date!.getTime() - right.date!.getTime());

    const regions = [...new Set(records.map((record) => record.region))];
    const monthlyMap = new Map<
      string,
      Record<string, string | number>
    >();

    for (const record of records) {
      const date = record.date!;
      const key = record.mois;
      const current =
        monthlyMap.get(key) ??
        ({
          mois: record.mois,
          label: formatDateFR(date, 'month-year'),
          total: 0,
          annee: date.getUTCFullYear(),
          moisIndex: date.getUTCMonth(),
        } as Record<string, string | number>);

      current[record.region] = record.nombreTouristes;
      current.total = Number(current.total) + record.nombreTouristes;
      monthlyMap.set(key, current);
    }

    const monthlySeries = [...monthlyMap.values()];
    const shareSeries = monthlySeries.map((entry) => {
      const total = Number(entry.total) || 1;
      const shareEntry: Record<string, string | number> = {
        mois: entry.mois,
        label: entry.label,
      };

      regions.forEach((region) => {
        shareEntry[region] = Number(entry[region] ?? 0) / total;
      });

      return shareEntry;
    });

    const totalsByYearMonth = monthlySeries.map((entry) => ({
      annee: Number(entry.annee),
      moisIndex: Number(entry.moisIndex),
      total: Number(entry.total),
    }));

    const heatmapMax = Math.max(...totalsByYearMonth.map((entry) => entry.total), 0);
    const heatmapYears = [...new Set(totalsByYearMonth.map((entry) => entry.annee))].map((annee) => ({
      annee,
      months: Array.from({ length: 12 }, (_, monthIndex) => {
        const match = totalsByYearMonth.find(
          (entry) => entry.annee === annee && entry.moisIndex === monthIndex,
        );
        return match?.total ?? 0;
      }),
    }));

    const lastPoint = monthlySeries[monthlySeries.length - 1];
    const peakMonth = [...monthlySeries].sort(
      (left, right) => Number(right.total) - Number(left.total),
    )[0];

    return {
      records,
      regions,
      monthlySeries,
      shareSeries,
      heatmapYears,
      heatmapMax,
      lastPoint,
      peakMonth,
    };
  }, [data]);

  if (isLoading) {
    return <LoadingSpinner message="Chargement du module Tourisme mensuel…" />;
  }

  if (error) {
    return (
      <section className="panel error-state">
        <h3>Impossible de charger la série mensuelle du tourisme</h3>
        <p>{error}</p>
      </section>
    );
  }

  if (!data?.length) {
    return <div className="empty-state panel">Aucune observation mensuelle n’a été trouvée.</div>;
  }

  return (
    <article className="module-article">
      <header className="module-header">
        <h2>Tourisme mensuel par région d’origine</h2>
        <p>
          Série longue de janvier 2007 à décembre 2025 pour suivre les tendances, la saisonnalité
          et le poids relatif des régions d’origine des visiteurs.
        </p>
        <div className="tag-row">
          <span className="info-tag">Source : 11201.xlsx</span>
          <span className="info-tag">8 régions d’origine</span>
          <span className="info-tag">225 mois couverts</span>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard
          label="Dernier mois observé"
          value={String(derived.lastPoint?.label ?? '—')}
          hint={
            derived.lastPoint
              ? `${formatNumberFR(derived.lastPoint.total)} touristes au total`
              : '—'
          }
          accent="blue"
        />
        <StatCard
          label="Pic mensuel"
          value={
            derived.peakMonth?.label
              ? String(derived.peakMonth.label)
              : '—'
          }
          hint={
            derived.peakMonth
              ? `${formatNumberFR(derived.peakMonth.total)} touristes`
              : '—'
          }
          accent="teal"
        />
        <StatCard
          label="Régions suivies"
          value={formatNumberFR(derived.regions.length)}
          hint="Afrique, Amériques, Asie, Europe, Pacifique et Proche/Moyen-Orient."
          accent="purple"
        />
        <StatCard
          label="Durée moyenne de séjour"
          value={formatDecimalFR(
            data.reduce((sum, record) => sum + record.dureeSejourMoyenne, 0) / data.length,
            1,
          )}
          hint="Moyenne brute sur l’ensemble des régions et des mois."
          accent="amber"
        />
      </section>

      <ChartPanel
        title="Évolution des touristes par région"
        description="Lecture chronologique continue des volumes mensuels par région d’origine."
        footer="Le tri temporel est reconstruit à partir de dates Excel converties en UTC lors de la pré-conversion."
      >
        <AutoSizedChart height={420}>
          {({ width, height }) => (
            <LineChart width={width} height={height} data={derived.monthlySeries} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
              <XAxis dataKey="label" minTickGap={28} stroke="#526476" />
              <YAxis tickFormatter={(value) => formatNumberFR(value)} stroke="#526476" />
              <Tooltip formatter={(value) => formatNumberFR(value)} />
              <Legend />
              {derived.regions.map((region, index) => (
                <Line
                  key={region}
                  type="monotone"
                  dataKey={region}
                  stroke={REGION_COLORS[index % REGION_COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          )}
        </AutoSizedChart>
      </ChartPanel>

      <div className="insight-grid">
        <ChartPanel
          title="Part relative des régions dans le total mensuel"
          description="Vue empilée 100 % pour comparer les changements de structure plutôt que les niveaux absolus."
        >
          <AutoSizedChart height={420}>
            {({ width, height }) => (
              <AreaChart
                width={width}
                height={height}
                data={derived.shareSeries}
                stackOffset="expand"
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
                <XAxis dataKey="label" minTickGap={28} stroke="#526476" />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(value) => formatPercentFR(value)}
                  stroke="#526476"
                />
                <Tooltip formatter={(value) => formatPercentFR(value)} />
                <Legend />
                {derived.regions.map((region, index) => (
                  <Area
                    key={region}
                    type="monotone"
                    dataKey={region}
                    stackId="regions"
                    stroke={REGION_COLORS[index % REGION_COLORS.length]}
                    fill={REGION_COLORS[index % REGION_COLORS.length]}
                    fillOpacity={0.72}
                  />
                ))}
              </AreaChart>
            )}
          </AutoSizedChart>
        </ChartPanel>

        <ChartPanel
          title="Heatmap de saisonnalité"
          description="Mois en colonnes, années en lignes. Plus la cellule est foncée, plus le volume touristique est élevé."
          footer="Cette vue fait ressortir les pics de fréquentation et les creux saisonniers sur près de deux décennies."
        >
          <div className="heatmap-wrapper">
            <div className="heatmap">
              <div className="heatmap-header">
                <span className="heatmap-label">Année</span>
                {MONTH_LABELS.map((label) => (
                  <span key={label} className="heatmap-label">
                    {label}
                  </span>
                ))}
              </div>
              {derived.heatmapYears.map((row) => (
                <div key={row.annee} className="heatmap-row">
                  <span className="heatmap-year">{row.annee}</span>
                  {row.months.map((value, index) => (
                    <div
                      key={`${row.annee}-${index}`}
                      className="heatmap-cell"
                      style={{ background: getHeatmapColor(value, derived.heatmapMax) }}
                      title={`${MONTH_LABELS[index]} ${row.annee} : ${formatNumberFR(value)} touristes`}
                    >
                      {value > 0 ? formatNumberFR(value) : '—'}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </ChartPanel>
      </div>

      <section className="details-grid">
        <div className="detail-card panel">
          <h4>Transformations appliquées</h4>
          <ul>
            <li>Conversion centralisée des dates Excel vers des dates UTC.</li>
            <li>Regroupement mensuel toutes régions confondues pour la saisonnalité.</li>
            <li>Calcul des parts régionales mois par mois pour neutraliser les effets de niveau.</li>
          </ul>
        </div>
        <div className="detail-card panel">
          <h4>Limites connues</h4>
          <ul>
            <li>Les croisiéristes, nuitées et durées de séjour ne sont pas exhaustivement explorés dans les graphiques de base.</li>
            <li>La heatmap agrège le total mensuel ; elle ne remplace pas une lecture région par région.</li>
          </ul>
        </div>
      </section>
    </article>
  );
}
