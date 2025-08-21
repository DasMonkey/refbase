import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext';
import { ApiKeyProvider } from './contexts/ApiKeyContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <ApiKeyProvider>
      <App />
    </ApiKeyProvider>
  </ThemeProvider>
);