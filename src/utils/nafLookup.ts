import { useEffect, useState } from 'react';

type NafEntry = {
  id: string | null;
  label: string | null;
};

let nafLabelMap: Map<string, string> | null = null;
let nafLabelPromise: Promise<void> | null = null;

function normalizeCode(code: unknown) {
  if (code === null || code === undefined) {
    return null;
  }

  const normalized = String(code).trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

function getFallbackCode(code: string) {
  if (/[A-Z]$/.test(code)) {
    return code.slice(0, -1);
  }

  return null;
}

function toDottedCode(code: string) {
  const withLetterMatch = code.match(/^(\d{2})(\d{2})([A-Z])$/);
  if (withLetterMatch) {
    return `${withLetterMatch[1]}.${withLetterMatch[2]}${withLetterMatch[3]}`;
  }

  const withoutLetterMatch = code.match(/^(\d{2})(\d{2})$/);
  if (withoutLetterMatch) {
    return `${withoutLetterMatch[1]}.${withoutLetterMatch[2]}`;
  }

  return null;
}

export async function loadNafLabels() {
  if (nafLabelMap) {
    return;
  }

  if (!nafLabelPromise) {
    const basePath = import.meta.env.BASE_URL || '/';
    nafLabelPromise = fetch(`${basePath}data/naf-codes.json`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Impossible de charger la nomenclature NAF.');
        }

        const payload = (await response.json()) as NafEntry[];
        nafLabelMap = new Map(
          payload
            .filter((entry) => entry.id && entry.label)
            .map((entry) => [entry.id as string, entry.label as string]),
        );
      })
      .catch((error) => {
        nafLabelPromise = null;
        throw error;
      });
  }

  await nafLabelPromise;
}

export function getNafLabel(code: unknown) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    return 'Code inconnu';
  }

  if (!nafLabelMap) {
    return `Code NAF ${normalizedCode}`;
  }

  const exact = nafLabelMap.get(normalizedCode);
  if (exact) {
    return exact;
  }

  const dotted = toDottedCode(normalizedCode);
  if (dotted) {
    const dottedMatch = nafLabelMap.get(dotted);
    if (dottedMatch) {
      return dottedMatch;
    }
  }

  const fallbackCode = getFallbackCode(normalizedCode);
  if (fallbackCode) {
    const fallback = nafLabelMap.get(fallbackCode);
    if (fallback) {
      return fallback;
    }

    const dottedFallback = toDottedCode(fallbackCode);
    if (dottedFallback) {
      const dottedFallbackMatch = nafLabelMap.get(dottedFallback);
      if (dottedFallbackMatch) {
        return dottedFallbackMatch;
      }
    }
  }

  return `Code inconnu (${normalizedCode})`;
}

export function useNafLabels() {
  const [isReady, setIsReady] = useState(Boolean(nafLabelMap));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadNafLabels()
      .then(() => {
        if (!isMounted) {
          return;
        }
        setIsReady(true);
      })
      .catch((reason) => {
        if (!isMounted) {
          return;
        }
        setError(reason instanceof Error ? reason.message : 'Erreur inconnue');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { isReady, error };
}
