import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days cached in memory and persisted
      staleTime: 1000 * 60 * 2, // 2 minutes stale time before background re-fetch
      networkMode: 'offlineFirst',
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

export const localStoragePersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'PENNE_QUERY_CACHE_V1',
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  buster: 'v1.0.0',
};
