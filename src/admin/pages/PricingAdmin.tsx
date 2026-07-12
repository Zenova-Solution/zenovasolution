import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { AdminShell } from '@/admin/components/AdminShell';
import { Button } from '@/admin/components/Button';
import { useConfirm } from '@/admin/components/confirm-context';
import { Field, StringList, TextArea, TextField, Toast } from '@/admin/components/Form';
import { Toggle } from '@/components/ui/inputs';
import { Icon } from '@/components/icons/Icon';
import { PricingCard } from '@/components/pricing/PricingCard';
import {
  contentStore,
  patchContent,
  useContent,
  useServices,
  type PricingPlan,
  type PricingService,
} from '@/admin/store';
import './pricing-admin.css';

function uid(prefix: string) {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function emptyPricingPlan(): PricingPlan {
  return {
    id: uid('pp'),
    name: '',
    info: '',
    price: '',
    timeline: '',
    features: [],
    cta: 'Start this project',
  };
}

export function PricingAdmin() {
  const [content] = useContent();
  const [services] = useServices();
  const confirm = useConfirm();
  const reduceMotion = useReducedMotion() ?? false;

  const defaults = contentStore.getDefaults().pricing ?? [];
  const published = content.pricing?.length ? content.pricing : defaults;

  const [draft, setDraft] = useState<PricingService[]>(published);
  const [selected, setSelected] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-seed the draft when the published content changes (save, reset,
  // cross-tab). Reconciled during render to avoid a cascading re-render;
  // `content` is a stable reference from the store.
  const [syncedContent, setSyncedContent] = useState(content);
  if (syncedContent !== content) {
    setSyncedContent(content);
    setDraft(content.pricing?.length ? content.pricing : defaults);
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(published);
  const sel = Math.min(selected, Math.max(services.length - 1, 0));
  const currentService = services[sel];
  const currentPricing = currentService
    ? draft.find((p) => p.slug === currentService.slug)
    : undefined;
  const currentPlans = currentPricing?.plans ?? [];

  // Stats — based on draft (all pricing data, not just current service)
  const totalPlans = draft.reduce((n, s) => n + s.plans.length, 0);
  const popular = draft.reduce((n, s) => n + s.plans.filter((p) => p.highlighted).length, 0);
  const incomplete = draft.reduce(
    (n, s) => n + s.plans.filter((p) => !p.name.trim() || !p.price.trim()).length,
    0,
  );

  /** Patch a specific plan within the current service's pricing. */
  const patchPlan = (pi: number, delta: Partial<PricingPlan>) => {
    const slug = currentService?.slug;
    if (!slug) return;
    setDraft((d) =>
      d.map((x, i) =>
        i === d.findIndex((p) => p.slug === slug)
          ? { ...x, plans: x.plans.map((p, j) => (j === pi ? { ...p, ...delta } : p)) }
          : x,
      ),
    );
  };

  const addPlan = () => {
    const slug = currentService?.slug;
    if (!slug) return;
    const plan = emptyPricingPlan();
    setDraft((d) => {
      const idx = d.findIndex((x) => x.slug === slug);
      if (idx >= 0) {
        return d.map((x, i) => (i === idx ? { ...x, plans: [...x.plans, plan] } : x));
      }
      return [
        ...d,
        {
          slug,
          label: currentService!.title,
          hue: currentService!.hue,
          plans: [plan],
        },
      ];
    });
  };

  const removePlan = (pi: number) => {
    const slug = currentService?.slug;
    if (!slug) return;
    setDraft((d) =>
      d.map((x) =>
        x.slug === slug ? { ...x, plans: x.plans.filter((_, idx) => idx !== pi) } : x,
      ),
    );
  };

  const clearPricing = async () => {
    if (!currentService) return;
    if (
      !(await confirm({
        title: `Remove pricing for "${currentService.title}"?`,
        body: 'This removes all rate cards for this service tab. The tab itself stays on /pricing — it just won\'t show any plans.',
        confirmLabel: 'Remove pricing',
        danger: true,
      }))
    )
      return;
    setDraft((d) => d.filter((x) => x.slug !== currentService.slug));
  };

  const save = async () => {
    setSaving(true);
    try {
      await patchContent({ pricing: draft });
      setToast('Saved.');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => setDraft(published);

  return (
    <AdminShell
      crumbs={[{ label: 'Pricing' }]}
      title="Pricing"
      sub="Rate cards shown on the public /pricing page. Select a service tab, edit its plans on the left, preview on the right, then Save to publish. Tab labels and accent colors are managed in Services."
      actions={
        <>
          <Link to="/pricing" className="adm-btn" target="_blank" rel="noreferrer">
            <Icon.ArrowUpRight size={16} /> View live
          </Link>
          {dirty && (
            <button className="adm-btn" onClick={discard} disabled={saving}>
              Discard
            </button>
          )}
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? 'Saving\u2026' : dirty ? 'Save changes' : 'Saved'}
          </Button>
        </>
      }
    >
      <div className="pxa-stats">
        <div className="adm-stat">
          <div className="adm-stat__label">Service tabs</div>
          <div className="adm-stat__num">{services.length}</div>
          <div className="adm-stat__delta">From Services manager</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat__label">Pricing tiers</div>
          <div className="adm-stat__num">{totalPlans}</div>
          <div className="adm-stat__delta">Cards across all tabs</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat__label">Popular</div>
          <div className="adm-stat__num">{popular}</div>
          <div className="adm-stat__delta">Badged + highlighted</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat__label">Needs attention</div>
          <div className="adm-stat__num">{incomplete}</div>
          <div className="adm-stat__delta">Missing name or price</div>
        </div>
      </div>

      <div className="adm-tabs">
        {services.map((s, i) => (
          <button
            key={s.slug}
            className={`adm-tab${sel === i ? ' is-active' : ''}`}
            style={{ '--hue': s.hue } as React.CSSProperties}
            onClick={() => setSelected(i)}
          >
            {s.title}
          </button>
        ))}
      </div>

      {!currentService ? (
        <div className="adm-card pxa-empty">
          <p>No services exist yet. Add one in the Services manager to start building rate cards.</p>
        </div>
      ) : (
        <div className="pxa-workspace">
          <div className="pxa-editor">
            <div className="adm-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="adm-label">
                Plans for{' '}
                <span style={{ color: currentService.hue }}>{currentService.title}</span>
              </div>
              {currentPlans.length === 0 && (
                <p className="pxa-empty__plans">
                  No plans yet. Add a card to start building rate cards for this service.
                </p>
              )}
            </div>

            {currentPlans.map((p, pi) => (
              <div key={p.id} className="adm-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="adm-label">Card {pi + 1}</div>
                  <button className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => removePlan(pi)}>
                    Remove
                  </button>
                </div>
                <div className="adm-row adm-row--3">
                  <TextField label="Name" value={p.name} onChange={(v) => patchPlan(pi, { name: v })} />
                  <TextField
                    label="Price"
                    hint="Free-form, e.g. $8k, from $24k, Custom."
                    value={p.price}
                    onChange={(v) => patchPlan(pi, { price: v })}
                  />
                  <TextField
                    label="Timeline"
                    hint="Shown after \u201cOne-time \u00b7\u201d."
                    value={p.timeline}
                    onChange={(v) => patchPlan(pi, { timeline: v })}
                  />
                </div>
                <TextArea label="Info line" value={p.info} onChange={(v) => patchPlan(pi, { info: v })} rows={2} />
                <StringList
                  label="Features"
                  values={p.features}
                  onChange={(v) => patchPlan(pi, { features: v })}
                  placeholder="e.g. Up to 6 pages"
                />
                <div className="adm-row adm-row--2">
                  <TextField label="Button label" value={p.cta} onChange={(v) => patchPlan(pi, { cta: v })} />
                  <Field label="Popular?">
                    <Toggle
                      checked={!!p.highlighted}
                      onChange={(v) => patchPlan(pi, { highlighted: v })}
                      label="Badge + glow \u2014 mark one card per tab"
                    />
                  </Field>
                </div>
              </div>
            ))}

            <button className="adm-btn" style={{ alignSelf: 'flex-start' }} onClick={addPlan}>
              + Add card
            </button>

            {currentPlans.length > 0 && (
              <button className="adm-btn adm-btn--danger" style={{ alignSelf: 'flex-start' }} onClick={clearPricing}>
                Remove all pricing for this tab
              </button>
            )}
          </div>

          <aside className="pxa-preview">
            <div className="pxa-preview__bar">
              <span>Live preview</span>
              <span className="pxa-preview__hue" style={{ color: currentService.hue }}>
                {currentService.title}
              </span>
            </div>
            <div
              className="pxa-preview__stage"
              style={{ '--hue': currentService.hue } as React.CSSProperties}
            >
              {currentPlans.length ? (
                <div className="pcx-grid">
                  {currentPlans.map((p) => (
                    <PricingCard key={p.id} plan={p} hue={currentService.hue} reduceMotion={reduceMotion} preview />
                  ))}
                </div>
              ) : (
                <p className="pxa-preview__empty">Add a card to see it here.</p>
              )}
            </div>
          </aside>
        </div>
      )}

      <Toast message={toast} onClear={() => setToast(null)} />
    </AdminShell>
  );
}
