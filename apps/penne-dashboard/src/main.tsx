import React from 'react';
import ReactDOM from 'react-dom/client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persistOptions } from './services/queryClient';
import App from './App';
import './index.css';

// Register PWA Service Worker for offline asset caching
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (import.meta.env.PROD || import.meta.env.MODE === 'production')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[PWA] ServiceWorker registration skipped/failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      onSuccess={() => {
        // Trigger background invalidation after hydration from localStorage
        queryClient.invalidateQueries();
      }}
    >
      <App />
    </PersistQueryClientProvider>
  </React.StrictMode>
);
