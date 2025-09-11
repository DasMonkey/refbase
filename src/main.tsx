import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext';
import { ApiKeyProvider } from './contexts/ApiKeyContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <ThemeProvider>
      <ApiKeyProvider>
        <App />
      </ApiKeyProvider>
    </ThemeProvider>
  </HelmetProvider>
);