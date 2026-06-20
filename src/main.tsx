import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './fonts/baloo2.css'; // GĐ6.1 — local Baloo 2 @font-face (no CDN at runtime)
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
