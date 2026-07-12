import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@/components/icons/Icon';
import type { PricingPlan } from '@/data/pricing';
import './pricing-card.css';

/** Ember spark that travels the card border — the highlighted-card accent. */
export function BorderTrail({ size = 64 }: { size?: number }) {
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
  /** When true (admin preview) the CTA is inert and cards don't navigate. */
  preview?: boolean;
}

/**
 * Presentational rate card. Rendered identically on the public /pricing page
 * and inside the admin Pricing manager's live preview, so the two never drift.
 */
export function PricingCard({ plan, hue, reduceMotion, preview = false }: PricingCardProps) {
  const ctaClass = `${plan.highlighted ? 'btn-primary' : 'btn-ghost'} pcx-card__cta`;
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
      {plan.highlighted && <span className="pcx-card__flag mono">Most popular</span>}
      <div className="pcx-card__head">
        <h3 className="pcx-card__name display">{plan.name || 'Untitled plan'}</h3>
        {plan.info && <p className="pcx-card__info">{plan.info}</p>}
        <div className="pcx-card__price display">{plan.price || '—'}</div>
        <div className="pcx-card__terms mono">
          One-time{plan.timeline ? ` · ${plan.timeline}` : ''}
        </div>
      </div>
      <ul className="pcx-card__features">
        {plan.features.map((f, i) => (
          <li key={`${f}-${i}`}>
            <span className="pcx-card__check">
              <Icon.Check size={15} />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <div className="pcx-card__foot">
        {preview ? (
          <span className={`${ctaClass} pcx-card__cta--static`} aria-hidden="true">
            {plan.cta || 'Start this project'}
          </span>
        ) : (
          <Link to="/contact" className={ctaClass}>
            {plan.cta || 'Start this project'}
          </Link>
        )}
      </div>
    </motion.article>
  );
}
