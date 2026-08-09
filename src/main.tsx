import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles/index.css';

// Offline support (NFR-4): the service worker precaches the app shell on first
// load. autoUpdate means a new deploy is picked up on the next launch.
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
