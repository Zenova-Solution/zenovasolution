import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

/* Loading placeholders for admin pages.

   Unlike the public archetypes, these reuse the real .adm-* classes: admin.css is
   imported by AdminRoutes (the lazy chunk's root), so it has always loaded by the
   time any admin page renders. The .skel primitive itself rides in the entry
   bundle. Layout CSS for these lives in admin.css, next to the classes it mirrors. */

function SkelRegion({ children }: { children: ReactNode }) {
  return (
    <div role="status" aria-busy="true">
      <span className="visually-hidden">Loading…</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

export interface AdmListSkeletonProps {
  /** The page's GRID const — keeps skeleton rows aligned to the real header. */
  grid: string;
  cols: number;
  rows?: number;
  head?: boolean;
  /** First cell is an avatar/checkbox dot rather than a text bar. */
  leadCell?: boolean;
}

export function AdmListSkeleton({ grid, cols, rows = 6, head = true, leadCell = false }: AdmListSkeletonProps) {
  return (
    <SkelRegion>
      <div className="adm-list">
        {head && (
          <div className="adm-list__row adm-list__row--head" style={{ gridTemplateColumns: grid }}>
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="adm-list__cell">
                <Skeleton h={8} w={i === 0 && leadCell ? 16 : 56} />
              </div>
            ))}
          </div>
        )}
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="adm-list__row adm-list__row--skeleton"
            style={{ gridTemplateColumns: grid }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="adm-list__cell">
                {c === 0 && leadCell ? (
                  <Skeleton circle w={22} />
                ) : (
                  <Skeleton h={13} w={c === cols - 1 ? '55%' : `${60 + ((r + c) % 4) * 10}%`} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </SkelRegion>
  );
}

export function AdmMediaSkeleton({ count = 8 }: { count?: number }) {
  return (
    <SkelRegion>
      <div className="adm-media-grid">
        {Array.from({ length: count }).map((_, i) => (
          <article key={i} className="adm-media-card">
            {/* .skel goes inside the thumb, not on it: the thumb's aspect-ratio
                would lose to .skel's fixed height. */}
            <div className="adm-media-card__thumb">
              <Skeleton style={{ width: '100%', height: '100%', borderRadius: 0 }} />
            </div>
            <div className="adm-media-card__body">
              <Skeleton h={13} w="80%" />
              <Skeleton h={10} w="45%" />
            </div>
          </article>
        ))}
      </div>
    </SkelRegion>
  );
}

export function AdmEditorSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <SkelRegion>
      <div className="adm-card">
        <div className="adm-editor-skeleton">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="adm-editor-skeleton__field">
              <Skeleton h={9} w={72} />
              <Skeleton h={38} radius={10} />
            </div>
          ))}
          <div className="adm-editor-skeleton__field">
            <Skeleton h={9} w={72} />
            <Skeleton h={160} radius={10} />
          </div>
        </div>
      </div>
    </SkelRegion>
  );
}
