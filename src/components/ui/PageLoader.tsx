export function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #0a0a0a)',
      }}
    >
      <span
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--line, rgba(255,129,58,0.1))',
          borderTopColor: '#ff813a',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span className="visually-hidden">Loading page…</span>
    </div>
  );
}
