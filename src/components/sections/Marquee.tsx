const TECH: string[] = [
  'React',
  'Next.js',
  'Vue',
  'TypeScript',
  'Node.js',
  'Python',
  'Go',
  'Rust',
  'AWS',
  'Docker',
  'Kubernetes',
  'Vercel',
  'Cloudflare',
  'Prisma',
  'Tailwind',
  'Figma',
  'GraphQL',
  'PostgreSQL',
  'Redis',
  'Turborepo',
];

export function Marquee() {
  const row = [...TECH, ...TECH];
  return (
    <section
      style={{
        padding: '56px 0',
        borderTop: '1px solid var(--line)',
        borderBottom: '1px solid var(--line)',
        overflow: 'hidden',
      }}
    >
      <div
        className="container"
        style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}
      >
        <div
          className="mono"
          style={{
            color: 'var(--fg-faint)',
            flexShrink: 0,
            maxWidth: 200,
          }}
        >
          Tech stack we use
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 240,
            overflow: 'hidden',
            position: 'relative',
            maskImage:
              'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage:
              'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 56,
              animation: 'marquee 38s linear infinite',
              width: 'max-content',
            }}
          >
            {row.map((c, i) => (
              <div
                key={i}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 22,
                  letterSpacing: '0.04em',
                  color: 'var(--fg-faint)',
                  opacity: 0.7,
                  whiteSpace: 'nowrap',
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
