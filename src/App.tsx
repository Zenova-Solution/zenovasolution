import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { Home } from '@/pages/Home';
import { TWEAK_DEFAULTS } from '@/config/tweaks';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { useReveal } from '@/hooks/useReveal';
import { useTweaks } from '@/hooks/useTweaks';
import { applyPalette } from '@/lib/palette';
import { applyTheme, getInitialTheme } from '@/lib/theme';
import type { Theme } from '@/types/tweaks';
import { ConfirmProvider } from '@/admin/components/ConfirmProvider';
import { SeoManager } from '@/seo/SeoManager';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { PageLoader } from '@/components/ui/PageLoader';
import { SkipLink } from '@/components/ui/SkipLink';

const ServicesPage = lazy(() => import('@/pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const ServiceDetailPage = lazy(() => import('@/pages/ServiceDetailPage').then(m => ({ default: m.ServiceDetailPage })));
const PricingPage = lazy(() => import('@/pages/PricingPage').then(m => ({ default: m.PricingPage })));
const WorkPage = lazy(() => import('@/pages/WorkPage').then(m => ({ default: m.WorkPage })));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const CareersPage = lazy(() => import('@/pages/CareersPage').then(m => ({ default: m.CareersPage })));
const JobDetailPage = lazy(() => import('@/pages/JobDetailPage').then(m => ({ default: m.JobDetailPage })));
const AboutPage = lazy(() => import('@/pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('@/pages/ContactPage').then(m => ({ default: m.ContactPage })));
const LegalPage = lazy(() => import('@/pages/LegalPage').then(m => ({ default: m.LegalPage })));
const BlogPage = lazy(() => import('@/pages/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const SeoCatchAllPage = lazy(() => import('@/pages/SeoCatchAllPage').then(m => ({ default: m.SeoCatchAllPage })));
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const AuthGate = lazy(() => import('@/components/ui/AuthGate').then(m => ({ default: m.AuthGate })));

const ZenovaTweaks = import.meta.env.DEV
  ? lazy(() => import('@/dev/ZenovaTweaks').then((m) => ({ default: m.ZenovaTweaks })))
  : null;

const AdminRoutesLazy = lazy(() => import('@/admin/AdminRoutes'));
const ClientRoutesLazy = lazy(() => import('@/client/ClientRoutes'));
const TeamRoutesLazy = lazy(() => import('@/team/TeamRoutes'));

export function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    applyPalette(t.palette);
  }, [t.palette]);

  useEffect(() => {
    import('@/admin/store').then(m => m.hydrateSite()).catch(() => {});
  }, []);

  const prevTweakTheme = useRef<Theme | null>(null);
  useEffect(() => {
    if (prevTweakTheme.current === null) {
      prevTweakTheme.current = t.theme;
      applyTheme(getInitialTheme());
      return;
    }
    if (prevTweakTheme.current !== t.theme) {
      prevTweakTheme.current = t.theme;
      applyTheme(t.theme);
    }
  }, [t.theme]);

  return (
    <ErrorBoundary>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <SeoManager />
      <SkipLink />
      <ConfirmProvider>
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        } />
        <Route path="/signin" element={<Navigate to="/login" replace />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/team/login" element={<Navigate to="/login" replace />} />
        <Route path="/client/login" element={<Navigate to="/login" replace />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <AuthGate requiredRoles={['admin']}>
                <AdminRoutesLazy />
              </AuthGate>
            </Suspense>
          }
        />
        <Route
          path="/client/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <AuthGate requiredRoles={['client', 'admin']}>
                <ClientRoutesLazy />
              </AuthGate>
            </Suspense>
          }
        />
        <Route
          path="/team/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <AuthGate requiredRoles={['team', 'admin']}>
                <TeamRoutesLazy />
              </AuthGate>
            </Suspense>
          }
        />
        <Route
          path="/*"
          element={
            <PublicLayout
              rotateMs={t.rotateMs}
              showMarquee={t.showMarquee}
              showTestimonials={t.showTestimonials}
            />
          }
        />
      </Routes>
      {ZenovaTweaks && (
        <Suspense fallback={null}>
          <ZenovaTweaks tweaks={t} setTweak={setTweak} />
        </Suspense>
      )}
      </ConfirmProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

interface PublicLayoutProps {
  rotateMs: number;
  showMarquee: boolean;
  showTestimonials: boolean;
}

function PublicLayout({
  rotateMs,
  showMarquee,
  showTestimonials,
}: PublicLayoutProps) {
  useSmoothScroll();
  useReveal();
  const location = useLocation();
  const isKnownPath =
    /^\/(services|pricing|work|about|contact|careers|blog|privacy|terms)?(\/.*)?$/.test(location.pathname);
  return (
    <>
      <Nav />
      <main id="main-content">
        <AnimatedRoutes
          rotateMs={rotateMs}
          showMarquee={showMarquee}
          showTestimonials={showTestimonials}
        />
      </main>
      {isKnownPath && <Footer />}
    </>
  );
}

interface AnimatedRoutesProps {
  rotateMs: number;
  showMarquee: boolean;
  showTestimonials: boolean;
}

function AnimatedRoutes({ rotateMs, showMarquee, showTestimonials }: AnimatedRoutesProps) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-transition">
      <Routes location={location}>
        <Route path="/" element={<Home rotateMs={rotateMs} showMarquee={showMarquee} showTestimonials={showTestimonials} />} />
        <Route path="/services" element={<Suspense fallback={<PageLoader />}><ServicesPage /></Suspense>} />
        <Route path="/services/:slug" element={<Suspense fallback={<PageLoader />}><ServiceDetailPage /></Suspense>} />
        <Route path="/pricing" element={<Suspense fallback={<PageLoader />}><PricingPage /></Suspense>} />
        <Route path="/process" element={<Navigate to="/services" replace />} />
        <Route path="/work" element={<Suspense fallback={<PageLoader />}><WorkPage /></Suspense>} />
        <Route path="/work/:slug" element={<Suspense fallback={<PageLoader />}><ProjectDetailPage /></Suspense>} />
        <Route path="/careers" element={<Suspense fallback={<PageLoader />}><CareersPage /></Suspense>} />
        <Route path="/careers/:slug" element={<Suspense fallback={<PageLoader />}><JobDetailPage /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
        <Route path="/blog" element={<Suspense fallback={<PageLoader />}><BlogPage /></Suspense>} />
        <Route path="/blog/:slug" element={<Suspense fallback={<PageLoader />}><BlogPostPage /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><LegalPage doc="privacy" /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<PageLoader />}><LegalPage doc="terms" /></Suspense>} />
        {/* Catch-all serves admin-authored SEO pages at /<slug>, or the 404 page. */}
        <Route path="*" element={<Suspense fallback={<PageLoader />}><SeoCatchAllPage /></Suspense>} />
      </Routes>
    </div>
  );
}
