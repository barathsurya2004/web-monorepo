import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { StoreProvider } from './store';
import './index.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <StoreProvider>
        <App />
      </StoreProvider>
    </React.StrictMode>
  );
}
