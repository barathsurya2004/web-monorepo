import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days cached in memory and persisted
      staleTime: 0, // Real-time freshness: queries are stale immediately so invalidation/mount/focus triggers background re-fetch
      networkMode: 'offlineFirst',
      retry: 1,
      refetchOnWindowFocus: true, // Auto-sync when switching back to tab or returning from background
      refetchOnReconnect: true,
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
