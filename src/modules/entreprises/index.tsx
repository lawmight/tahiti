import { useMemo } from 'react';
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
import type {
  EntrepriseAggregateRecord,
  EntreprisesDynamiquePayload,
} from '../../types/data';
import { getFormeJuridiqueLabel } from '../../utils/formeJuridique';
import { formatNumberFR, formatPercentFR, CLASSES_EFFECTIFS } from '../../utils/formatters';
import { getNafLabel, useNafLabels } from '../../utils/nafLookup';

function truncateLabel(label: string, limit = 34) {
  return label.length > limit ? `${label.slice(0, limit - 1)}…` : label;
}

export default function EntreprisesModule() {
  const communesQuery = useJsonData<EntrepriseAggregateRecord[]>('data/rnte-par-commune.json');
  const nafQuery = useJsonData<EntrepriseAggregateRecord[]>('data/rnte-par-naf.json');
  const fjurQuery = useJsonData<EntrepriseAggregateRecord[]>('data/rnte-par-fjur.json');
  const effectifQuery = useJsonData<EntrepriseAggregateRecord[]>('data/rnte-par-effectifs.json');
  const dynamiqueQuery = useJsonData<EntreprisesDynamiquePayload>('data/rnte-dynamique.json');
  const { isReady: nafReady, error: nafError } = useNafLabels();

  const isLoading =
    communesQuery.isLoading ||
    nafQuery.isLoading ||
    fjurQuery.isLoading ||
    effectifQuery.isLoading ||
    dynamiqueQuery.isLoading;

  const error =
    communesQuery.error ||
    nafQuery.error ||
    fjurQuery.error ||
    effectifQuery.error ||
    dynamiqueQuery.error;

  const derived = useMemo(() => {
    const communes = (communesQuery.data ?? []).slice(0, 10);
    const naf = (nafQuery.data ?? [])
      .slice(0, 12)
      .map((entry) => ({
        ...entry,
        code: entry.code ?? 'NC',
        label: getNafLabel(entry.code),
      }));
    const fjur = (fjurQuery.data ?? []).slice(0, 10).map((entry) => ({
      ...entry,
      code: entry.code ?? 'NC',
      label: getFormeJuridiqueLabel(entry.code),
    }));
    const effectifs = (effectifQuery.data ?? []).map((entry) => ({
      ...entry,
      code: entry.code ?? 'NC',
      label: CLASSES_EFFECTIFS[entry.code ?? ''] ?? `Classe ${entry.code ?? 'NC'}`,
    }));
    const dynamique = dynamiqueQuery.data?.repartitionAnnuelle ?? [];

    return {
      communes,
      naf,
      fjur,
      effectifs,
      dynamique,
      summary: dynamiqueQuery.data,
      firstCommune: communes[0] ?? null,
      firstNaf: naf[0] ?? null,
    };
  }, [
    communesQuery.data,
    dynamiqueQuery.data,
    effectifQuery.data,
    fjurQuery.data,
    nafQuery.data,
    nafReady,
  ]);

  if (isLoading) {
    return <LoadingSpinner message="Chargement du module Entreprises…" />;
  }

  if (error) {
    return (
      <section className="panel error-state">
        <h3>Impossible de charger les agrégats du RNTE</h3>
        <p>{error}</p>
      </section>
    );
  }

  if (!derived.summary || !derived.communes.length) {
    return <div className="empty-state panel">Les agrégats RNTE ne sont pas disponibles.</div>;
  }

  return (
    <article className="module-article">
      <header className="module-header">
        <h2>Entreprises et établissements (RNTE)</h2>
        <p>
          Lecture du registre des entreprises via des agrégats pré-calculés uniquement : aucun
          chargement brut des ~190 000 lignes n’est réalisé dans le navigateur.
        </p>
        <div className="tag-row">
          <span className="info-tag">Source : exportrte.xlsx</span>
          <span className="info-tag">Agrégats JSON uniquement</span>
          <span className="info-tag">Chargement différé sans parsing brut côté client</span>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard
          label="Établissements agrégés"
          value={formatNumberFR(derived.summary.totalEtablissements)}
          hint="Somme des établissements issus du RNTE."
          accent="blue"
        />
        <StatCard
          label="Part active"
          value={formatPercentFR(
            derived.summary.etablissementsActifs / derived.summary.totalEtablissements,
          )}
          hint={`${formatNumberFR(derived.summary.etablissementsActifs)} actifs`}
          accent="teal"
        />
        <StatCard
          label="Commune dominante"
          value={derived.firstCommune?.commune ?? '—'}
          hint={
            derived.firstCommune
              ? `${formatNumberFR(derived.firstCommune.total)} établissements`
              : '—'
          }
          accent="purple"
        />
        <StatCard
          label="Secteur NAF dominant"
          value={truncateLabel(derived.firstNaf?.label ?? '—', 26)}
          hint={
            derived.firstNaf
              ? `${derived.firstNaf.code} · ${formatNumberFR(derived.firstNaf.total)} établissements`
              : '—'
          }
          accent="amber"
        />
      </section>

      <div className="insight-grid">
        <ChartPanel
          title="Top communes"
          description="Les pôles communaux concentrant le plus d’établissements enregistrés."
          footer="Lecture établissement par établissement, et non entreprise consolidée."
        >
          <AutoSizedChart height={420}>
            {({ width, height }) => (
              <BarChart
                width={width}
                height={height}
                data={[...derived.communes].reverse()}
                layout="vertical"
                margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
                <XAxis type="number" tickFormatter={(value) => formatNumberFR(value)} stroke="#526476" />
                <YAxis
                  type="category"
                  dataKey="commune"
                  width={120}
                  tick={{ fill: '#102132', fontSize: 12 }}
                />
                <Tooltip formatter={(value) => formatNumberFR(value)} />
                <Bar dataKey="total" fill="#1f4ba9" radius={[0, 12, 12, 0]} />
              </BarChart>
            )}
          </AutoSizedChart>
        </ChartPanel>

        <ChartPanel
          title="Top secteurs NAF"
          description="Secteurs d’activité les plus représentés, avec libellé enrichi quand la nomenclature est chargée."
          footer={
            nafError
              ? `Libellés NAF indisponibles : ${nafError}`
              : nafReady
                ? 'Libellés issus de SocialGouv/codes-naf.'
                : 'Libellés NAF en cours de chargement.'
          }
        >
          <AutoSizedChart height={420}>
            {({ width, height }) => (
              <BarChart
                width={width}
                height={height}
                data={[...derived.naf].reverse()}
                layout="vertical"
                margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
                <XAxis type="number" tickFormatter={(value) => formatNumberFR(value)} stroke="#526476" />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={180}
                  tickFormatter={(value: string) => truncateLabel(value)}
                  tick={{ fill: '#102132', fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => formatNumberFR(value)}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload
                      ? `${payload[0].payload.code} — ${payload[0].payload.label}`
                      : ''
                  }
                />
                <Bar dataKey="total" fill="#0f9b8e" radius={[0, 12, 12, 0]} />
              </BarChart>
            )}
          </AutoSizedChart>
        </ChartPanel>
      </div>

      <div className="insight-grid">
        <ChartPanel
          title="Formes juridiques dominantes"
          description="Catégories les plus fréquentes, avec fallback robuste sur le code juridique."
        >
          <AutoSizedChart height={360}>
            {({ width, height }) => (
              <BarChart width={width} height={height} data={derived.fjur} margin={{ top: 8, right: 24, bottom: 40, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
                <XAxis
                  dataKey="code"
                  tickFormatter={(value) => String(value)}
                  stroke="#526476"
                />
                <YAxis tickFormatter={(value) => formatNumberFR(value)} stroke="#526476" />
                <Tooltip
                  formatter={(value) => formatNumberFR(value)}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload
                      ? `${payload[0].payload.code} — ${payload[0].payload.label}`
                      : ''
                  }
                />
                <Bar dataKey="total" fill="#7b51d9" radius={[10, 10, 0, 0]} />
              </BarChart>
            )}
          </AutoSizedChart>
        </ChartPanel>

        <ChartPanel
          title="Classes d’effectifs"
          description="Répartition des établissements selon la classe de taille déclarée."
          footer="Les libellés de classes sont centralisés dans un utilitaire partagé."
        >
          <AutoSizedChart height={360}>
            {({ width, height }) => (
              <BarChart width={width} height={height} data={derived.effectifs} margin={{ top: 8, right: 24, bottom: 48, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
                <XAxis
                  dataKey="label"
                  angle={-25}
                  textAnchor="end"
                  height={90}
                  interval={0}
                  tick={{ fill: '#526476', fontSize: 12 }}
                />
                <YAxis tickFormatter={(value) => formatNumberFR(value)} stroke="#526476" />
                <Tooltip formatter={(value) => formatNumberFR(value)} />
                <Bar dataKey="total" fill="#f59e0b" radius={[10, 10, 0, 0]} />
              </BarChart>
            )}
          </AutoSizedChart>
        </ChartPanel>
      </div>

      <ChartPanel
        title="Dynamique inscriptions / radiations"
        description="Lecture annuelle des flux d’entrées et de sorties du registre."
        footer="Le solde net est calculé comme inscriptions moins radiations."
      >
        <AutoSizedChart height={420}>
          {({ width, height }) => (
            <ComposedChart width={width} height={height} data={derived.dynamique} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e2f5" />
              <XAxis dataKey="annee" stroke="#526476" />
              <YAxis tickFormatter={(value) => formatNumberFR(value)} stroke="#526476" />
              <Tooltip formatter={(value) => formatNumberFR(value)} />
              <Bar dataKey="inscriptions" fill="#69a3ff" radius={[10, 10, 0, 0]} />
              <Bar dataKey="radiations" fill="#d9485f" radius={[10, 10, 0, 0]} />
              <Line type="monotone" dataKey="soldeNet" stroke="#2b8a3e" strokeWidth={3} dot={false} />
            </ComposedChart>
          )}
        </AutoSizedChart>
      </ChartPanel>

      <section className="details-grid">
        <div className="detail-card panel">
          <h4>Transformations appliquées</h4>
          <ul>
            <li>Agrégation hors navigateur par commune, secteur NAF, forme juridique et effectifs.</li>
            <li>Détermination du statut actif/radié à partir des dates de radiation ENT/ETAB.</li>
            <li>Reconstruction d’une dynamique annuelle inscriptions/radiations.</li>
          </ul>
        </div>
        <div className="detail-card panel">
          <h4>Limites connues</h4>
          <ul>
            <li>Le module ne propose pas encore de filtres croisés commune × NAF × statut.</li>
            <li>La lecture porte sur des établissements ; une entreprise multi-sites compte plusieurs fois.</li>
            <li>Les libellés juridiques couvrent les cas principaux et utilisent un fallback explicite pour le reste.</li>
          </ul>
        </div>
      </section>
    </article>
  );
}
