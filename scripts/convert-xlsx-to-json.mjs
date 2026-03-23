import * as fs from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as XLSX from 'xlsx';

XLSX.set_fs(fs);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'public', 'data');

const DATASET_FILES = {
  imports: '10202.xlsx',
  tourismeMensuel: '11201.xlsx',
  tourismePays: '11207.xlsx',
  traficAerien: '11801.xlsx',
  entreprises: 'exportrte.xlsx',
};

const NAF_CODES_URL =
  'https://cdn.jsdelivr.net/npm/@socialgouv/codes-naf@1.1.1/index.json';

function excelSerialToIsoDate(serial) {
  if (serial === null || serial === undefined || serial === '') {
    return null;
  }

  const numeric = Number(serial);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const wholeDays = Math.floor(numeric);
  const baseTimestamp = Date.UTC(1899, 11, 30);
  const date = new Date(baseTimestamp + wholeDays * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : null;
}

function loadSheetRows(fileName) {
  const workbook = XLSX.readFile(path.join(rootDir, fileName), {
    dense: true,
    raw: true,
    cellDates: false,
  });
  const [firstSheetName] = workbook.SheetNames;
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: true,
    blankrows: false,
    defval: null,
  });
}

function rowsToObjects(rows) {
  const [headerRow, ...dataRows] = rows;
  return dataRows.map((row) =>
    Object.fromEntries(headerRow.map((header, index) => [header, row[index] ?? null])),
  );
}

function sortByDescendingTotal(collection) {
  return [...collection].sort((left, right) => right.total - left.total);
}

function round(value, digits = 4) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(digits));
}

