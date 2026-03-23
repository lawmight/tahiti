const EXCEL_BASE_UTC = Date.UTC(1899, 11, 30);

export function excelSerialToDate(serial: unknown): Date | null {
  if (serial === null || serial === undefined || serial === '') {
    return null;
  }

  const numeric = Number(serial);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const wholeDays = Math.floor(numeric);
  return new Date(EXCEL_BASE_UTC + wholeDays * 24 * 60 * 60 * 1000);
}

const DATE_FORMATTERS = {
  long: new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }),
  short: new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }),
  'month-year': new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }),
};

export function formatDateFR(
  date: Date | null,
  variant: 'long' | 'short' | 'month-year',
): string {
  if (!date || Number.isNaN(date.getTime())) {
    return 'Date inconnue';
  }

  return DATE_FORMATTERS[variant].format(date);
}

export function isoDateToDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}
