import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Icon } from '@/components/icons/Icon';
import { NeonButton } from '@/components/ui/NeonButton';
import { GhostButton } from '@/components/ui/GhostButton';
import { useContent } from '@/admin/store';
import { PRICING, type PricingPlan } from '@/data/pricing';
import { scrollToTop } from '@/lib/scroll';
import './PricingPage.css';

/** Ember spark that travels the card border — port of the BorderTrail effect. */
function BorderTrail({ size = 64 }: { size?: number }) {
  return (
    <div className="pcx-trail" aria-hidden="true">
      <motion.div
        className="pcx-trail__spark"
        style={{ width: size, offsetPath: 'rect(0 auto auto 0 round 20px)' }}
        animate={{ offsetDistance: ['0%', '100%'] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
      />
    </div>
  );
}

interface PricingCardProps {
  plan: PricingPlan;
  hue: string;
  reduceMotion: boolean;
}

function PricingCard({ plan, hue, reduceMotion }: PricingCardProps) {
  return (
    <motion.article
      className={`pcx-card${plan.highlighted ? ' is-hot' : ''}`}
      style={{ '--hue': hue } as React.CSSProperties}
      variants={{
        hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 },
        show: {
          opacity: 1,
          y: 0,
          transition: reduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.2, 0.7, 0.2, 1] },
        },
      }}
    >
      {plan.highlighted && !reduceMotion && <BorderTrail />}
      {plan.highlighted && <span className="pcx-card__flag mono">Popular</span>}
      <div className="pcx-card__head">
        <h3 className="pcx-card__name display">{plan.name}</h3>
        <p className="pcx-card__info">{plan.info}</p>
        <div className="pcx-card__price display">{plan.price}</div>
        <div className="pcx-card__terms mono">One-time · {plan.timeline}</div>
      </div>
      <ul className="pcx-card__features">
        {plan.features.map((f) => (
          <li key={f}>
            <span className="pcx-card__check">
              <Icon.Check size={15} />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <div className="pcx-card__foot">
        <Link to="/contact" className={`${plan.highlighted ? 'btn-primary' : 'btn-ghost'} pcx-card__cta`}>
          {plan.cta}
        </Link>
      </div>
    </motion.article>
  );
}

export function PricingPage() {
  const [content] = useContent();
  // Rate cards come from the admin content store (Site content → Pricing);
  // fall back to the bundled defaults until it's hydrated/populated.
  const pricing = content.pricing?.length ? content.pricing : PRICING;

  const [active, setActive] = useState(() => pricing[0]?.slug ?? '');
  const reduceMotion = useReducedMotion() ?? false;
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollToTop();
  }, []);

  // When the tab row overflows, translate wheel input into horizontal scroll;
  // otherwise let the event through so the page keeps scrolling (Lenis).
  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      el.scrollLeft += delta;
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Fall back to the first tab if the active slug disappears (e.g. after
  // hydration replaces the list or a tab is removed in the admin).
  const current = pricing.find((p) => p.slug === active) ?? pricing[0];

  return (
    <div className="pcx">
      <header className="pcx-hero">
        <div className="container">
          <div className="pcx-hero__kicker mono reveal">
            <span className="pcx-hero__tick" />
            Pricing — project-based · one-time
          </div>
          <h1 className="pcx-hero__title display reveal reveal-blur reveal-d1">
            One project.
            <br />
            <em>One price.</em>
          </h1>
          <p className="pcx-hero__sub reveal reveal-d2">
            No retainers, no hourly surprises. Every engagement is scoped once, priced once, and
            shipped as a project. Pick a service to see its rate card.
          </p>
        </div>
      </header>

      <div className="pcx-tabs">
        <div className="container">
          <div className="pcx-tabs__scroll" ref={tabsScrollRef}>
            <div className="pcx-tabs__row" role="tablist" aria-label="Service pricing">
              {pricing.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  role="tab"
                  aria-selected={current.slug === s.slug}
                  className={`pcx-tab${current.slug === s.slug ? ' is-active' : ''}`}
                  style={{ '--hue': s.hue } as React.CSSProperties}
                  onClick={() => setActive(s.slug)}
                >
                  {current.slug === s.slug && (
                    <motion.span
                      className="pcx-tab__pill"
                      layoutId="pricing-tab"
                      transition={
                        reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }
                      }
                    />
                  )}
                  <span className="pcx-tab__label">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="pcx-panel">
        <div className="container">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.slug}
              role="tabpanel"
              style={{ '--hue': current.hue } as React.CSSProperties}
              initial="hidden"
              animate="show"
              exit={
                reduceMotion
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { opacity: 0, y: -12, transition: { duration: 0.18, ease: 'easeIn' } }
              }
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
              }}
            >
              <div className="pcx-panel__meta mono">
                <span>{current.label} — rate card</span>
                <span>{current.plans.length} tiers · fixed quote after scoping</span>
              </div>
              <div className="pcx-grid">
                {current.plans.map((plan) => (
                  <PricingCard key={plan.id} plan={plan} hue={current.hue} reduceMotion={reduceMotion} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="pcx-note">
        <div className="container pcx-note__inner">
          <div className="pcx-note__label mono">Good to know</div>
          <h2 className="pcx-note__title display">
            Every quote is fixed
            <br />
            before we start.
          </h2>
          <p className="pcx-note__sub">
            These prices are honest starting points. After one scoping call you get a fixed quote and
            a real timeline — and that number doesn&rsquo;t move unless the scope does.
          </p>
          <div className="pcx-note__actions">
            <NeonButton text="Book a scoping call" onClick={() => { window.location.href = '/contact'; }} />
            <GhostButton text="See our process" onClick={() => { window.location.href = '/services'; }} />
          </div>
        </div>
      </section>
    </div>
  );
}