async function writeJson(fileName, payload) {
  const targetPath = path.join(outputDir, fileName);
  await writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function ensureOutputDirectory() {
  await mkdir(outputDir, { recursive: true });
}

async function convertImports() {
  const rows = rowsToObjects(loadSheetRows(DATASET_FILES.imports));

  const normalized = rows.map((row) => ({
    annee: normalizeNumber(row['Année']),
    pays: normalizeString(row['Pays']),
    iso2: normalizeString(row['ISO2']),
    valeurImports: normalizeNumber(row['Valeur imports']) ?? 0,
    poidsImports: normalizeNumber(row['Poids imports']) ?? 0,
    valeurParKg:
      (normalizeNumber(row['Valeur imports']) ?? 0) /
      Math.max(normalizeNumber(row['Poids imports']) ?? 0, 1),
  }));

  await writeJson('10202.json', normalized);
}

async function convertTourismeMensuel() {
  const rows = rowsToObjects(loadSheetRows(DATASET_FILES.tourismeMensuel));

  const normalized = rows.map((row) => ({
    mois: excelSerialToIsoDate(row.Mois),
    region: normalizeString(row.Region),
    nombreTouristes: normalizeNumber(row['Nombre de touristes']) ?? 0,
    nombreCroisieristes: normalizeNumber(row['Nombre de croisièristes']) ?? 0,
    nuiteesTouristiques: normalizeNumber(row['Nuitées touristiques']) ?? 0,
    dureeSejourMoyenne: normalizeNumber(row['Durée de séjour moyenne']) ?? 0,
  }));

  await writeJson('11201.json', normalized);
}

async function convertTourismePays() {
  const rows = rowsToObjects(loadSheetRows(DATASET_FILES.tourismePays));

  const normalized = rows.map((row) => ({
    annee: normalizeNumber(row['Année']),
    region: normalizeString(row.Region),
    pays: normalizeString(row.Pays),
    iso3: normalizeString(row.ISO3),
    nombreTouristes: normalizeNumber(row['Nombre de touristes']) ?? 0,
    nombreCroisieristes: normalizeNumber(row['Nombre de croisièristes']) ?? 0,
    nuiteesTouristiques: normalizeNumber(row['Nuitées touristiques']) ?? 0,
    dureeSejourMoyenne: normalizeNumber(row['Durée de séjour moyenne']) ?? 0,
  }));

  await writeJson('11207.json', normalized);
}

async function convertTraficAerien() {
  const rows = rowsToObjects(loadSheetRows(DATASET_FILES.traficAerien));

  const normalized = rows.map((row) => ({
    mois: excelSerialToIsoDate(row.Mois),
    coefficientRemplissage: normalizeNumber(
      row['Coefficient moyen de remplissage du trafic total international (*)'],
    ),
    fretTotal: normalizeNumber(row['Fret (débarqué+embarqué)']) ?? 0,
    fretDebarque: normalizeNumber(row['Fret débarqué']) ?? 0,
    fretEmbarque: normalizeNumber(row['Fret embarqué']) ?? 0,
    mouvementsAvionsArrives: normalizeNumber(row["Mouvements d'avions arrivés"]) ?? 0,
    passagersTotal: normalizeNumber(row['Passagers (arrivées + départs)']) ?? 0,
    passagersArrives: normalizeNumber(row['Passagers arrivés']) ?? 0,
    passagersDeparts: normalizeNumber(row['Passagers départs']) ?? 0,
    passagersTransitDirect: normalizeNumber(row['Passagers en transit direct']) ?? 0,
    siegesOccupes: normalizeNumber(row['Sièges occupés (arrivées+départs)']) ?? 0,
    siegesOfferts: normalizeNumber(row['Sièges offerts (arrivées + départs)']) ?? 0,
    siegesOffertsArrivees: normalizeNumber(row['Sièges offerts arrivées']) ?? 0,
    siegesOffertsDeparts: normalizeNumber(row['Sièges offerts départs']) ?? 0,
  }));

  await writeJson('11801.json', normalized);
}

function updateAggregate(map, key, isActive) {
  const normalizedKey = key ?? 'Non renseigné';
  const current = map.get(normalizedKey) ?? { total: 0, actives: 0, radiees: 0 };
  current.total += 1;
  if (isActive) {
    current.actives += 1;
  } else {
    current.radiees += 1;
  }
  map.set(normalizedKey, current);
}

async function convertEntreprises() {
  const rows = loadSheetRows(DATASET_FILES.entreprises);
  const [headerRow, ...dataRows] = rows;
  const columnIndex = Object.fromEntries(
    headerRow.map((header, index) => [String(header), index]),
  );

  const communeStats = new Map();
  const nafStats = new Map();
  const fjurStats = new Map();
  const effectifStats = new Map();
  const inscriptionsParAnnee = new Map();
  const radiationsParAnnee = new Map();

  let totalRows = 0;
  let activeRows = 0;
  let radieeRows = 0;

  for (const row of dataRows) {
    totalRows += 1;

    const radEnt = row[columnIndex.Rad_ENT];
    const radEtab = row[columnIndex.Rad_ETAB];
    const isActive = !radEnt && !radEtab;

    if (isActive) {
      activeRows += 1;
    } else {
      radieeRows += 1;
    }

    updateAggregate(
      communeStats,
      normalizeString(row[columnIndex.Com_ETAB_libelle]),
      isActive,
    );

    const nafCode =
      normalizeString(row[columnIndex.NAF2008_ETAB]) ??
      normalizeString(row[columnIndex.NAF2008_ENT]);
    updateAggregate(nafStats, nafCode, isActive);

    updateAggregate(
      fjurStats,
      normalizeString(row[columnIndex.code_Fjur]),
      isActive,
    );

    const effectifCode = normalizeString(row[columnIndex.Classe_Effectifs]);
    updateAggregate(effectifStats, effectifCode, isActive);

    const inscriptionDate = excelSerialToIsoDate(row[columnIndex.Insc_ENT]);
    if (inscriptionDate) {
      const year = Number(inscriptionDate.slice(0, 4));
      inscriptionsParAnnee.set(year, (inscriptionsParAnnee.get(year) ?? 0) + 1);
    }

    const radiationDate =
      excelSerialToIsoDate(row[columnIndex.Rad_ETAB]) ??
      excelSerialToIsoDate(row[columnIndex.Rad_ENT]);
    if (radiationDate) {
      const year = Number(radiationDate.slice(0, 4));
      radiationsParAnnee.set(year, (radiationsParAnnee.get(year) ?? 0) + 1);
    }
  }

  const communePayload = sortByDescendingTotal(
    [...communeStats.entries()].map(([commune, stats]) => ({
      commune,
      ...stats,
      part: round(stats.total / totalRows),
    })),
  );

  const nafPayload = sortByDescendingTotal(
    [...nafStats.entries()].map(([code, stats]) => ({
      code,
      ...stats,
      part: round(stats.total / totalRows),
    })),
  );

  const fjurPayload = sortByDescendingTotal(
    [...fjurStats.entries()].map(([code, stats]) => ({
      code,
      ...stats,
      part: round(stats.total / totalRows),
    })),
  );

  const effectifPayload = sortByDescendingTotal(
    [...effectifStats.entries()].map(([code, stats]) => ({
      code,
      ...stats,
      part: round(stats.total / totalRows),
    })),
  );

  const years = new Set([
    ...inscriptionsParAnnee.keys(),
    ...radiationsParAnnee.keys(),
  ]);
  const dynamiquePayload = [...years]
    .sort((left, right) => left - right)
    .map((annee) => ({
      annee,
      inscriptions: inscriptionsParAnnee.get(annee) ?? 0,
      radiations: radiationsParAnnee.get(annee) ?? 0,
      soldeNet:
        (inscriptionsParAnnee.get(annee) ?? 0) -
        (radiationsParAnnee.get(annee) ?? 0),
    }));

  await writeJson('rnte-par-commune.json', communePayload);
  await writeJson('rnte-par-naf.json', nafPayload);
  await writeJson('rnte-par-fjur.json', fjurPayload);
  await writeJson('rnte-par-effectifs.json', effectifPayload);
  await writeJson('rnte-dynamique.json', {
    totalEtablissements: totalRows,
    etablissementsActifs: activeRows,
    etablissementsRadies: radieeRows,
    repartitionAnnuelle: dynamiquePayload,
  });
}

async function downloadNafCodes() {
  const response = await fetch(NAF_CODES_URL);
  if (!response.ok) {
    throw new Error(
      `Impossible de télécharger la nomenclature NAF (${response.status} ${response.statusText}).`,
    );
  }

  const payload = await response.json();
  const normalized = payload.map((entry) => ({
    id: normalizeString(entry.id),
    label: normalizeString(entry.label),
  }));
  await writeJson('naf-codes.json', normalized);
}

async function main() {
  await ensureOutputDirectory();

  console.log('Conversion des jeux de données Excel en JSON…');
  await convertImports();
  await convertTourismeMensuel();
  await convertTourismePays();
  await convertTraficAerien();
  await convertEntreprises();
  await downloadNafCodes();

  const classEffectifs = JSON.parse(
    await readFile(path.join(rootDir, 'data', 'classes-effectifs.json'), 'utf8'),
  );
  await writeJson('classes-effectifs.json', classEffectifs);

  console.log('Conversion terminée. Fichiers générés dans public/data/.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
