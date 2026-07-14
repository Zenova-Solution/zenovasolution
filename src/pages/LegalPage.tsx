import { useEffect, useMemo, useState } from 'react';
import type DOMPurifyType from 'dompurify';
import { DEFAULT_CONTENT, useContent } from '@/admin/store';
import { scrollToTop } from '@/lib/scroll';
import './LegalPage.css';

interface LegalPageProps {
  doc: 'privacy' | 'terms';
}

export function LegalPage({ doc }: LegalPageProps) {
  const [content] = useContent();
  const [purify, setPurify] = useState<typeof DOMPurifyType | null>(null);

  useEffect(() => {
    scrollToTop();
  }, [doc]);

  useEffect(() => {
    let active = true;
    import('dompurify').then((m) => {
      if (active) setPurify(m.default);
    });
    return () => {
      active = false;
    };
  }, []);

  const current = content.legal?.[doc];
  const fallback = DEFAULT_CONTENT.legal![doc];

  const title = current?.title || fallback.title;
  const updated = current?.updated || fallback.updated;
  // Prefer admin-authored rich body; fall back to the SEO default copy until
  // the backend has stored one. Sanitize before injecting to prevent XSS.
  const rawBody = current?.body?.trim() ? current.body : fallback.body;
  const bodyHtml = useMemo(() => {
    if (!purify) return '';
    return purify.sanitize(rawBody);
  }, [rawBody, purify]);

  return (
    <section className="legal">
      <div className="container legal__inner">
        <header className="legal__head">
          <h1 className="legal__title display reveal reveal-blur">{title}</h1>
          {updated && <p className="legal__updated mono reveal reveal-d1">{updated}</p>}
        </header>
        <article
          className="legal-prose reveal reveal-d2"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </div>
    </section>
  );
}
