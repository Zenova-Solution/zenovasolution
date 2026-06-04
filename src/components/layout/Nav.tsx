import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { Icon } from '@/components/icons/Icon';
import type { Theme } from '@/types/tweaks';

interface NavProps {
  theme?: Theme;
  onToggleTheme?: () => void;
}

const NAV_LINKS = [
  { label: 'Services', to: '/services' },
  { label: 'Process', to: '/process' },
  { label: 'Work', to: '/work' },
  { label: 'About', to: '/about' },
];

export function Nav({ theme = 'dark', onToggleTheme }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 860) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const themeBtn = (extra: CSSProperties = {}) => (
    <button
      onClick={onToggleTheme}
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      style={{
        width: 40,
        height: 40,
        borderRadius: 999,
        border: '1px solid var(--line)',
        background: 'transparent',
        color: 'var(--fg-dim)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all .25s',
        ...extra,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--card-hover)';
        e.currentTarget.style.color = 'var(--fg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--fg-dim)';
      }}
    >
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        padding: scrolled ? '12px 16px' : '20px 16px',
        transition: 'padding .3s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: scrolled ? 920 : 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
          padding: '0 10px 0 18px',
          borderRadius: 999,
          background: scrolled ? 'var(--nav-bg-strong)' : 'var(--nav-bg)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1px solid var(--line)',
          boxShadow: scrolled ? '0 12px 40px var(--nav-shadow)' : '0 0 0 transparent',
          transition: 'all .35s cubic-bezier(.2,.7,.2,1)',
        }}
      >
        <Link to="/" style={{ display: 'inline-flex' }} onClick={() => setMenuOpen(false)}>
          <Logo size={25} />
        </Link>
        <div className="nav-links" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {NAV_LINKS.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.label}
                to={l.to}
                className="nav-link"
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? 'var(--fg)' : 'var(--fg-dim)',
                  background: active ? 'var(--card-hover)' : 'transparent',
                  transition: 'color .2s, background .2s',
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="nav-desktop-only" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onToggleTheme && themeBtn()}
            <Link
              to="/#contact"
              className="nav-cta"
              style={{
                height: 42,
                padding: '0 18px',
                borderRadius: 999,
                background: 'var(--grad)',
                color: 'white',
                fontSize: 14,
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                boxShadow: '0 4px 18px rgba(58,91,255,0.35)',
              }}
            >
              Get in touch <Icon.Arrow size={14} />
            </Link>
          </div>

          <button
            className="nav-hamburger"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              border: '1px solid var(--line)',
              background: menuOpen ? 'var(--card-hover)' : 'transparent',
              color: 'var(--fg)',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all .25s',
              padding: 0,
            }}
          >
            <span className="hamburger-bars" data-open={menuOpen ? '1' : '0'}>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}>
        <div className="mobile-menu__inner">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className="mobile-menu__link"
              >
                {l.label}
                <Icon.Arrow size={16} />
              </Link>
            ))}
          </div>
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {onToggleTheme && themeBtn({ width: 46, height: 46 })}
            <Link
              to="/#contact"
              onClick={() => setMenuOpen(false)}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 14,
                background: 'var(--grad)',
                color: 'white',
                fontWeight: 500,
                fontSize: 15,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                textDecoration: 'none',
                boxShadow: '0 6px 22px rgba(58,91,255,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            >
              Get in touch <Icon.Arrow size={14} />
            </Link>
          </div>
        </div>
      </div>

      <div
        className={`mobile-backdrop ${menuOpen ? 'is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
    </nav>
  );
}
