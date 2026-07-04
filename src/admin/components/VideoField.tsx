import { useRef, useState } from 'react';
import { Field } from './Form';
import { uploadVideo } from '@/admin/store';
import { ApiError } from '@/lib/api';
import { bumpLibraryCache, useLibrary } from './ImageField';

export interface VideoFieldProps {
  label?: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  prefix?: string;
  showPreview?: boolean;
}

export function VideoField({
  label = 'Video URL',
  hint = 'Paste a URL, pick an existing video, or upload a new file (max 100 MB).',
  value,
  onChange,
  prefix = 'services',
  showPreview = true,
}: VideoFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFilter, setPickerFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { items, loading, refresh } = useLibrary();

  const videoItems = items.filter(
    (it) => it.content_type.startsWith('video/'),
  );

  const handleFile = async (file: File, force = false) => {
    setBusy(true);
    setError(null);
    try {
      const res = await uploadVideo(file, { prefix, force });
      onChange(res.url);
      bumpLibraryCache({
        url: res.url,
        key: res.key,
        name: res.name,
        content_type: res.content_type,
        size: res.size,
        uploaded_at: new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'duplicate_upload') {
        const details = err.details as
          | { existing_key?: string; existing_url?: string }
          | undefined;
        const useExisting = window.confirm(
          `A file named "${file.name}" already exists.\n\n` +
            'OK: reuse the existing file.\n' +
            'Cancel: upload as a new copy with a (1)/(2) suffix.',
        );
        if (useExisting && details?.existing_url) {
          onChange(details.existing_url);
        } else {
          await handleFile(file, true);
          return;
        }
      } else {
        setError(err instanceof Error ? err.message : 'Upload failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  const filtered = pickerFilter
    ? videoItems.filter((it) => it.name.toLowerCase().includes(pickerFilter.toLowerCase()))
    : videoItems;

  return (
    <Field label={label} hint={hint}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          className="adm-input"
          value={value}
          placeholder="https://… or pick from the library"
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: '1 1 200px', minWidth: 0 }}
        />
        <div className="adm-image-picker" ref={pickerRef}>
          <button
            type="button"
            className="adm-btn adm-btn--sm"
            onClick={() => {
              setPickerOpen((o) => !o);
              if (!items.length) void refresh();
            }}
            aria-haspopup="listbox"
            aria-expanded={pickerOpen}
            title="Choose an existing video"
          >
            Library ({videoItems.length}) ▾
          </button>
          {pickerOpen && (
            <div className="adm-image-picker__panel" role="listbox">
              <div className="adm-image-picker__search">
                <input
                  type="search"
                  className="adm-input"
                  placeholder="Filter by name…"
                  value={pickerFilter}
                  onChange={(e) => setPickerFilter(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="adm-btn adm-btn--sm adm-btn--ghost"
                  onClick={() => void refresh()}
                  disabled={loading}
                  title="Refresh library"
                >
                  ↻
                </button>
              </div>
              {loading && videoItems.length === 0 ? (
                <div className="adm-image-picker__empty">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="adm-image-picker__empty">
                  {videoItems.length === 0
                    ? 'No videos yet. Use the Upload button to add one.'
                    : 'No matches.'}
                </div>
              ) : (
                <ul className="adm-image-picker__list">
                  {filtered.slice(0, 60).map((it) => {
                    const isActive = value === it.url;
                    return (
                      <li key={it.key}>
                        <button
                          type="button"
                          className={`adm-image-picker__item${isActive ? ' is-active' : ''}`}
                          onClick={() => {
                            onChange(it.url);
                            setPickerOpen(false);
                          }}
                          role="option"
                          aria-selected={isActive}
                        >
                          <span className="adm-image-picker__thumb">
                            <video src={it.url} style={{ width: 48, height: 36, objectFit: 'cover' }} />
                          </span>
                          <span className="adm-image-picker__meta">
                            <span className="adm-image-picker__name" title={it.name}>
                              {it.name}
                            </span>
                            <span className="adm-image-picker__sub">{it.key}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {filtered.length > 60 && (
                <div className="adm-image-picker__more">
                  Showing 60 of {filtered.length}. Type to filter.
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="adm-btn adm-btn--sm"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? 'Uploading…' : 'Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
      {showPreview && value && (
        <div className="adm-image-field__preview">
          <video
            src={value}
            controls
            style={{ maxHeight: 240, width: '100%', objectFit: 'contain' }}
          />
        </div>
      )}
      {error && <p style={{ color: '#ff6b6b', fontSize: 12, margin: '6px 0 0' }}>{error}</p>}
    </Field>
  );
}
