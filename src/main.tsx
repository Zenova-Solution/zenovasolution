import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Preloader } from './components/ui/Preloader';
import './styles/tailwind.css';
import './styles/global.css';
import './admin/admin.css';
import './components/ui/inputs/inputs.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <Preloader />
    <App />
  </StrictMode>,
);
