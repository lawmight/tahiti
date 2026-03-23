export const CLASSES_EFFECTIFS: Record<string, string> = {
  '01': '0 salarié',
  '02': '1 à 2',
  '03': '3 à 5',
  '04': '6 à 9',
  '05': '10 à 19',
  '06': '20 à 49',
  '07': '50 à 99',
  '08': '100 à 199',
  '09': '200 à 499',
  '10': '500 et plus',
};

const INTEGER_FORMATTER = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

const DECIMAL_FORMATTER = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
});

const CURRENCY_FORMATTER = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

export function formatNumberFR(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0';
  }

  return INTEGER_FORMATTER.format(numeric);
}

export function formatDecimalFR(value: unknown, digits = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0';
  }

  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(numeric);
}

export function formatXPF(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0 XPF';
  }

  const absolute = Math.abs(numeric);
  if (absolute >= 1_000_000_000) {
    return `${DECIMAL_FORMATTER.format(numeric / 1_000_000_000)} Md XPF`;
  }

  if (absolute >= 1_000_000) {
    return `${DECIMAL_FORMATTER.format(numeric / 1_000_000)} M XPF`;
  }

  if (absolute >= 1_000) {
    return `${DECIMAL_FORMATTER.format(numeric / 1_000)} k XPF`;
  }

  return `${CURRENCY_FORMATTER.format(numeric)} XPF`;
}

export function formatPercentFR(value: unknown, digits = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0 %';
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(numeric);
}
