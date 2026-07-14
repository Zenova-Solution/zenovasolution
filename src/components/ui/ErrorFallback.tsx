interface ErrorFallbackProps {
  error?: Error;
}

export function ErrorFallback({ error }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--bg, #0a0a0a)',
        color: 'var(--fg, #f0ede8)',
      }}
    >
      <div style={{ maxWidth: '520px' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '1rem' }}>
          Something went wrong
        </h1>
        <p style={{ color: 'var(--fg-dim, rgba(240,237,232,0.58))', marginBottom: '1.5rem' }}>
          We’re sorry, but this part of the page failed to load. Try refreshing the page, or return home.
        </p>
        {error?.message && process.env.NODE_ENV !== 'production' && (
          <pre
            style={{
              fontSize: '0.85rem',
              textAlign: 'left',
              padding: '1rem',
              borderRadius: '8px',
              background: 'var(--card, #141414)',
              overflow: 'auto',
              marginBottom: '1.5rem',
            }}
          >
            {error.message}
          </pre>
        )}
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            background: '#ff813a',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Return home
        </a>
      </div>
    </div>
  );
}
