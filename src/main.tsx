import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/tailwind.css';
import './styles/global.css';
// Imported here rather than from Skeleton.tsx, which is shared between the entry
// and the admin chunk: manualChunks (vite.config.ts) duplicates such modules, and
// Vite then emits their co-located CSS with only one chunk — it landed in admin,
// leaving public skeletons unstyled. The entry module can't be duplicated, so this
// import is the one placement that guarantees .skel ships in the always-loaded CSS.
import './components/ui/Skeleton.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
