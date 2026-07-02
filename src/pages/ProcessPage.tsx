import { useEffect, useRef, useState } from 'react';
import { NeonButton } from '@/components/ui/NeonButton';
import { GhostButton } from '@/components/ui/GhostButton';
import { scrollToElement, scrollToTop } from '@/lib/scroll';
import './ProcessPage.css';

interface Phase {
  n: string;
  title: string;
  weeks: string;
  blurb: string[];
  out: string;
  hue: string;
}

interface Week {
  range: string;
  phase: string;
  focus: string;
  hue: string;
}

interface FAQ {
  q: string;
  a: string;
}

const PHASES: Phase[] = [
  {
    n: '01',
    title: 'Discover',
    weeks: 'Week 1',
    blurb: [
      'We start with a working session, not a sales call. You walk us through the business, we map what exists, what’s broken, and what “done” looks like.',
      'By the end of the week you have a project plan with real dates, and we both know exactly what success means in numbers.',
    ],
    out: 'Project plan + success metrics',
    hue: '#ff813a',
  },
  {
    n: '02',
    title: 'Design',
    weeks: 'Week 2 – 4',
    blurb: [
      'Brand, layout, and flows take shape here. We design in the open — you see work-in-progress every week, not a big reveal at the end.',
      'Everything lands in a clickable prototype you can put in front of real users before a single line of production code is written.',
    ],
    out: 'Clickable prototype',
    hue: '#e06820',
  },
  {
    n: '03',
    title: 'Build',
    weeks: 'Week 5 – 7',
    blurb: [
      'We code the real thing: fast, accessible, and easy for your team to update. Weekly demos on a staging link, daily updates in Slack.',
      'No mystery sprints. If something slips, you hear it from us first, with a new date attached.',
    ],
    out: 'Staging site + weekly demos',
    hue: '#cc6622',
  },
  {
    n: '04',
    title: 'Launch + Grow',
    weeks: 'Week 8 +',
    blurb: [
      'Go-live is a checklist, not a cliff: DNS, analytics, redirects, training for your team, and a clean handoff of everything we made.',
      'Then we shift to growth — marketing, SEO, and iteration — or hand you the keys entirely. Your call.',
    ],
    out: 'Live site + growth plan',
    hue: '#ff9a5c',
  },
];

const WEEKS: Week[] = [
  { range: 'Week 1', phase: 'Discover', focus: 'Workshop, project plan, success metrics', hue: '#ff813a' },
  { range: 'Week 2 – 4', phase: 'Design', focus: 'Brand, layout, and a clickable prototype', hue: '#c06028' },
  { range: 'Week 5 – 7', phase: 'Build', focus: 'Code the site with weekly demos', hue: '#e06820' },
  { range: 'Week 8', phase: 'Launch', focus: 'Go live, train your team, hand off', hue: '#cc6622' },
  { range: 'Month 2+', phase: 'Grow', focus: 'Marketing, SEO, and ongoing support', hue: '#ff9a5c' },
];

const PROCESS_FAQS: FAQ[] = [
  { q: 'How soon can we start?', a: 'Usually 1 to 2 weeks after our intro call.' },
  { q: 'How do you keep things on track?', a: 'Weekly demos, daily updates in Slack. You always know where we are.' },
  { q: 'What if scope changes?', a: 'It happens. We log it, give you a new timeline, and you approve before we move.' },
  { q: 'Can you work with our team?', a: 'Yes. We often plug into existing teams and follow your conventions.' },
];

export function ProcessPage() {
  const [active, setActive] = useState(0);
  const blockRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    scrollToTop();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.idx));
          }
        });
      },
      { rootMargin: '-40% 0px -50% 0px' },
    );
    blockRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const jumpTo = (idx: number) => {
    const el = blockRefs.current[idx];
    if (!el) return;
    scrollToElement(el, -140);
  };

  return (
    <div className="prc">
      <header className="prc-hero">
        <div className="container">
          <div className="prc-hero__frame">
            <div className="prc-hero__annotations mono">
              <span>Zenova — process spec</span>
              <span>4 phases · 8 weeks</span>
              <span>Rev. 2026</span>
            </div>
            <h1 className="prc-hero__title display">
              A simple process,
              <br />
              <em>documented.</em>
            </h1>
            <p className="prc-hero__sub">
              Four phases. Clear deliverables. Weekly demos. This is the exact playbook every project runs
              on — no surprises, no mystery sprints.
            </p>
          </div>
        </div>
      </header>

      <section className="prc-phases">
        <div className="container prc-phases__grid">
          <aside className="prc-rail">
            <div className="prc-rail__label mono">Phases</div>
            {PHASES.map((p, i) => (
              <button
                key={p.n}
                type="button"
                className={`prc-rail__item${active === i ? ' is-active' : ''}`}
                style={{ '--hue': p.hue } as React.CSSProperties}
                onClick={() => jumpTo(i)}
              >
                <span className="prc-rail__num mono">{p.n}</span>
                <span className="prc-rail__title">{p.title}</span>
                <span className="prc-rail__weeks mono">{p.weeks}</span>
              </button>
            ))}
          </aside>

          <div className="prc-steps">
            {PHASES.map((p, i) => (
              <article
                key={p.n}
                data-idx={i}
                ref={(el) => {
                  blockRefs.current[i] = el;
                }}
                className="prc-step"
                style={{ '--hue': p.hue } as React.CSSProperties}
              >
                <div className="prc-step__head">
                  <span className="prc-step__num display">{p.n}</span>
                  <div>
                    <h2 className="prc-step__title display">{p.title}</h2>
                    <div className="prc-step__weeks mono">{p.weeks}</div>
                  </div>
                </div>
                {p.blurb.map((para) => (
                  <p key={para.slice(0, 24)} className="prc-step__body">
                    {para}
                  </p>
                ))}
                <div className="prc-step__out">
                  <span className="prc-step__out-label mono">Output →</span>
                  <span className="prc-step__out-value">{p.out}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="prc-timeline">
        <div className="container">
          <div className="prc-timeline__head">
            <span className="prc-timeline__label mono">Timeline — week by week</span>
          </div>
        </div>
        <div className="prc-timeline__scroller" data-lenis-prevent>
          <div className="prc-timeline__track">
            {WEEKS.map((w) => (
              <div key={w.range} className="prc-week" style={{ '--hue': w.hue } as React.CSSProperties}>
                <span className="prc-week__dot" />
                <span className="prc-week__range mono">{w.range}</span>
                <span className="prc-week__phase display">{w.phase}</span>
                <span className="prc-week__focus">{w.focus}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="prc-faq">
        <div className="container">
          <div className="prc-faq__label mono">Common questions</div>
          {PROCESS_FAQS.map((f) => (
            <div key={f.q} className="prc-faq__row">
              <h3 className="prc-faq__q display">{f.q}</h3>
              <p className="prc-faq__a">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="prc-cta">
        <div className="container prc-cta__inner">
          <div className="prc-cta__label mono">Next step</div>
          <h2 className="prc-cta__title display">
            Week 1 starts
            <br />
            with a call.
          </h2>
          <div className="prc-cta__actions">
            <NeonButton text="Book the call" onClick={() => { window.location.href = '/contact'; }} />
            <GhostButton text="See services" onClick={() => { window.location.href = '/services'; }} />
          </div>
        </div>
      </section>
    </div>
  );
}
