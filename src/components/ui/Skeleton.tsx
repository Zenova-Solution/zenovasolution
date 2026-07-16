import type { CSSProperties } from 'react';

/* Placeholder shapes for loading states. Composed into route-level layouts by
   PageSkeletons.tsx.

   Skeleton.css is deliberately imported from main.tsx, not here — see the note
   there and at the top of Skeleton.css.

   Never put .reveal / .reveal-blur / .reveal-d* on a skeleton — useReveal() only
   adds the .in that clears their opacity:0 once an element intersects, so a
   revealed skeleton would sit invisible for its whole (short) life. */

const px = (v: string | number | undefined) => (typeof v === 'number' ? `${v}px` : v);

export interface SkeletonProps {
  /** Width. A number is treated as px. */
  w?: string | number;
  /** Height. A number is treated as px. Defaults to 12px via CSS. */
  h?: string | number;
  radius?: string | number;
  /** Renders a circle of size `w`; ignores `h`. */
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ w, h, radius, circle = false, className = '', style }: SkeletonProps) {
  return (
    <span
      className={`skel ${className}`}
      style={{
        width: px(w),
        height: circle ? px(w) : px(h),
        borderRadius: circle ? '50%' : px(radius),
        ...style,
      }}
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  /** Width of the final line — the ragged edge that reads as a paragraph. */
  lastWidth?: string;
  gap?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, lastWidth = '45%', gap = 10, className = '' }: SkeletonTextProps) {
  return (
    <span className={`skel-text ${className}`} style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} w={i === lines - 1 ? lastWidth : '100%'} />
      ))}
    </span>
  );
}

/** Kicker + title + sub, on the 176px top padding the real heroes share. */
export function SkeletonHero({ titleLines = 2, subLines = 2 }: { titleLines?: number; subLines?: number }) {
  return (
    <div className="skel-hero">
      <div className="container">
        <div className="skel-hero__kicker">
          <Skeleton w={24} h={1} radius={0} />
          <Skeleton w={90} h={10} />
        </div>
        <div className="skel-hero__title">
          {Array.from({ length: titleLines }).map((_, i) => (
            <Skeleton key={i} h={44} radius={10} w={i === titleLines - 1 ? '55%' : '80%'} />
          ))}
        </div>
        <SkeletonText lines={subLines} lastWidth="35%" className="skel-hero__sub" />
      </div>
    </div>
  );
}

export function SkeletonToolbar({ chips = 5 }: { chips?: number }) {
  return (
    <div className="skel-toolbar">
      {Array.from({ length: chips }).map((_, i) => (
        <Skeleton key={i} w={78 + ((i * 23) % 46)} h={32} radius={999} />
      ))}
    </div>
  );
}

export function SkeletonCard({ media = true, bodyLines = 3 }: { media?: boolean; bodyLines?: number }) {
  return (
    <div className="skel-card">
      {media && <Skeleton className="skel-card__media" />}
      <div className="skel-card__body">
        <Skeleton h={18} w="70%" />
        <SkeletonText lines={bodyLines} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, min = 300, media = true }: { count?: number; min?: number; media?: boolean }) {
  return (
    <div className="skel-grid" style={{ '--skel-min': `${min}px` } as CSSProperties}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} media={media} />
      ))}
    </div>
  );
}

/** The lead card above a grid. `wide` gives the 21/9 full-bleed variant. */
export function SkeletonFeature({ wide = false }: { wide?: boolean }) {
  return (
    <div className={`skel-feature ${wide ? 'skel-feature--wide' : ''}`}>
      <Skeleton className="skel-feature__media" />
      <div className="skel-feature__body">
        <Skeleton h={26} w="80%" radius={8} />
        <SkeletonText lines={3} />
      </div>
    </div>
  );
}

export function SkeletonPillars({ count = 3 }: { count?: number }) {
  return (
    <div className="container">
      <div className="skel-pillars" style={{ '--skel-cols': count } as CSSProperties}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skel-pillar">
            <Skeleton w={60} h={10} />
            <Skeleton h={22} w="75%" radius={8} />
            <SkeletonText lines={2} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="container">
      <div className="skel-rows">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skel-row">
            <Skeleton w={28} h={12} />
            <div className="skel-row__main">
              <Skeleton h={24} w="45%" radius={8} />
              <Skeleton h={12} w="70%" />
            </div>
            <Skeleton className="skel-row__meta" w={90} h={12} />
            <Skeleton className="skel-row__arrow" w={20} h={20} radius={6} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonSpec({ cols = 4 }: { cols?: number }) {
  return (
    <div className="skel-spec">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="skel-spec__cell">
          <Skeleton w={64} h={9} />
          <Skeleton w="80%" h={14} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRail({ items = 4 }: { items?: number }) {
  return (
    <aside className="skel-rail">
      <Skeleton className="skel-rail__visual" h={140} radius={14} />
      <Skeleton h={16} w="60%" />
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton key={i} h={12} w={i % 2 === 0 ? '90%' : '70%'} />
      ))}
      <Skeleton h={42} radius={999} style={{ marginTop: 8 }} />
    </aside>
  );
}

/** One prose block: a short heading bar over a paragraph. */
export function SkeletonProseBlock({ lines = 4 }: { lines?: number }) {
  return (
    <div className="skel-prose__block">
      <Skeleton h={20} w="40%" radius={8} style={{ marginBottom: 16 }} />
      <SkeletonText lines={lines} lastWidth="60%" gap={12} />
    </div>
  );
}

export function SkeletonFields({ count = 4 }: { count?: number }) {
  return (
    <div className="skel-fields">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skel-field">
          <Skeleton w={72} h={10} />
          <Skeleton h={44} radius={12} />
        </div>
      ))}
      <Skeleton h={46} radius={999} style={{ marginTop: 6 }} />
    </div>
  );
}

/** The grid body of a card list, without a hero — for pages whose real header is
    already on screen while only the list is still loading (see BlogPage). */
export function SkeletonListBody({
  feature = false,
  count = 6,
  min = 300,
  media = true,
}: {
  feature?: boolean;
  count?: number;
  min?: number;
  media?: boolean;
}) {
  return (
    <div className="skel-page" role="status" aria-busy="true">
      <span className="visually-hidden">Loading…</span>
      <div aria-hidden="true">
        {feature && <SkeletonFeature />}
        <SkeletonGrid count={count} min={min} media={media} />
      </div>
    </div>
  );
}
