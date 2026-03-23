const FORME_JURIDIQUE_LABELS: Record<string, string> = {
  '150': 'Société créée de fait',
  '190': 'Entrepreneur individuel',
  '210': 'Indivision',
  '220': 'Société civile immobilière',
  '230': 'Autre société civile',
  '310': 'Société en nom collectif',
  '320': 'Société en commandite simple',
  '410': 'Coopérative',
  '510': 'SA à conseil d’administration',
  '520': 'SA à directoire',
  '530': 'Société anonyme simplifiée',
  '541': 'SARL unipersonnelle',
  '542': 'SARL',
  '549': 'Autre SARL',
  '550': 'Société en participation',
  '560': 'Société d’exercice libéral',
  '570': 'SAS',
  '571': 'SAS',
  '572': 'SASU',
  '620': 'Groupement d’intérêt économique',
  '630': 'Établissement public industriel et commercial',
  '651': 'Société civile de moyens',
  '652': 'Société civile',
  '654': 'Société civile immobilière',
  '659': 'Autre société civile',
  '690': 'Autre personne morale',
  '710': 'Collectivité territoriale',
  '721': 'Commune',
  '722': 'Département',
  '731': 'Établissement public administratif',
  '740': 'Organisme de sécurité sociale',
  '810': 'Syndicat de copropriété',
  '820': 'Association foncière',
  '830': 'Fondation',
  '840': 'Autre organisme privé spécialisé',
  '910': 'Association déclarée',
  '920': 'Association',
  '930': 'Fondation reconnue d’utilité publique',
  '990': 'Autre personne morale de droit privé',
};

function normalizeCode(code: unknown) {
  if (code === null || code === undefined) {
    return null;
  }

  const normalized = String(code).trim();
  return normalized.length > 0 ? normalized : null;
}

export function getFormeJuridiqueLabel(code: unknown) {
  const normalized = normalizeCode(code);
  if (!normalized) {
    return 'Forme juridique inconnue';
  }

  const exact = FORME_JURIDIQUE_LABELS[normalized];
  if (exact) {
    return exact;
  }

  const withZero = FORME_JURIDIQUE_LABELS[`${normalized}0`];
  if (withZero) {
    return withZero;
  }

  return `Forme juridique ${normalized}`;
}
