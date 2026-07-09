'use client';
import { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { PlanData, PlanWeek, WEEKDAYS, WEEKDAY_SHORT, sessionParts } from '@/lib/runPlanGenerator';
import { sessionColor, sessionTarget } from './PlanWeekTable';

export interface OverviewStat {
  key: string;
  label: string;
  value: string;
}

interface Props {
  planData: PlanData;
  planTitle: string;
  overviewStats: OverviewStat[]; // every available overview stat — user can exclude any
  dateLabel: string;
  accentColor: string;
  onClose: () => void;
}

const CARD_W = 1600;
const CARD_H = 1000;
const WEEKS_PER_PAGE = 6;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function PlanShareBook({ planData, planTitle, overviewStats, dateLabel, accentColor, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);
  const [busy, setBusy] = useState<'idle' | 'rendering' | 'sharing'>('idle');
  const [err, setErr] = useState('');
  const [progress, setProgress] = useState('');
  const [included, setIncluded] = useState<Set<string>>(new Set(overviewStats.map(s => s.key)));
  const [pageIdx, setPageIdx] = useState(0); // 0 = overview, 1..N = table pages

  const weekPages = chunk(planData.weeks, WEEKS_PER_PAGE);
  const totalPages = 1 + weekPages.length;

  const fit = () => {
    const w = previewWrapRef.current?.parentElement?.clientWidth ?? 320;
    setScale(Math.min(0.4, (w - 8) / CARD_W));
  };
  useEffect(() => { fit(); }, []);

  const toggle = (key: string) => setIncluded(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const shownOverview = overviewStats.filter(s => included.has(s.key));

  const renderCurrent = async (): Promise<File | null> => {
    if (!cardRef.current) return null;
    const dataUrl = await toPng(cardRef.current, { width: CARD_W, height: CARD_H, pixelRatio: 1 });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], `sportlog-plan-${pageIdx + 1}.png`, { type: 'image/png' });
  };

  const renderAllPages = async (): Promise<File[]> => {
    const files: File[] = [];
    for (let i = 0; i < totalPages; i++) {
      setProgress(`Rendering page ${i + 1} of ${totalPages}…`);
      setPageIdx(i);
      // Let React commit the page change before capturing.
      await new Promise(r => setTimeout(r, 60));
      const file = await renderCurrent();
      if (file) files.push(new File([await file.arrayBuffer()], `sportlog-plan-${i + 1}.png`, { type: 'image/png' }));
    }
    setProgress('');
    return files;
  };

  const handleShare = async () => {
    setBusy('rendering');
    setErr('');
    try {
      const files = await renderAllPages();
      if (!files.length) throw new Error('Could not generate images.');
      setBusy('sharing');
      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files })) {
        await navigator.share({ files, title: 'SportLog Training Plan' });
      } else {
        downloadAll(files);
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') setErr(e.message || 'Could not share.');
    } finally {
      setBusy('idle');
    }
  };

  const handleDownload = async () => {
    setBusy('rendering');
    setErr('');
    try {
      const files = await renderAllPages();
      downloadAll(files);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not generate images.');
    } finally {
      setBusy('idle');
    }
  };

  const downloadAll = (files: File[]) => {
    files.forEach((file, i) => {
      setTimeout(() => {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, i * 350); // stagger so the browser doesn't block multi-file downloads
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-2xl bg-[#1E293B] border border-[#334155] rounded-2xl p-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Share Plan ({totalPages} {totalPages === 1 ? 'image' : 'images'})</h3>
          <button onClick={onClose} className="text-[#64748B] hover:text-white text-lg leading-none">✕</button>
        </div>

        {/* Page nav */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <button onClick={() => { fit(); setPageIdx(p => Math.max(0, p - 1)); }} disabled={pageIdx === 0} className="btn-secondary text-xs px-2 py-1 disabled:opacity-30">←</button>
          <span className="text-xs text-[#94A3B8]">{pageIdx === 0 ? 'Overview' : `Weeks page ${pageIdx} of ${weekPages.length}`} ({pageIdx + 1}/{totalPages})</span>
          <button onClick={() => { fit(); setPageIdx(p => Math.min(totalPages - 1, p + 1)); }} disabled={pageIdx === totalPages - 1} className="btn-secondary text-xs px-2 py-1 disabled:opacity-30">→</button>
        </div>

        {/* Preview (scaled, exact match to exported image) */}
        <div ref={previewWrapRef} className="mx-auto rounded-xl overflow-hidden border border-[#334155]" style={{ width: CARD_W * scale, height: CARD_H * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div ref={cardRef} style={{ width: CARD_W, height: CARD_H, position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)', background: '#0F172A' }}>
              {pageIdx === 0 ? (
                <OverviewPage planTitle={planTitle} stats={shownOverview} dateLabel={dateLabel} accentColor={accentColor} />
              ) : (
                <TablePage weeks={weekPages[pageIdx - 1]} pageNum={pageIdx} totalWeekPages={weekPages.length} planTitle={planTitle} accentColor={accentColor} />
              )}
            </div>
          </div>
        </div>

        {/* Overview stat toggles — only affect page 1 */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Overview stats (page 1)</p>
          <div className="flex flex-wrap gap-2">
            {overviewStats.map(s => (
              <button
                key={s.key}
                onClick={() => toggle(s.key)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${included.has(s.key) ? 'bg-blue-600 border-blue-600 text-white' : 'border-[#334155] text-[#64748B] hover:border-[#475569]'}`}
              >
                {included.has(s.key) ? '✓ ' : ''}{s.label} — {s.value}
              </button>
            ))}
          </div>
        </div>

        {progress && <p className="text-xs text-blue-400 mt-3">{progress}</p>}
        {err && <p className="text-xs text-red-400 mt-2">{err}</p>}

        <div className="flex gap-2 mt-4">
          <button onClick={handleShare} disabled={busy !== 'idle'} className="btn-primary flex-1">
            {busy === 'rendering' ? 'Generating…' : busy === 'sharing' ? 'Sharing…' : `↗ Share all ${totalPages} pages`}
          </button>
          <button onClick={handleDownload} disabled={busy !== 'idle'} className="btn-secondary px-4">⬇</button>
        </div>
      </div>
    </div>
  );
}

function OverviewPage({ planTitle, stats, dateLabel, accentColor }: { planTitle: string; stats: OverviewStat[]; dateLabel: string; accentColor: string }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(120deg, ${accentColor} 0%, #0F172A 70%)` }} />
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 100px' }}>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 26, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>Training Plan</div>
        <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 64, marginTop: 12, textAlign: 'center' }}>{planTitle}</div>
        <div style={{ width: 160, height: 3, background: 'rgba(255,255,255,0.5)', margin: '32px 0' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 28, maxWidth: 1200 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '24px 36px', textAlign: 'center', minWidth: 200 }}>
              <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 20, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 20, marginTop: 36 }}>{dateLabel}</div>
        <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, fontStyle: 'italic', marginTop: 8 }}>🏃 SportLog</div>
      </div>
    </div>
  );
}

function TablePage({ weeks, pageNum, totalWeekPages, planTitle, accentColor }: { weeks: PlanWeek[]; pageNum: number; totalWeekPages: number; planTitle: string; accentColor: string }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '36px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>{planTitle}</div>
        <div style={{ color: '#64748B', fontSize: 18 }}>Page {pageNum} of {totalWeekPages} &nbsp;·&nbsp; 🏃 SportLog</div>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateRows: `40px repeat(${weeks.length}, 1fr)`, gap: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `140px repeat(7, 1fr)`, gap: 4 }}>
          <div />
          {WEEKDAYS.map(d => (
            <div key={d} style={{ color: '#94A3B8', fontSize: 15, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase' }}>{WEEKDAY_SHORT[d]}</div>
          ))}
        </div>
        {weeks.map(w => (
          <div key={w.weekNumber} style={{ display: 'grid', gridTemplateColumns: `140px repeat(7, 1fr)`, gap: 4 }}>
            <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{w.weekNumber === 0 ? 'Lead-in' : `Week ${w.weekNumber}`}</div>
              {w.totalKm > 0 && <div style={{ color: accentColor, fontSize: 13, fontWeight: 600 }}>{w.totalKm} km</div>}
            </div>
            {WEEKDAYS.map((d) => {
              const s = w.days[d];
              if (s.beforeStart) return <div key={d} style={{ border: '1px dashed #293548', borderRadius: 8 }} />;
              const parts = sessionParts(s);
              return (
                <div key={d} style={{ background: '#0F172A', border: '1px solid #293548', borderRadius: 8, padding: '5px 7px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                  {parts.slice(0, 2).map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: sessionColor(p), flexShrink: 0 }} />
                      <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                    </div>
                  ))}
                  {parts[0] && sessionTarget(parts[0]) && (
                    <div style={{ color: '#64748B', fontSize: 11.5 }}>{sessionTarget(parts[0])}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
