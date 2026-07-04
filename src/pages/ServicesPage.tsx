import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { ServiceVisual } from '@/components/sections/ServiceVisual';
import { ServiceMedia } from '@/components/sections/ServiceMedia';
import { NeonButton } from '@/components/ui/NeonButton';
import { GhostButton } from '@/components/ui/GhostButton';
import { useServices } from '@/admin/store';
import { scrollToTop } from '@/lib/scroll';
import './ServicesPage.css';

interface Pillar {
  tag: string;
  title: string;
  blurb: string;
  hue: string;
}

const PILLARS: Pillar[] = [
  {
    tag: 'Build',
    title: 'Design + Development',
    blurb: 'Websites, web apps, and brands — built to last and easy to maintain.',
    hue: '#ff813a',
  },
  {
    tag: 'Grow',
    title: 'Marketing + Content',
    blurb: 'Get more customers with SEO, ads, and content that actually works.',
    hue: '#e06820',
  },
  {
    tag: 'Run',
    title: 'Operations + Support',
    blurb: 'Better tools and processes so your team can scale faster.',
    hue: '#ff9a5c',
  },
];

export function ServicesPage() {
  const [SERVICES] = useServices();
  const [hovered, setHovered] = useState<string | null>(null);
  useEffect(() => {
    scrollToTop();
  }, []);

  const count = String(SERVICES.length).padStart(2, '0');

  return (
    <div className="svx">
      <header className="svx-hero">
        <div className="container">
          <div className="svx-hero__kicker mono">
            <span className="svx-hero__tick" />
            Services — index of {count}
          </div>
          <h1 className="svx-hero__title display">
            Every discipline
            <br />
            <em>under one roof.</em>
          </h1>
          <p className="svx-hero__sub">
            Design, build, and grow your business without juggling agencies. Pick a service below — most
            projects combine two or three.
          </p>
        </div>
      </header>

      <div className="svx-pillars">
        <div className="container svx-pillars__row">
          {PILLARS.map((p) => (
            <div key={p.tag} className="svx-pillar" style={{ '--hue': p.hue } as React.CSSProperties}>
              <span className="svx-pillar__tag mono">{p.tag}</span>
              <span className="svx-pillar__title display">{p.title}</span>
              <span className="svx-pillar__blurb">{p.blurb}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="svx-index">
        <div className="container">
          {SERVICES.map((s, i) => (
            <Link
              key={s.slug}
              to={`/services/${s.slug}`}
              className="svx-row"
              style={{ '--hue': s.hue } as React.CSSProperties}
              onMouseEnter={() => setHovered(s.slug)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="svx-row__num mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="svx-row__main">
                <span className="svx-row__title display">{s.title}</span>
                <span className="svx-row__short">{s.short}</span>
              </span>
              <span className="svx-row__meta mono">
                <span className="svx-row__tag">{s.tag}</span>
                <span className="svx-row__stat">
                  {s.stat[0]} {s.stat[1]}
                </span>
              </span>
              <span className="svx-row__arrow">
                <Icon.ArrowUpRight size={22} />
              </span>
              <span className="svx-row__preview" aria-hidden="true">
                {s.image || s.video ? (
                  <ServiceMedia image={s.image} video={s.video} alt="" loading="lazy" objectFit="cover" />
                ) : (
                  <ServiceVisual kind={s.visual} hue={s.hue} active={hovered === s.slug} />
                )}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="svx-cta">
        <div className="container svx-cta__inner">
          <h2 className="svx-cta__title display">
            Not sure where
            <br />
            to start?
          </h2>
          <p className="svx-cta__sub">
            Tell us what you&rsquo;re trying to do — we&rsquo;ll tell you what we&rsquo;d build, honestly.
          </p>
          <div className="svx-cta__actions">
            <NeonButton text="Get in touch" onClick={() => { window.location.href = '/contact'; }} />
            <GhostButton text="See our process" onClick={() => { window.location.href = '/process'; }} />
          </div>
        </div>
      </section>
    </div>
  );
}
