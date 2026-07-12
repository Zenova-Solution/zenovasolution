import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { AdminShell } from '@/admin/components/AdminShell';
import { Button } from '@/admin/components/Button';
import { useConfirm } from '@/admin/components/confirm-context';
import { ColorField, Field, StringList, TextArea, TextField, Toast } from '@/admin/components/Form';
import { Toggle } from '@/components/ui/inputs';
import { Icon } from '@/components/icons/Icon';
import { PricingCard } from '@/components/pricing/PricingCard';
import {
  contentStore,
  patchContent,
  useContent,
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

function emptyPricingService(): PricingService {
  return {
    slug: uid('ps'),
    label: 'New service',
    hue: '#ff813a',
    plans: [emptyPricingPlan(), emptyPricingPlan(), emptyPricingPlan()],
  };
}

export function PricingAdmin() {
  const [content] = useContent();
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
  const sel = Math.min(selected, Math.max(draft.length - 1, 0));
  const svc = draft[sel];

  const totalPlans = draft.reduce((n, s) => n + s.plans.length, 0);
  const popular = draft.reduce((n, s) => n + s.plans.filter((p) => p.highlighted).length, 0);
  const incomplete = draft.reduce(
    (n, s) => n + s.plans.filter((p) => !p.name.trim() || !p.price.trim()).length,
    0,
  );

  const patchService = (i: number, delta: Partial<PricingService>) =>
    setDraft((d) => d.map((x, idx) => (idx === i ? { ...x, ...delta } : x)));
  const patchPlan = (pi: number, delta: Partial<PricingPlan>) =>
    setDraft((d) =>
      d.map((x, idx) =>
        idx === sel
          ? { ...x, plans: x.plans.map((p, j) => (j === pi ? { ...p, ...delta } : p)) }
          : x,
      ),
    );

  const moveService = (dir: -1 | 1) => {
    const j = sel + dir;
    if (j < 0 || j >= draft.length) return;
    const next = draft.slice();
    [next[sel], next[j]] = [next[j], next[sel]];
    setDraft(next);
    setSelected(j);
  };

  const addService = () => {
    setDraft((d) => [...d, emptyPricingService()]);
    setSelected(draft.length);
  };

  const removeService = async () => {
    if (
      !(await confirm({
        title: `Remove the "${svc.label}" tab?`,
        body: 'This removes the pricing tab and all of its plans.',
        confirmLabel: 'Remove tab',
        danger: true,
      }))
    )
      return;
    setDraft((d) => d.filter((_, idx) => idx !== sel));
    setSelected(Math.max(sel - 1, 0));
  };

  const addPlan = () => patchService(sel, { plans: [...svc.plans, emptyPricingPlan()] });
  const removePlan = (pi: number) =>
    patchService(sel, { plans: svc.plans.filter((_, idx) => idx !== pi) });

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
      sub="Rate cards shown on the public /pricing page. Edit on the left, preview on the right, then Save to publish."
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
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </Button>
        </>
      }
    >
      <div className="pxa-stats">
        <div className="adm-stat">
          <div className="adm-stat__label">Service tabs</div>
          <div className="adm-stat__num">{draft.length}</div>
          <div className="adm-stat__delta">Shown on /pricing</div>
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
        {draft.map((s, i) => (
          <button
            key={s.slug}
            className={`adm-tab${sel === i ? ' is-active' : ''}`}
            onClick={() => setSelected(i)}
          >
            {s.label || 'Untitled'}
          </button>
        ))}
        <button className="adm-btn adm-btn--sm" onClick={addService}>
          + Add service tab
        </button>
      </div>

      {!svc ? (
        <div className="adm-card pxa-empty">
          <p>No pricing tabs yet. Add one to start building your rate cards.</p>
          <button className="adm-btn" onClick={addService}>
            + Add your first service tab
          </button>
        </div>
      ) : (
        <div className="pxa-workspace">
          <div className="pxa-editor">
            <div className="adm-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <div className="adm-label">Service tab</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="adm-btn adm-btn--sm" onClick={() => moveService(-1)} disabled={sel === 0}>
                    ← Move
                  </button>
                  <button
                    className="adm-btn adm-btn--sm"
                    onClick={() => moveService(1)}
                    disabled={sel === draft.length - 1}
                  >
                    Move →
                  </button>
                  <button className="adm-btn adm-btn--sm adm-btn--danger" onClick={removeService}>
                    Remove tab
                  </button>
                </div>
              </div>
              <div className="adm-row adm-row--2">
                <TextField label="Tab label" value={svc.label} onChange={(v) => patchService(sel, { label: v })} />
                <ColorField
                  label="Accent color"
                  hint="Tints the tab pill, prices, and check marks for this service."
                  value={svc.hue}
                  onChange={(v) => patchService(sel, { hue: v })}
                />
              </div>
            </div>

            {svc.plans.map((p, pi) => (
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
                    hint="Shown after “One-time ·”."
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
                      label="Badge + glow — mark one card per tab"
                    />
                  </Field>
                </div>
              </div>
            ))}

            <button className="adm-btn" style={{ alignSelf: 'flex-start' }} onClick={addPlan}>
              + Add card
            </button>
          </div>

          <aside className="pxa-preview">
            <div className="pxa-preview__bar">
              <span>Live preview</span>
              <span className="pxa-preview__hue" style={{ color: svc.hue }}>
                {svc.label || 'Untitled'}
              </span>
            </div>
            <div className="pxa-preview__stage" style={{ '--hue': svc.hue } as React.CSSProperties}>
              {svc.plans.length ? (
                <div className="pcx-grid">
                  {svc.plans.map((p) => (
                    <PricingCard key={p.id} plan={p} hue={svc.hue} reduceMotion={reduceMotion} preview />
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
