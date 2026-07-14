import type { CSSProperties } from 'react';

interface LogoProps {
  size?: number;
  /** Play the kinetic entrance: Z pops in, then e-n-o-v-a slide out from behind it. */
  animate?: boolean;
}

const LETTERS = ['e', 'n', 'o', 'v', 'a'];

/** Renders as: [Z-mark][enova]. Scales with font-size of the wrapper. */
export function Logo({ size, animate = false }: LogoProps) {
  const style: CSSProperties = size != null ? { fontSize: size } : {};
  const markSrc = `${import.meta.env.BASE_URL}assets/zenova-mark.png`;
  return (
    <span
      className={`zlogo${animate ? ' zlogo--animate' : ''}`}
      style={style}
      role="img"
      aria-label="Zenova"
    >
      <img
        src={markSrc}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="zlogo-mark"
      />
      <span className="zlogo-word" aria-hidden="true">
        {animate
          ? LETTERS.map((ch, i) => (
              <span key={i} className="zlogo-letter" style={{ '--i': i } as CSSProperties}>
                {ch}
              </span>
            ))
          : 'enova'}
      </span>
    </span>
  );
}

/** Z-only mark — used in footer */
export function LogoMark({ size }: LogoProps) {
  const style: CSSProperties = size != null ? { fontSize: size } : {};
  const markSrc = `${import.meta.env.BASE_URL}assets/zenova-mark.png`;
  return (
    <span style={{ display: 'inline-flex', ...style }}>
      <img
        src={markSrc}
        alt="Zenova"
        loading="lazy"
        decoding="async"
        className="zlogo-mark-only"
      />
    </span>
  );
}
