import { useEffect, useMemo, useState } from 'react';

const dataCache = new Map<string, unknown>();
const promiseCache = new Map<string, Promise<unknown>>();

async function fetchJson<T>(resourcePath: string): Promise<T> {
  const normalizedPath = resourcePath.replace(/^\/+/, '');
  const basePath = import.meta.env.BASE_URL || '/';
  const url = `${basePath}${normalizedPath}`;

  if (dataCache.has(url)) {
    return dataCache.get(url) as T;
  }

  if (!promiseCache.has(url)) {
    promiseCache.set(
      url,
      fetch(url).then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Échec du chargement de ${normalizedPath} (${response.status} ${response.statusText}).`,
          );
        }

        const payload = (await response.json()) as T;
        dataCache.set(url, payload);
        promiseCache.delete(url);
        return payload;
      }),
    );
  }

  return promiseCache.get(url) as Promise<T>;
}

export function useJsonData<T>(resourcePath: string) {
  const normalizedPath = useMemo(() => resourcePath.replace(/^\/+/, ''), [resourcePath]);
  const initialData = useMemo(
    () => dataCache.get(`${import.meta.env.BASE_URL || '/'}${normalizedPath}`) as T | undefined,
    [normalizedPath],
  );

  const [data, setData] = useState<T | null>(initialData ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(!initialData);
    setError(null);

    fetchJson<T>(normalizedPath)
      .then((payload) => {
        if (!isMounted) {
          return;
        }
        setData(payload);
        setIsLoading(false);
      })
      .catch((reason) => {
        if (!isMounted) {
          return;
        }
        setError(reason instanceof Error ? reason.message : 'Erreur de chargement inconnue.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialData, normalizedPath]);

  return { data, error, isLoading };
}
