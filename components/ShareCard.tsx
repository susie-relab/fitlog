'use client';
import { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import type { LucideIcon } from 'lucide-react';

export interface ShareStat {
  label: string;
  value: string;
}

interface Props {
  badge: string;       // small icon-badge caption, e.g. "RUNNING", "PERSONAL BEST"
  title: string;       // big headline under the icon
  icon: LucideIcon;    // shown when there's no route to draw
  /** Decoded route outline (e.g. from a Strava polyline), 0–100 coordinate space.
   *  When present, this replaces the icon with a route silhouette — wired for
   *  when Strava sync lands; unused by any caller yet. */
  routePoints?: { x: number; y: number }[];
  availableStats: ShareStat[]; // every stat with data — user picks which to show
  dateLabel: string;
  accentColor: string;
  onClose: () => void;
}

const CARD_W = 1080;
const CARD_H = 1920;
const MAX_STATS = 5;
const DEFAULT_STATS = 3;

export default function ShareCard({ badge, title, icon: Icon, routePoints, availableStats, dateLabel, accentColor, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(0.28);
  const [busy, setBusy] = useState<'idle' | 'rendering' | 'sharing'>('idle');
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState<string[]>(availableStats.slice(0, DEFAULT_STATS).map(s => s.label));

  useEffect(() => {
    const fit = () => {
      const w = previewWrapRef.current?.parentElement?.clientWidth ?? 320;
      setScale(Math.min(0.36, (w - 8) / CARD_W));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const shownStats = selected.map(label => availableStats.find(s => s.label === label)).filter(Boolean) as ShareStat[];

  const replaceAt = (i: number, newLabel: string) => setSelected(prev => prev.map((l, idx) => idx === i ? newLabel : l));
  const removeAt = (i: number) => setSelected(prev => prev.filter((_, idx) => idx !== i));
  const addStat = () => {
    const unused = availableStats.find(s => !selected.includes(s.label));
    if (unused) setSelected(prev => [...prev, unused.label]);
  };

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgUrl(url => { if (url) URL.revokeObjectURL(url); return URL.createObjectURL(file); });
  };

  const removePhoto = () => {
    setBgUrl(url => { if (url) URL.revokeObjectURL(url); return null; });
    if (fileRef.current) fileRef.current.value = '';
  };

  const render = async (): Promise<File | null> => {
    if (!cardRef.current) return null;
    setErr('');
    const dataUrl = await toPng(cardRef.current, { width: CARD_W, height: CARD_H, pixelRatio: 1 });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], 'sportlog-share.png', { type: 'image/png' });
  };

  const handleShare = async () => {
    setBusy('rendering');
    try {
      const file = await render();
      if (!file) throw new Error('Could not generate image.');
      setBusy('sharing');
      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'SportLog' });
      } else {
        downloadFile(file);
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') setErr(e.message || 'Could not share.');
    } finally {
      setBusy('idle');
    }
  };

  const handleDownload = async () => {
    setBusy('rendering');
    try {
      const file = await render();
      if (file) downloadFile(file);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not generate image.');
    } finally {
      setBusy('idle');
    }
  };

  const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const routePath = routePoints && routePoints.length > 1
    ? `M ${routePoints.map(p => `${p.x} ${p.y}`).join(' L ')}`
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-sm bg-[#1E293B] border border-[#334155] rounded-2xl p-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Share</h3>
          <button onClick={onClose} className="text-[#64748B] hover:text-white text-lg leading-none">✕</button>
        </div>

        {/* Preview (scaled, exact match to exported image) */}
        <div ref={previewWrapRef} className="mx-auto rounded-xl overflow-hidden border border-[#334155]" style={{ width: CARD_W * scale, height: CARD_H * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div ref={cardRef} style={{ width: CARD_W, height: CARD_H, position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
              {/* Background */}
              {bgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bgUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(150deg, ${accentColor} 0%, #0F172A 75%)` }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: bgUrl ? 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.82) 100%)' : 'rgba(0,0,0,0.12)' }} />

              {/* Content — centered vertical stack, matching the reference layout */}
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '120px 72px 80px' }}>
                {/* Icon or route silhouette */}
                <div style={{ width: 130, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {routePath ? (
                    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                      <path d={routePath} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <Icon color="#fff" strokeWidth={1.5} style={{ width: '100%', height: '100%' }} />
                  )}
                </div>

                {/* Badge / title */}
                <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, letterSpacing: 2, textTransform: 'uppercase', marginTop: 32, textAlign: 'center' }}>
                  {badge}
                </div>
                {title && title !== badge && (
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 30, fontWeight: 600, marginTop: 10, textAlign: 'center' }}>{title}</div>
                )}

                <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.5)', margin: '44px 0' }} />

                {/* Stats — vertical list, big number + small caption */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36, flex: 1, justifyContent: 'center' }}>
                  {shownStats.map((s, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 68, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 26, fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1.5 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.5)', margin: '36px 0 28px' }} />

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, fontStyle: 'italic', letterSpacing: 0.5 }}>SportLog</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22, marginTop: 8 }}>{dateLabel}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Background photo controls */}
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => fileRef.current?.click()} className="btn-secondary text-xs px-3 py-2 flex-1">
            {bgUrl ? '🖼 Change photo' : '🖼 Add photo from gallery'}
          </button>
          {bgUrl && <button onClick={removePhoto} className="text-xs text-[#64748B] hover:text-white px-2">Remove</button>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
        </div>

        {/* Stat picker — remove or swap any stat; not shown on the card itself */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Stats shown</p>
          <div className="flex flex-col gap-2">
            {selected.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <select value={label} onChange={e => replaceAt(i, e.target.value)} className="input flex-1 text-sm">
                  {availableStats.map(s => (
                    <option key={s.label} value={s.label} disabled={s.label !== label && selected.includes(s.label)}>
                      {s.label} — {s.value}
                    </option>
                  ))}
                </select>
                <button onClick={() => removeAt(i)} className="w-8 h-8 flex-shrink-0 rounded-lg border border-[#334155] text-[#64748B] hover:text-red-400 hover:border-red-800/50 text-sm">✕</button>
              </div>
            ))}
          </div>
          {selected.length < Math.min(availableStats.length, MAX_STATS) && (
            <button onClick={addStat} className="text-xs text-blue-400 hover:text-blue-300 mt-2">+ Add stat</button>
          )}
        </div>

        {err && <p className="text-xs text-red-400 mt-2">{err}</p>}

        <div className="flex gap-2 mt-4">
          <button onClick={handleShare} disabled={busy !== 'idle'} className="btn-primary flex-1">
            {busy === 'rendering' ? 'Generating…' : busy === 'sharing' ? 'Sharing…' : '↗ Share'}
          </button>
          <button onClick={handleDownload} disabled={busy !== 'idle'} className="btn-secondary px-4">⬇</button>
        </div>
      </div>
    </div>
  );
}
