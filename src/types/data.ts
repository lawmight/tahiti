export interface ImportsRecord {
  annee: number;
  pays: string;
  iso2: string | null;
  valeurImports: number;
  poidsImports: number;
  valeurParKg: number;
}

export interface TourismeMensuelRecord {
  mois: string;
  region: string;
  nombreTouristes: number;
  nombreCroisieristes: number;
  nuiteesTouristiques: number;
  dureeSejourMoyenne: number;
}

export interface TourismePaysRecord {
  annee: number;
  region: string;
  pays: string;
  iso3: string | null;
  nombreTouristes: number;
  nombreCroisieristes: number;
  nuiteesTouristiques: number;
  dureeSejourMoyenne: number;
}

export interface TraficAerienRecord {
  mois: string;
  coefficientRemplissage: number | null;
  fretTotal: number;
  fretDebarque: number;
  fretEmbarque: number;
  mouvementsAvionsArrives: number;
  passagersTotal: number;
  passagersArrives: number;
  passagersDeparts: number;
  passagersTransitDirect: number;
  siegesOccupes: number;
  siegesOfferts: number;
  siegesOffertsArrivees: number;
  siegesOffertsDeparts: number;
}

export interface EntrepriseAggregateRecord {
  code?: string;
  commune?: string;
  total: number;
  actives: number;
  radiees: number;
  part: number;
}

export interface EntreprisesDynamiquePoint {
  annee: number;
  inscriptions: number;
  radiations: number;
  soldeNet: number;
}

export interface EntreprisesDynamiquePayload {
  totalEtablissements: number;
  etablissementsActifs: number;
  etablissementsRadies: number;
  repartitionAnnuelle: EntreprisesDynamiquePoint[];
}
