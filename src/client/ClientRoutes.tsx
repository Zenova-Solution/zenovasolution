import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const ClientOverview = lazy(() => import('@/client/pages/Overview').then(m => ({ default: m.ClientOverview })));

function ClientLoader() {
  return <div style={{ minHeight: '100vh' }} />;
}

export default function ClientRoutes() {
  return (
    <Suspense fallback={<ClientLoader />}>
      <Routes>
        <Route index element={<Suspense fallback={<ClientLoader />}><ClientOverview /></Suspense>} />
      </Routes>
    </Suspense>
  );
}
