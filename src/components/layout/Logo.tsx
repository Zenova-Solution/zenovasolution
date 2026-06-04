import type { CSSProperties } from 'react';

interface LogoProps {
  size?: number;
}

/** Renders as: [Z-mark][enova]. Scales with font-size of the wrapper. */
export function Logo({ size }: LogoProps) {
  const style: CSSProperties = size != null ? { fontSize: size } : {};
  const markSrc = `${import.meta.env.BASE_URL}assets/zenova-mark.png`;
  return (
    <span className="zlogo" style={style}>
      <img src={markSrc} alt="Z" className="zlogo-mark" />
      <span className="zlogo-word">enova</span>
    </span>
  );
}

/** Z-only mark — used in footer */
export function LogoMark({ size }: LogoProps) {
  const style: CSSProperties = size != null ? { fontSize: size } : {};
  const markSrc = `${import.meta.env.BASE_URL}assets/zenova-mark.png`;
  return (
    <span style={{ display: 'inline-flex', ...style }}>
      <img src={markSrc} alt="Zenova" className="zlogo-mark-only" />
    </span>
  );
}
