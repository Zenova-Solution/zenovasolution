import type { CSSProperties, ReactNode } from 'react';
import {
  Skeleton,
  SkeletonFeature,
  SkeletonFields,
  SkeletonGrid,
  SkeletonHero,
  SkeletonPillars,
  SkeletonProseBlock,
  SkeletonRail,
  SkeletonRows,
  SkeletonSpec,
  SkeletonText,
  SkeletonToolbar,
} from './Skeleton';

/* Route-level loading layouts. Each is a <Suspense> fallback in App.tsx, and two
   double as data-fetch states (BlogPostPage, SeoCatchAllPage).

   These must stay statically imported — see the load-order note in Skeleton.css. */

/** One polite announcement per page; the shape tree itself is decorative.
    Announce a text node rather than aria-label: several screen readers read a
    live region's contents, not its accessible name. */
function SkelPage({ children }: { children: ReactNode }) {
  return (
    <div className="skel-page" role="status" aria-busy="true">
      <span className="visually-hidden">Loading…</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

/** Hero → optional pillars → vertical rows. Services, Work. */
export function ListPageSkeleton({
  rows = 5,
  feature = false,
  pillars = 0,
}: {
  rows?: number;
  feature?: boolean;
  pillars?: number;
}) {
  return (
    <SkelPage>
      <SkeletonHero />
      {pillars > 0 && <SkeletonPillars count={pillars} />}
      {feature && (
        <div className="container">
          <SkeletonFeature wide />
        </div>
      )}
      <SkeletonRows count={rows} />
    </SkelPage>
  );
}

/** Hero → optional toolbar → optional feature → card grid. Pricing, Careers, About, Blog. */
export function GridPageSkeleton({
  count = 6,
  min = 300,
  toolbar = false,
  feature = false,
  media = true,
}: {
  count?: number;
  min?: number;
  toolbar?: boolean;
  feature?: boolean;
  media?: boolean;
}) {
  return (
    <SkelPage>
      <SkeletonHero />
      <div className="container" style={{ paddingBottom: 80 }}>
        {toolbar && <SkeletonToolbar />}
        {feature && <SkeletonFeature />}
        <SkeletonGrid count={count} min={min} media={media} />
      </div>
    </SkelPage>
  );
}

/** Crumbs + header + spec strip → rail/content split. ServiceDetail, JobDetail, ProjectDetail. */
export function DetailPageSkeleton({
  railWidth = 300,
  banner = false,
  specCols = 4,
}: {
  railWidth?: number;
  banner?: boolean;
  specCols?: number;
}) {
  return (
    <SkelPage>
      <div className="skel-hero">
        <div className="container">
          <Skeleton w={180} h={10} style={{ marginBottom: 24 }} />
          <div className="skel-hero__title">
            <Skeleton h={44} radius={10} w="70%" />
            <Skeleton h={44} radius={10} w="45%" />
          </div>
          <SkeletonText lines={2} lastWidth="40%" />
          <SkeletonSpec cols={specCols} />
        </div>
      </div>
      {banner && (
        <div className="container">
          <Skeleton className="skel-banner" />
        </div>
      )}
      <div className="container">
        <div className="skel-detail" style={{ '--skel-rail': `${railWidth}px` } as CSSProperties}>
          <SkeletonRail />
          <div className="skel-content">
            <SkeletonText lines={3} lastWidth="55%" gap={12} />
            <SkeletonProseBlock lines={4} />
            <SkeletonProseBlock lines={5} />
            <SkeletonProseBlock lines={3} />
          </div>
        </div>
      </div>
    </SkelPage>
  );
}

/** Narrow head + prose, optional right rail. BlogPost, Legal, SeoCatchAll. */
export function ArticlePageSkeleton({
  width = 820,
  side = false,
  paragraphs = 5,
  meta = false,
}: {
  width?: number;
  side?: boolean;
  paragraphs?: number;
  meta?: boolean;
}) {
  const body = (
    <div className="skel-prose">
      {Array.from({ length: paragraphs }).map((_, i) => (
        <SkeletonProseBlock key={i} lines={i % 2 === 0 ? 4 : 5} />
      ))}
    </div>
  );

  return (
    <SkelPage>
      <div className="container skel-article" style={{ '--skel-width': `${width}px` } as CSSProperties}>
        <div className="skel-article__head">
          <Skeleton w={140} h={10} />
          <Skeleton h={40} radius={10} w="85%" />
          <Skeleton h={40} radius={10} w="60%" />
          {meta && <Skeleton w={220} h={12} style={{ marginTop: 8 }} />}
        </div>
        {side ? (
          <div className="skel-article__layout">
            {body}
            <aside className="skel-side">
              <SkeletonRail items={3} />
              <SkeletonRail items={2} />
            </aside>
          </div>
        ) : (
          body
        )}
      </div>
    </SkelPage>
  );
}

/** Contact's two-column split, or the centered auth card. */
export function FormPageSkeleton({
  variant = 'split',
  fields = 4,
}: {
  variant?: 'auth' | 'split';
  fields?: number;
}) {
  if (variant === 'auth') {
    // Reuses the real .auth-* classes: they live in global.css, not a page chunk,
    // so they are styled at fallback time (and inherit the auth-fade-up stagger).
    return (
      <SkelPage>
        <div className="auth-shell">
          <div className="auth-card">
            <div className="auth-card__header">
              <Skeleton h={26} w="60%" radius={8} style={{ marginBottom: 12 }} />
              <Skeleton h={12} w="85%" />
            </div>
            {Array.from({ length: fields }).map((_, i) => (
              <div key={i} className="auth-field">
                <Skeleton w={64} h={10} style={{ marginBottom: 10 }} />
                <Skeleton h={44} radius={12} />
              </div>
            ))}
            <Skeleton h={46} radius={999} style={{ marginTop: 20 }} />
          </div>
        </div>
      </SkelPage>
    );
  }

  // No .container here on purpose: .ct-split is full-bleed edge-to-edge.
  return (
    <SkelPage>
      <div className="skel-split">
        <div className="skel-intro">
          <Skeleton w={90} h={10} />
          <Skeleton h={48} radius={10} w="85%" />
          <Skeleton h={48} radius={10} w="55%" />
          <SkeletonText lines={2} lastWidth="45%" />
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} h={16} w={`${70 - i * 12}%`} />
            ))}
          </div>
        </div>
        <div className="skel-pane">
          <Skeleton w={80} h={10} style={{ marginBottom: 24 }} />
          <SkeletonFields count={fields} />
        </div>
      </div>
    </SkelPage>
  );
}

/** Held space for route boundaries that resolve before their CSS exists — the
    /admin, /client and /team chunks. A shaped skeleton is impossible here
    (admin.css has not loaded) and the wait is a chunk fetch, so hold height
    rather than flash. */
export function RouteBlank() {
  return <div style={{ minHeight: '100vh' }} aria-hidden="true" />;
}
