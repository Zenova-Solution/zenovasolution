import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import './admin.css';
import '../components/ui/inputs/inputs.css';

const Overview = lazy(() => import('@/admin/pages/Overview').then(m => ({ default: m.Overview })));
const ServicesAdmin = lazy(() => import('@/admin/pages/ServicesAdmin').then(m => ({ default: m.ServicesAdmin })));
const ServiceEditor = lazy(() => import('@/admin/pages/ServiceEditor').then(m => ({ default: m.ServiceEditor })));
const ProjectsAdmin = lazy(() => import('@/admin/pages/ProjectsAdmin').then(m => ({ default: m.ProjectsAdmin })));
const ProjectEditor = lazy(() => import('@/admin/pages/ProjectEditor').then(m => ({ default: m.ProjectEditor })));
const JobsAdmin = lazy(() => import('@/admin/pages/JobsAdmin').then(m => ({ default: m.JobsAdmin })));
const JobEditor = lazy(() => import('@/admin/pages/JobEditor').then(m => ({ default: m.JobEditor })));
const TeamAdmin = lazy(() => import('@/admin/pages/TeamAdmin').then(m => ({ default: m.TeamAdmin })));
const ContentAdmin = lazy(() => import('@/admin/pages/ContentAdmin').then(m => ({ default: m.ContentAdmin })));
const PricingAdmin = lazy(() => import('@/admin/pages/PricingAdmin').then(m => ({ default: m.PricingAdmin })));
const LegalAdmin = lazy(() => import('@/admin/pages/LegalAdmin').then(m => ({ default: m.LegalAdmin })));
const BlogAdmin = lazy(() => import('@/admin/pages/BlogAdmin').then(m => ({ default: m.BlogAdmin })));
const BlogEditor = lazy(() => import('@/admin/pages/BlogEditor').then(m => ({ default: m.BlogEditor })));
const SeoPagesAdmin = lazy(() => import('@/admin/pages/SeoPagesAdmin').then(m => ({ default: m.SeoPagesAdmin })));
const SeoPageEditor = lazy(() => import('@/admin/pages/SeoPageEditor').then(m => ({ default: m.SeoPageEditor })));
const MediaAdmin = lazy(() => import('@/admin/pages/MediaAdmin').then(m => ({ default: m.MediaAdmin })));
const Settings = lazy(() => import('@/admin/pages/Settings').then(m => ({ default: m.Settings })));
const InputsShowcase = lazy(() => import('@/admin/pages/InputsShowcase').then(m => ({ default: m.InputsShowcase })));
const InvoiceList = lazy(() => import('@/admin/pages/InvoiceList').then(m => ({ default: m.InvoiceList })));
const InvoiceEditor = lazy(() => import('@/admin/pages/InvoiceEditor').then(m => ({ default: m.InvoiceEditor })));
const UsersAdmin = lazy(() => import('@/admin/pages/UsersAdmin').then(m => ({ default: m.UsersAdmin })));
const Inbox = lazy(() => import('@/admin/pages/Inbox').then(m => ({ default: m.Inbox })));

function AdminLoader() {
  return <div style={{ minHeight: '100vh' }} />;
}

export default function AdminRoutes() {
  return (
    <Suspense fallback={<AdminLoader />}>
      <Routes>
        <Route index element={<Suspense fallback={<AdminLoader />}><Overview /></Suspense>} />
        <Route path="services" element={<Suspense fallback={<AdminLoader />}><ServicesAdmin /></Suspense>} />
        <Route path="services/:slug" element={<Suspense fallback={<AdminLoader />}><ServiceEditor /></Suspense>} />
        <Route path="projects" element={<Suspense fallback={<AdminLoader />}><ProjectsAdmin /></Suspense>} />
        <Route path="projects/:slug" element={<Suspense fallback={<AdminLoader />}><ProjectEditor /></Suspense>} />
        <Route path="jobs" element={<Suspense fallback={<AdminLoader />}><JobsAdmin /></Suspense>} />
        <Route path="jobs/:slug" element={<Suspense fallback={<AdminLoader />}><JobEditor /></Suspense>} />
        <Route path="team" element={<Suspense fallback={<AdminLoader />}><TeamAdmin /></Suspense>} />
        <Route path="content" element={<Suspense fallback={<AdminLoader />}><ContentAdmin /></Suspense>} />
        <Route path="pricing" element={<Suspense fallback={<AdminLoader />}><PricingAdmin /></Suspense>} />
        <Route path="legal" element={<Suspense fallback={<AdminLoader />}><LegalAdmin /></Suspense>} />
        <Route path="blog" element={<Suspense fallback={<AdminLoader />}><BlogAdmin /></Suspense>} />
        <Route path="blog/:slug" element={<Suspense fallback={<AdminLoader />}><BlogEditor /></Suspense>} />
        <Route path="seo-pages" element={<Suspense fallback={<AdminLoader />}><SeoPagesAdmin /></Suspense>} />
        <Route path="seo-pages/:slug" element={<Suspense fallback={<AdminLoader />}><SeoPageEditor /></Suspense>} />
        <Route path="media" element={<Suspense fallback={<AdminLoader />}><MediaAdmin /></Suspense>} />
        <Route path="invoices" element={<Suspense fallback={<AdminLoader />}><InvoiceList /></Suspense>} />
        <Route path="invoices/:id" element={<Suspense fallback={<AdminLoader />}><InvoiceEditor /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<AdminLoader />}><UsersAdmin /></Suspense>} />
        <Route path="inbox" element={<Suspense fallback={<AdminLoader />}><Inbox /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<AdminLoader />}><Settings /></Suspense>} />
        <Route path="inputs" element={<Suspense fallback={<AdminLoader />}><InputsShowcase /></Suspense>} />
      </Routes>
    </Suspense>
  );
}
